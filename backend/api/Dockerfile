FROM python:3.11-slim

ENV POETRY_VERSION=1.8.3 \
    POETRY_VIRTUALENVS_CREATE=false \
    PIP_NO_CACHE_DIR=1

# Create non-root user early
RUN useradd -m appuser

# System deps (build tools kept minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential \
 && rm -rf /var/lib/apt/lists/*

# Poetry
RUN curl -sSL https://install.python-poetry.org | python3 - --version ${POETRY_VERSION}
ENV PATH="/root/.local/bin:${PATH}"

WORKDIR /app

# Use backend root as context so Poetry sees the lockfile
COPY pyproject.toml poetry.lock* /app/
RUN poetry install --no-root --only main

# Copy service code
COPY api/app /app/api/app

# Drop privileges
USER appuser

EXPOSE 8000
CMD ["uvicorn", "api.app.main:app", "--host", "0.0.0.0", "--port", "8000"]

