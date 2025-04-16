import asyncio
from pymodbus.server import ModbusTcpServer
from pymodbus.datastore import ModbusSlaveContext, ModbusServerContext
from pymodbus.datastore import ModbusSparseDataBlock
from pymodbus.payload import BinaryPayloadBuilder
from pymodbus.constants import Endian
import yaml
import random
import logging
from pathlib import Path
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("modbus_simulator")

def load_config():
    config_dir = os.getenv('CONFIG_DIR', '/config')
    config_path = Path(config_dir)
    
    with open(config_path / 'devices.yaml', 'r') as f:
        return yaml.safe_load(f)

# Configure logging from environment (optional)
log_level = os.getenv('LOG_LEVEL', 'INFO')
logging.basicConfig(level=log_level.upper())
logger = logging.getLogger("modbus_simulator")

    
def encode_custom_supplier_float(value):
    """ Encodes a float value into two 16-bit registers using the custom supplier format. """
    try:
        mantissa = int(value)
    except OverflowError:
        mantissa = 0x7FFF if value > 0 else -0x8000

    exponent = 0  # Assuming exponent is 0 for simplicity
    mantissa_sign = 1 if mantissa >= 0 else -1
    exp_sign = 1  # Positive exponent

    byte4 = 0
    if mantissa_sign == -1:
        byte4 |= 0x10  # Set bit 4 for negative mantissa
    if exp_sign == -1:
        byte4 |= 0x01  # Set bit 0 for negative exponent

    mantissa_abs = abs(mantissa)
    if mantissa_abs > 0xFFFF:
        mantissa_abs = 0xFFFF  # Clamp to 16 bits

    byte1 = (mantissa_abs >> 8) & 0xFF
    byte2 = mantissa_abs & 0xFF
    byte3 = exponent & 0xFF  # Exponent is 8 bits

    register0 = (byte1 << 8) | byte2
    register1 = (byte3 << 8) | byte4
    return [register0, register1]

def get_register_count(data_type):
    """ Determines the number of registers required for a given data type. """
    if data_type in ['float', 'custom_supplier_float']:
        return 2
    elif data_type == 'int32':
        return 2
    elif data_type == 'int16':
        return 1
    else:
        raise ValueError(f"Unsupported data_type: {data_type}")

class DynamicDataBlock(ModbusSparseDataBlock):
    def __init__(self, device_config, register_type):
        # Initialize with all zeros for a large address space
        super().__init__({x: 0 for x in range(0, 65536)})  # Full Modbus address space
        self.device_config = device_config
        self.register_type = register_type
        self.registers_map = self._build_registers_map()
        self._initialize_registers()
        self.update_task = None

    async def start_updating(self, interval=1.0):
        """Start periodic updates of register values"""
        while True:
            await asyncio.sleep(interval)
            self._update_registers()
            logger.debug(f"Updated registers at {datetime.now()}")

    def _update_registers(self):
        """Update all register values with new random data"""
        for addr, info in self.registers_map.items():
            values = self.generate_value(info)
            start_addr = addr
            self.setValues(start_addr, values)

    def _initialize_registers(self):
        """Initialize registers with correct multi-register values"""
        self._update_registers()
            
    def _build_registers_map(self):
        """ Builds a map of addresses to register configurations. """
        registers_map = {}
        for reg in self.device_config['registers']:
            if reg['register_type'] != self.register_type:
                continue
            data_type = reg.get('data_type', 'float')
            scale = reg.get('scale', 1)
            if reg.get('array', False):
                for elem in reg.get('elements', []):
                    addr = (elem['address'] + 2)  # "correção" do bug de offset
                    count = get_register_count(data_type)
                    registers_map[addr] = {
                        'count': count,
                        'data_type': data_type,
                        'scale': scale,
                        'register': reg,
                        'element': elem
                    }
            else:
                addr = (reg['address'] + 2)  # "correção" do bug de offset
                count = get_register_count(data_type)
                registers_map[addr] = {
                    'count': count,
                    'data_type': data_type,
                    'scale': scale,
                    'register': reg,
                    'element': None
                }
        return registers_map
    
    def generate_value(self, addr_info):
        reg = addr_info['register']
        name = reg['name']
        data_type = addr_info['data_type']
        scale = addr_info['scale']

        # Generate realistic base value
        if 'Fator' in name:
            base_value = 0.5 + random.uniform(-0.4, 0.4)
        elif 'THD' in name:
            base_value = 0.02 + random.uniform(-0.01, 0.01)
        elif 'Freq' in name:
            base_value = 60.0 + random.uniform(-0.2, 0.2)
        elif 'Tens' in name:
            base_value = 127.0 + random.uniform(-10, 10)
        elif 'Corrente' in name:
            base_value = 20.0 + random.uniform(-10, 10)
        elif 'Pot' in name:
            base_value = 10000.0 + random.uniform(-2000, 2000)
        else:
            base_value = 50.0 + random.uniform(-20, 20)

        raw_value = float(base_value / scale)

        # Encode based on data type
        if data_type == 'float':
            builder = BinaryPayloadBuilder(byteorder=Endian.BIG, wordorder=Endian.BIG)
            builder.add_32bit_float(raw_value)
            registers = builder.to_registers()
            
            if len(registers) != 2:
                logger.error(f"Invalid register count for float: {len(registers)}")
                registers = [0, 0]
                
            # DEBUG: Log the generated value and registers
            logger.debug(f"Generated {name}: value={raw_value}, registers={registers}")
            return registers
        elif data_type == 'custom_supplier_float':
            return encode_custom_supplier_float(raw_value)
        else:
            return [int(raw_value)]

    def getValues(self, address, count=1):
        """Override to handle requests for non-configured registers"""
        try:
            # Check if any part of the requested range is configured
            requested_range = range(address, address + count)
            configured = any(addr in self.registers_map for addr in requested_range)
            
            if not configured:
                logging.debug(f"Request for unconfigured registers: {address}-{address+count-1}")
                return [0] * count
                
            return super().getValues(address, count)
        except Exception as e:
            logging.error(f"Error in getValues: {e}")
            return [0] * count
        
async def run_simulated_device(device_config):
    """ Starts a Modbus TCP server for a given device configuration. """
    logger.info(f"Starting server for {device_config['name']} on {device_config['host']}:{device_config['port']}")

    hr_block = DynamicDataBlock(device_config, 'holding')
    ir_block = DynamicDataBlock(device_config, 'input')

    slave_context = ModbusSlaveContext(
        hr=hr_block,
        ir=ir_block
    )

    server_context = ModbusServerContext(slaves={device_config['slave_id']: slave_context}, single=False)

    server = ModbusTcpServer(
        context=server_context,
        address=(device_config['host'], device_config['port'])
    )

    # Start the update tasks for both blocks
    hr_task = asyncio.create_task(hr_block.start_updating())
    ir_task = asyncio.create_task(ir_block.start_updating())

    try:
        await server.serve_forever()
    finally:
        hr_task.cancel()
        ir_task.cancel()
        await asyncio.gather(hr_task, ir_task, return_exceptions=True)

async def main():
    """ Main function to start all simulated devices. """
    try:
        devices_config = load_config()
    except FileNotFoundError as e:
        logger.error(e)
        return
    except Exception as e:
        logger.error(f"Error loading configuration: {e}")
        return

    tasks = []
    for device in devices_config['devices']:
        task = asyncio.create_task(run_simulated_device(device))
        tasks.append(task)

    await asyncio.gather(*tasks)

if __name__ == '__main__':
    asyncio.run(main())