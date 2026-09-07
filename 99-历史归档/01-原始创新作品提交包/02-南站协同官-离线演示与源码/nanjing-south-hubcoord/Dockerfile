FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HUBCOORD_DATA_DIR=/data \
    HUBCOORD_PORT=8152 \
    HUBCOORD_TIMEZONE=Asia/Shanghai

RUN groupadd --system hubcoord && useradd --system --gid hubcoord --create-home hubcoord

WORKDIR /app/nanjing-south-hubcoord
COPY nanjing-south-hubcoord/requirements.txt /app/nanjing-south-hubcoord/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY nanjing-south-hubcoord/ /app/nanjing-south-hubcoord/
COPY data/ /app/data/
COPY contracts/ /app/contracts/
COPY eval/ /app/eval/

RUN mkdir -p /data && chown -R hubcoord:hubcoord /data /app
USER hubcoord

EXPOSE 8152
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import os, urllib.request; port=os.environ.get('HUBCOORD_PORT','8152'); urllib.request.urlopen('http://127.0.0.1:'+port+'/readyz', timeout=3)" || exit 1

CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]
