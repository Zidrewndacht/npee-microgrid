FROM python:3.13-slim

WORKDIR /app

# Install dependencies
COPY flask/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY flask /app
COPY config /app/config

# Create a non-root user and switch to it
RUN useradd -m flaskuser && chown -R flaskuser:flaskuser /app
USER flaskuser

# Gunicorn configuration
ENV GUNICORN_CMD_ARGS="--bind=0.0.0.0:5000 --workers=4 --timeout 120 --access-logfile -"

# Gunicorn configuration - bind to localhost only since Nginx will proxy
# ENV GUNICORN_CMD_ARGS="--bind=127.0.0.1:5000 --workers=4 --timeout 120 --access-logfile -"

EXPOSE 5000
CMD ["gunicorn", "app:app"]