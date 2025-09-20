FROM mcr.microsoft.com/vscode/devcontainers/python:3.11

# Node.js (for frontend dev)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Poetry for Python deps
RUN pip install poetry

# Utilities
RUN apt-get update && apt-get install -y \
    git curl wget unzip vim htop postgresql-client \
    && rm -rf /var/lib/apt/lists/*

USER vscode
WORKDIR /workspace
