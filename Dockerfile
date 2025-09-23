# Dockerfile for sofia-plotter backend
FROM --platform=linux/arm64 python:3.12-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Install the regular dependencies
COPY uv.lock ./
COPY pyproject.toml ./
RUN uv sync --locked

# Copy the application code
COPY app/ ./app/
COPY main.py ./

# Run it
CMD ["uv", "run", "python", "main.py"]