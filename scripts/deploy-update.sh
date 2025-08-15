#!/bin/bash

# Deployment Update Script for neuralsummary.com
# Run this on the VPS after pulling the latest changes

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Starting deployment update...${NC}"

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}Error: docker-compose.prod.yml not found!${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production file not found!${NC}"
    echo "Please ensure .env.production is present with your production configuration"
    exit 1
fi

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes from git...${NC}"
git pull origin main

# Stop current containers
echo -e "${YELLOW}Stopping current containers...${NC}"
docker-compose -f docker-compose.prod.yml down

# Rebuild images with new changes
echo -e "${YELLOW}Building new Docker images...${NC}"
./scripts/docker-build-prod.sh

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check service status
echo -e "${YELLOW}Checking service status...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Test WebSocket connectivity
echo -e "${YELLOW}Testing internal connectivity...${NC}"
docker-compose -f docker-compose.prod.yml exec -T nginx ping -c 1 api || echo -e "${YELLOW}Note: ping might not be available in alpine${NC}"

# Show logs
echo -e "${YELLOW}Recent logs from services:${NC}"
echo -e "${YELLOW}API logs:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=20 api

echo -e "${YELLOW}Nginx logs:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=10 nginx

echo -e "${GREEN}Deployment update complete!${NC}"
echo -e "${GREEN}The application should now be available at https://neuralsummary.com${NC}"
echo ""
echo -e "${YELLOW}To monitor logs in real-time:${NC}"
echo "docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo -e "${YELLOW}To check WebSocket connectivity:${NC}"
echo "1. Open https://neuralsummary.com in your browser"
echo "2. Open Developer Console (F12)"
echo "3. Look for 'WebSocket connected' message"
echo "4. Upload a file and watch for real-time progress updates"