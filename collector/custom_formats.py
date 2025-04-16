def decode_custom_supplier_float(registers):
    if len(registers) != 2:
        raise ValueError("custom_supplier_float requires exactly two registers")
    
    byte1 = (registers[0] >> 8) & 0xFF  # M_MSB
    byte2 = registers[0] & 0xFF         # M_LSB
    byte3 = (registers[1] >> 8) & 0xFF  # Exponent
    byte4 = registers[1] & 0xFF         # Flags

    mantissa = (byte1 << 8) | byte2
    exponent = byte3
    mantissa_sign = -1 if (byte4 & 0x10) else 1  # Bit 4
    exp_sign = -1 if (byte4 & 0x01) else 1       # Bit 0

    return mantissa_sign * mantissa * (10 ** (exp_sign * exponent))