# flask/gunicorn.conf.py
bind = "0.0.0.0:8000"
workers = 4
worker_class = "gthread"
threads = 4
timeout = 120
keepalive = 5