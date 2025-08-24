
#!/bin/bash

# Backend runner script with Python debugging support
# This script runs the backend with debugpy for remote debugging

# Set the Python path to use the virtual environment
export PYTHONPATH="$(pwd)/.venv/bin/python"

# Check if debugpy is installed
if ! python -c "import debugpy" 2>/dev/null; then
    echo "Installing debugpy for debugging support..."
    pip install debugpy
fi

# Default debug port
DEBUG_PORT=${1:-5678}

echo "Starting backend with debugging on port $DEBUG_PORT..."
echo "To attach debugger, connect to localhost:$DEBUG_PORT"
echo "Press Ctrl+C to stop"

# Run with debugpy for remote debugging
python -m debugpy --listen 0.0.0.0:$DEBUG_PORT --wait-for-client main.py
