# syntax=docker/dockerfile:1
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --create-home --uid 10001 --shell /usr/sbin/nologin rutero \
    && chown -R rutero:rutero /app
USER rutero

EXPOSE 8080

# Render inyecta PORT. En local se usa 8080 por defecto.
CMD ["sh", "-c", "exec gunicorn wsgi:app --workers 1 --threads 8 --timeout 120 --access-logfile - --bind 0.0.0.0:${PORT:-8080}"]
