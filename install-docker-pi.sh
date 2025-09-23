#!/bin/bash

# Update system
sudo apt update
sudo apt upgrade -y

# Install dependencies
sudo apt install -y curl

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo apt install -y docker-compose

# Test installation
docker --version
docker-compose --version

echo "Docker installation complete. Please reboot to apply group changes."
