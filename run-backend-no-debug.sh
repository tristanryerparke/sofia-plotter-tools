#!/bin/bash

# Backend runner script without debugging (faster startup)
# Use this when you don't need debugging capabilities

# Set the Python path to use the virtual environment
export PYTHONPATH="$(pwd)/.venv/bin/python"

echo "Starting backend without debugging..."
echo "Press Ctrl+C to stop"

# Run main.py directly
python main.py
