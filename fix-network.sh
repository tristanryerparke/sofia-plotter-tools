#!/bin/bash

# Network diagnostic and fix script for Raspberry Pi Docker setup
# This script helps ensure ethernet connectivity works without WiFi

echo "=== Raspberry Pi Network Diagnostic & Fix ==="
echo

# Check current network interfaces
echo "1. Current network interfaces:"
ip addr show | grep -E "^[0-9]+:|inet " | head -20
echo

# Check current routing table
echo "2. Current routing table:"
ip route show
echo

# Check if Docker is running
echo "3. Docker status:"
systemctl is-active docker
echo

# Check if containers are running
echo "4. Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo

# Function to set ethernet as priority interface
fix_ethernet_priority() {
    echo "5. Setting ethernet as priority interface..."
    
    # Get ethernet interface name (usually eth0)
    ETH_INTERFACE=$(ip link show | grep -E "^[0-9]+: e" | cut -d: -f2 | tr -d ' ' | head -1)
    
    if [ -n "$ETH_INTERFACE" ]; then
        echo "Found ethernet interface: $ETH_INTERFACE"
        
        # Set lower metric for ethernet (higher priority)
        sudo ip route add default via $(ip route show dev $ETH_INTERFACE | grep -oP 'via \K[0-9.]+' | head -1) dev $ETH_INTERFACE metric 100 2>/dev/null || true
        
        echo "Ethernet priority set"
    else
        echo "No ethernet interface found"
    fi
}

# Function to restart Docker networking
restart_docker_networking() {
    echo "6. Restarting Docker networking..."
    sudo systemctl restart docker
    echo "Docker restarted"
}

# Check if we should apply fixes
if [ "$1" = "--fix" ]; then
    fix_ethernet_priority
    restart_docker_networking
    
    echo
    echo "=== After fixes ==="
    echo "New routing table:"
    ip route show
    echo
    echo "Restarting containers..."
    docker-compose down
    docker-compose up -d
    echo "Done!"
else
    echo "Run with --fix to apply network fixes"
    echo "Usage: $0 --fix"
fi

echo
echo "=== Network Test Commands ==="
echo "Test backend:  curl http://$(hostname -I | awk '{print $1}'):8090"
echo "Test frontend: curl http://$(hostname -I | awk '{print $1}'):8091"
echo