# Dockerfile for sofia-plotter backend
FROM --platform=linux/arm64 ghcr.io/astral-sh/uv:python3.12-bookworm-slim

# Install the regular dependencies
COPY uv.lock ./
COPY pyproject.toml ./
RUN uv sync --locked

# Copy the application code
COPY app/ ./app/
COPY main.py ./
COPY plot.toml ./

EXPOSE 8090

# Run it
CMD ["uv", "run", "python", "main.py"]