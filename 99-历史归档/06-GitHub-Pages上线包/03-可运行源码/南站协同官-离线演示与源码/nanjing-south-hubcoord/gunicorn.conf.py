import os

bind = f"0.0.0.0:{os.environ.get('HUBCOORD_PORT', '8152')}"
workers = int(os.environ.get("HUBCOORD_WORKERS", "2"))
threads = int(os.environ.get("HUBCOORD_THREADS", "4"))
timeout = 30
graceful_timeout = 30
accesslog = "-"
errorlog = "-"
capture_output = True
preload_app = True
