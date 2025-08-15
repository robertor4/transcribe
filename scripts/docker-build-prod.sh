#!/bin/bash

# Production Docker Build Script
# This script ensures environment variables are properly loaded for Docker builds

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Loading environment variables...${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production file not found!${NC}"
    echo "Please create .env.production with your production configuration"
    exit 1
fi

# Export all environment variables from .env.production
export $(cat .env.production | grep -v '^#' | xargs)

echo -e "${GREEN}Environment variables loaded${NC}"

# Build with docker-compose
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build "$@"

echo -e "${GREEN}Build complete!${NC}"