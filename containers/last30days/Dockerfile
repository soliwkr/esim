FROM python:3.12-slim-bookworm

ARG LAST30DAYS_COMMIT=249c7a4c040558a903d6838dee31012980d4946d

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HOME=/home/app \
    PATH=/home/app/.local/bin:${PATH} \
    SETUP_COMPLETE=1 \
    FROM_BROWSER=none

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git \
    && rm -rf /var/lib/apt/lists/* \
    && python -m pip install --no-cache-dir requests yt-dlp

RUN useradd --create-home --uid 10001 app

WORKDIR /opt
RUN git clone --filter=blob:none https://github.com/mvanhorn/last30days-skill.git \
      /opt/last30days-skill \
    && git -C /opt/last30days-skill checkout "${LAST30DAYS_COMMIT}" \
    && chown -R app:app /opt/last30days-skill /home/app

COPY server.py /app/server.py
RUN chown -R app:app /app

USER app
WORKDIR /app
EXPOSE 8080

CMD ["python", "/app/server.py"]
