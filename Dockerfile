FROM python:3.12-slim-bookworm
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py providers.py modules.json ./
COPY static ./static
RUN mkdir -p /data && useradd -u 10001 kenjitsu && chown kenjitsu /data
USER kenjitsu
EXPOSE 8140
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8140", "--no-access-log", "--proxy-headers", "--forwarded-allow-ips", "*", "--timeout-graceful-shutdown", "30"]
