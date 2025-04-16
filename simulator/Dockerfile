FROM python:3.13-slim

WORKDIR /app

# Install dependencies
COPY simulator/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only simulator files - custom_formats from collector folder to avoid duplicating it.
COPY simulator/modbus_simulator.py .
COPY collector/custom_formats.py . 
COPY config /config

# Environment variables
ENV CONFIG_DIR=/config \
    PYTHONUNBUFFERED=1

# Force immediate exit on SIGTERM
STOPSIGNAL SIGKILL

WORKDIR /app
COPY . .

CMD ["python", "modbus_simulator.py"]
