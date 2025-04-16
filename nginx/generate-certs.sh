#!/bin/sh
mkdir -p /certs
if [ ! -f /certs/cert.pem ]; then
  echo "Generating new self-signed certificates..."
  apk add --no-cache openssl
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /certs/key.pem \
    -out /certs/cert.pem \
    -subj "/CN=localhost"
  chmod 644 /certs/*.pem
  echo "Certificates generated successfully"
else
  echo "Certificates already exist"
fi