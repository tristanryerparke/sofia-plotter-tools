# Dockerfile for sofia-plotter frontend

FROM --platform=linux/arm64 oven/bun:latest

WORKDIR /frontend

# Copy only the files needed for dependency installation first
COPY package.json bun.lock ./

# Install dependencies (this layer will be cached unless package files change)
RUN bun install

# Copy the rest of the frontend source code
COPY . .

# Build the frontend
RUN bun run build

# Expose the port the app runs on
EXPOSE 8091

# Run it
CMD ["bunx", "serve", "-s", "dist", "-l", "8091"]
