FROM python:3.13-slim

WORKDIR /app

# Install dependencies
COPY collector/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY collector/modbus_collector.py .
COPY collector/custom_formats.py .
COPY config /config

# Environment variables
ENV CONFIG_DIR=/config \
    PYTHONUNBUFFERED=1
    
# Command to run both services
CMD ["python", "modbus_collector.py"]