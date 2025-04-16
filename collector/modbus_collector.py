import asyncio
import yaml
import logging
from datetime import datetime, timezone
from pymodbus.client import AsyncModbusTcpClient
from pymodbus.exceptions import ModbusException
import motor.motor_asyncio
import struct
from custom_formats import decode_custom_supplier_float
import logging
from pathlib import Path
import math
import os

def load_config():
    config_dir = os.getenv('CONFIG_DIR', '/config')
    config_path = Path(config_dir)
    
    with open(config_path / 'settings.yaml', 'r') as f:
        settings = yaml.safe_load(f)
    
    with open(config_path / 'devices.yaml', 'r') as f:
        devices = yaml.safe_load(f)
    
    return settings, devices

# Load config'
system_settings, devices_config = load_config()

# MongoDB setup - Updated to match new YAML structure
mongo_client = motor.motor_asyncio.AsyncIOMotorClient(
    system_settings['mongodb']['uri'],
    serverSelectionTimeoutMS=5000
)

db = mongo_client[system_settings['mongodb'].get('database_name', 'missing_database_name')]

# Get collector settings with defaults
polling_interval = system_settings['collector'].get('polling_interval', 10)
retry_interval = system_settings['collector'].get('retry_interval', 30)
log_level = system_settings['collector'].get('log_level', 'INFO')

# Configure logging
logging.basicConfig(level=log_level.upper())
logger = logging.getLogger("modbus_collector")
# Decoders
def get_register_count(data_type):
    type_map = {
        'float': 2,
        'custom_supplier_float': 2,
        'int32': 2,
        'uint32': 2,
        'int16': 1,
        'uint16': 1
    }
    return type_map.get(data_type, 2)  # default to 2 for unknown types

def decode_value(data_type, registers): #WTF, clean up
    if not registers:
        return None

    try:    #autodetect endianness and word order
        if data_type == 'float':
            if len(registers) != 2:
                return None

            # DEBUG: Log the raw registers
            logger.debug(f"Decoding float registers: {registers}")

            # Try all possible byte/word order combinations
            byte_orders = [
                ('>', 'big-endian'),  # Standard Modbus
                ('<', 'little-endian'),
            ]
            word_orders = [
                (True, 'high-word-first'),
                (False, 'low-word-first'),
            ]

            valid_results = []
            for byte_order, byte_desc in byte_orders:
                for swap_words, word_desc in word_orders:
                    try:
                        if swap_words:
                            regs = [registers[1], registers[0]]
                        else:
                            regs = [registers[0], registers[1]]
                        
                        # Pack into bytes
                        byte_string = struct.pack(f'{byte_order}HH', *regs)
                        value = struct.unpack(f'{byte_order}f', byte_string)[0]
                        
                        # Validate the result makes sense
                        if math.isfinite(value) and abs(value) < 1e6:  # Reasonable range
                            valid_results.append((value, f"{byte_desc}, {word_desc}"))
                    except Exception as e:
                        continue

            if not valid_results:
                return None

            # If we have multiple valid results, prefer standard Modbus order
            for val, desc in valid_results:
                if desc == "big-endian, high-word-first":
                    # print(f"Using standard Modbus float: {val}")
                    return val

            # Fallback to first valid result
            # print(f"Using fallback float format: {valid_results[0][1]}")
            return valid_results[0][0]

        # ... rest of the decode_value function remains the same ...
        elif data_type == 'custom_supplier_float':
            return decode_custom_supplier_float(registers)
            
        elif data_type == 'int32':
            if len(registers) != 2:
                return None
            byte_string = struct.pack('>HH', registers[0], registers[1])
            return struct.unpack('>i', byte_string)[0]
            
        elif data_type == 'uint32':
            if len(registers) != 2:
                return None
            byte_string = struct.pack('>HH', registers[0], registers[1])
            return struct.unpack('>I', byte_string)[0]
            
        elif data_type == 'int16':
            if not registers:
                return None
            return registers[0] - 65536 if registers[0] >= 32768 else registers[0]
            
        elif data_type == 'uint16':
            if not registers:
                return None
            return registers[0]
            
        else:
            raise ValueError(f"Unsupported data type: {data_type}")
            
    except (struct.error, IndexError, ValueError) as e:
        logging.debug(f"Decode error for {data_type}: {e}")
        return None
    
async def poll_device(device_config, polling_interval, retry_interval):
    while True:
        client = None
        try:
            # Initialize MongoDB connection with retries
            max_mongo_retries = 3
            for attempt in range(max_mongo_retries):
                try:
                    mongo_client = motor.motor_asyncio.AsyncIOMotorClient(
                        system_settings['mongodb']['uri'],
                        serverSelectionTimeoutMS=5000
                    )
                    await mongo_client.server_info()  # Test connection
                    db = mongo_client[system_settings.get('database_name', 'modbus_data')]
                    break
                except Exception as e:
                    if attempt == max_mongo_retries - 1:
                        raise
                    logging.warning(f"MongoDB connection failed (attempt {attempt+1}): {e}")
                    await asyncio.sleep(2)

            client = AsyncModbusTcpClient(
                host=device_config['host'],
                port=device_config['port'],
                retries=3,
                reconnect_delay=5,
                reconnect_delay_max=30,
                timeout=10
            )
            await client.connect()
            
            if not client.connected:
                raise ModbusException("Connection failed")

            logging.info(f"Connected to {device_config['name']}")

            while True:
                document = {'datetime': datetime.now(timezone.utc)}
                read_errors = 0
                
                for register in device_config['registers']:
                    label = register['label']  # Get the label first
                    try:
                        data_type = register.get('data_type', 'float')
                        scale = register.get('scale', 1)
                        is_array = register.get('array', False)
                        reg_type = register['register_type']

                        read_func = {
                            'holding': client.read_holding_registers,
                            'input': client.read_input_registers
                        }.get(reg_type)

                        if not read_func:
                            logging.error(f"Unsupported register type {reg_type}")
                            continue

                        if is_array:
                            elements = register.get('elements', [])
                            values = []
                            for element in elements:
                                try:
                                    addr = (element['address'])
                                    count = get_register_count(data_type)
                                    response = await read_func(address=addr, count=count, slave=device_config['slave_id'])
                                    
                                    if response.isError():
                                        logging.debug(f"Read error for {label} element {element['name']} at address {addr}")
                                        values.append(None)
                                        read_errors += 1
                                        continue
                                        
                                    value = decode_value(data_type, response.registers)
                                    if value is not None:
                                        value = value * scale
                                    values.append(value)
                                except Exception as e:
                                    logging.debug(f"Error reading array element {element.get('name')}: {str(e)}")
                                    values.append(None)
                                    read_errors += 1
                            
                            # Only add the array to document if we have at least one valid value
                            if any(v is not None for v in values):
                                document[label] = values
                        else:
                            try:
                                addr = (register['address'])
                                count = get_register_count(data_type)
                                response = await read_func(address=addr, count=count, slave=device_config['slave_id'])
                                
                                if response.isError():
                                    logging.debug(f"Read error for {label} at address {addr}")
                                    read_errors += 1
                                    continue
                                    
                                value = decode_value(data_type, response.registers)
                                if value is not None:
                                    document[label] = value * scale
                            except Exception as e:
                                logging.debug(f"Error reading register {label}: {str(e)}")
                                read_errors += 1

                    except Exception as e:
                        logging.error(f"Error processing register {label}: {e}")
                        read_errors += 1

                if read_errors > 0:
                    logging.warning(f"Completed with {read_errors} read errors for {device_config['name']}")

                try:
                    if document:  # Only insert if we have data
                        await db[device_config['collection']].insert_one(document)
                        logging.debug(f"Data inserted for {device_config['name']}")
                except Exception as e:
                    logging.error(f"MongoDB insert failed: {e}")

                await asyncio.sleep(polling_interval)

        except ModbusException as e:
            logging.error(f"Modbus error: {e}")
            await asyncio.sleep(retry_interval)
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
            await asyncio.sleep(retry_interval)
        finally:
            if client:
                client.close()
                logging.info(f"Disconnected from {device_config['name']}")
    
async def get_mongo_connection():
    """Handle MongoDB connection with retries and proper error reporting"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            client = motor.motor_asyncio.AsyncIOMotorClient(
                system_settings['mongodb']['uri'],
                serverSelectionTimeoutMS=5000
            )
            await client.server_info()  # Test connection
            return client
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"MongoDB connection failed after {max_retries} attempts")
                raise
            logger.warning(f"MongoDB connection attempt {attempt + 1} failed: {e}")
            await asyncio.sleep(2)

# Then modify your main() function to use this:
async def main():
    try:
        mongo_client = await get_mongo_connection()
        db = mongo_client[system_settings['mongodb'].get('database_name', 'modbus_data')]
        
        polling_interval = system_settings['collector'].get('polling_interval', 10)
        retry_interval = system_settings['collector'].get('retry_interval', 30)
        
        tasks = [asyncio.create_task(poll_device(dev, polling_interval, retry_interval)) 
                for dev in devices_config['devices']]
        await asyncio.gather(*tasks)
    except Exception as e:
        logger.error(f"Fatal error: {e}")

if __name__ == '__main__':
    logging.basicConfig(level=system_settings.get('log_level', 'INFO').upper())
    asyncio.run(main())