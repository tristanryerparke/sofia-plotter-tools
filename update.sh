#!/bin/bash
git pull                             # Update the code
docker compose down                  # Stop the containers
docker compose up --build -d         # Start the containers
docker image prune -f                # Remove unused images
docker system prune -f               # Remove unused containers, networks, and volumes