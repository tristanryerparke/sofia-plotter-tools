#!/bin/bash

# Frontend runner script using Bun
# This script runs the frontend development server with hot reloading

# Change to frontend directory
cd frontend

echo "Starting frontend development server..."
echo "Press Ctrl+C to stop"

# Run Bun dev server with hot reloading
bun --hot src/index.tsx
