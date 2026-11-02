# =============================================================================
# Vitrin Backend - Multi-stage Dockerfile
#   Stage 1 (builder): install Python packages into an isolated venv
#   Stage 2 (runtime): minimal image with only runtime deps + venv copy
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: builder
# -----------------------------------------------------------------------------
FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Build-time deps (compilers + headers). These stay OUT of the final image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Isolated venv so we can copy it wholesale into the runtime stage
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy only requirement files first to maximize layer caching
COPY requirements/ requirements/
RUN pip install --upgrade pip && \
    pip install -r requirements/production.txt


# -----------------------------------------------------------------------------
# Stage 2: runtime
# -----------------------------------------------------------------------------
FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# Runtime-only libraries (no compilers, no -dev packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libjpeg62-turbo \
    libfreetype6 \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

# Copy the prepared venv from the builder stage
COPY --from=builder /opt/venv /opt/venv

WORKDIR /app

# Copy application code last (max cache reuse)
COPY . .

# Create required dirs, non-root user, exec bit on entrypoint
RUN mkdir -p /app/staticfiles /app/media /app/logs \
    && useradd -m -u 1000 appuser \
    && chmod +x /app/docker-entrypoint.sh \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
