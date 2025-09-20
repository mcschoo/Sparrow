FROM python:3.11-slim

ENV POETRY_VERSION=1.8.3 \
    POETRY_VIRTUALENVS_CREATE=false \
    PIP_NO_CACHE_DIR=1

RUN useradd -m appuser

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential \
 && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://install.python-poetry.org | python3 - --version ${POETRY_VERSION}
ENV PATH="/root/.local/bin:${PATH}"

WORKDIR /app

COPY pyproject.toml poetry.lock* /app/
RUN poetry install --no-root --only main

COPY shared /app/shared
RUN pip install -e /app/shared

COPY coordinator/app /app/coordinator/app

USER appuser

EXPOSE 8001
CMD ["uvicorn", "coordinator.app.main:app", "--host", "0.0.0.0", "--port", "8001"]

