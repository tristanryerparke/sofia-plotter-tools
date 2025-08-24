#!/bin/bash

# Full development environment runner
# This script runs both backend and frontend simultaneously

# Function to cleanup background processes on exit
cleanup() {
    echo "Stopping all processes..."
    jobs -p | xargs -r kill
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

echo "Starting full development environment..."
echo "Backend will be available with debugging on port 5678"
echo "Frontend will start after backend is ready"
echo "Press Ctrl+C to stop all processes"

# Start backend in background
./run-backend.sh 5678 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend in background
./run-frontend.sh &
FRONTEND_PID=$!

echo "Both services started:"
echo "  Backend PID: $BACKEND_PID (debugging on port 5678)"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "To attach Python debugger:"
echo "  1. In VSCode: Run & Debug > Attach to Python"
echo "  2. Use host: localhost, port: 5678"
echo ""

# Wait for both processes
wait
