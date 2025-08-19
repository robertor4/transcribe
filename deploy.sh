#!/bin/bash

# Production Deployment Script for Neural Summary
# This script deploys the latest changes to the production server

set -e  # Exit on error

echo "🚀 Starting Neural Summary Production Deployment..."
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production file not found!${NC}"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

# Verify Firebase Analytics Measurement ID is set
if ! grep -q "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=" .env.production || grep -q "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$" .env.production; then
    echo -e "${YELLOW}Warning: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is not set in .env.production${NC}"
    echo "Analytics will not work without this. Continue anyway? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

echo -e "${GREEN}1. Pulling latest changes from git...${NC}"
git pull origin main

echo -e "${GREEN}2. Installing dependencies...${NC}"
npm install

echo -e "${GREEN}3. Building shared package...${NC}"
npm run build:shared

echo -e "${GREEN}4. Building production bundles...${NC}"
npm run build

echo -e "${GREEN}5. Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build

echo -e "${GREEN}6. Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

echo -e "${GREEN}7. Starting production services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}8. Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo -e "${GREEN}9. Checking service health...${NC}"

# Check Traefik
if docker-compose -f docker-compose.prod.yml ps | grep -q "traefik.*Up"; then
    echo "✅ Traefik is running"
else
    echo -e "${RED}❌ Traefik is not running${NC}"
fi

# Check Redis
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is healthy"
else
    echo -e "${RED}❌ Redis is not responding${NC}"
fi

# Check API
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health | grep -q "200"; then
    echo "✅ API is healthy"
else
    echo -e "${YELLOW}⚠️  API health check failed (this might be normal if using Docker networking)${NC}"
fi

# Check Web
if docker-compose -f docker-compose.prod.yml ps | grep -q "web.*Up"; then
    echo "✅ Web frontend is running"
else
    echo -e "${RED}❌ Web frontend is not running${NC}"
fi

echo ""
echo -e "${GREEN}10. Viewing container logs (last 20 lines)...${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Your application should be available at:"
echo "  - https://neuralsummary.com"
echo "  - https://www.neuralsummary.com"
echo ""
echo "Traefik Dashboard (remove in production):"
echo "  - http://your-server-ip:8080"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f [service]"
echo ""
echo "To stop services:"
echo "  docker-compose -f docker-compose.prod.yml down"
echo ""
echo -e "${YELLOW}⚠️  Important: Make sure to:${NC}"
echo "  1. Set NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID in .env.production"
echo "  2. Verify SSL certificates are properly generated"
echo "  3. Check Firebase Console for analytics data"
echo "  4. Remove Traefik dashboard port (8080) for production"
echo "================================================"