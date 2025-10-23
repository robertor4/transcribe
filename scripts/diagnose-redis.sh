#!/bin/bash

# Redis Diagnostic Script
# Run this script on the production server to diagnose Redis issues
# Usage: ssh root@server 'bash -s' < scripts/diagnose-redis.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Redis Diagnostic Report${NC}"
echo -e "${BLUE}=========================${NC}"
echo ""

# Check if Redis container exists
echo -e "${YELLOW}1. Checking if Redis container exists...${NC}"
if docker ps -a --format '{{.Names}}' | grep -q "^transcribe-redis$"; then
    REDIS_STATUS=$(docker inspect transcribe-redis --format='{{.State.Status}}' 2>/dev/null)
    echo -e "${GREEN}✅ Container exists${NC}"
    echo "   Status: $REDIS_STATUS"
else
    echo -e "${RED}❌ Container 'transcribe-redis' not found${NC}"
    echo ""
    echo "Available containers:"
    docker ps -a --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

echo ""

# Check if Redis is running
echo -e "${YELLOW}2. Checking if Redis is running...${NC}"
if [ "$REDIS_STATUS" = "running" ]; then
    echo -e "${GREEN}✅ Container is running${NC}"

    # Show container details
    CREATED=$(docker inspect transcribe-redis --format='{{.Created}}')
    STARTED=$(docker inspect transcribe-redis --format='{{.State.StartedAt}}')
    echo "   Created: $CREATED"
    echo "   Started: $STARTED"
else
    echo -e "${RED}❌ Container is not running (Status: $REDIS_STATUS)${NC}"
    echo ""
    echo "Recent logs:"
    docker logs --tail 20 transcribe-redis 2>&1
    exit 1
fi

echo ""

# Check Redis connectivity
echo -e "${YELLOW}3. Testing Redis connectivity...${NC}"
if docker exec transcribe-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}✅ Redis is responding to PING${NC}"
else
    echo -e "${RED}❌ Redis is not responding to PING${NC}"
    echo ""
    echo "Trying alternative connection methods..."

    # Try without pipe to see actual output
    echo "Direct exec output:"
    docker exec transcribe-redis redis-cli ping 2>&1 || true

    # Check if redis-cli exists
    echo ""
    echo "Checking if redis-cli is available in container:"
    docker exec transcribe-redis which redis-cli 2>&1 || true

    # Check Redis process
    echo ""
    echo "Checking Redis processes in container:"
    docker exec transcribe-redis ps aux 2>&1 | grep redis || true
fi

echo ""

# Check Redis health via Docker inspect
echo -e "${YELLOW}4. Checking Docker health status...${NC}"
HEALTH=$(docker inspect transcribe-redis --format='{{.State.Health.Status}}' 2>/dev/null || echo "no healthcheck")
if [ "$HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✅ Docker reports: healthy${NC}"
elif [ "$HEALTH" = "no healthcheck" ]; then
    echo -e "${YELLOW}⚠️  No healthcheck configured in container${NC}"
else
    echo -e "${RED}❌ Docker reports: $HEALTH${NC}"

    # Show healthcheck logs
    echo ""
    echo "Healthcheck logs:"
    docker inspect transcribe-redis --format='{{range .State.Health.Log}}{{.Output}}{{end}}' 2>&1 || true
fi

echo ""

# Check network connectivity
echo -e "${YELLOW}5. Checking network connectivity...${NC}"
NETWORK=$(docker inspect transcribe-redis --format='{{range $net,$v := .NetworkSettings.Networks}}{{$net}}{{end}}')
IP=$(docker inspect transcribe-redis --format='{{range $net,$v := .NetworkSettings.Networks}}{{$v.IPAddress}}{{end}}')
echo "   Network: $NETWORK"
echo "   IP Address: $IP"

# Try to ping Redis from another container
if docker ps --format '{{.Names}}' | grep -q "^transcribe-api$"; then
    echo ""
    echo "   Testing connection from API container:"
    if docker exec transcribe-api sh -c 'command -v nc >/dev/null && nc -zv transcribe-redis 6379' 2>&1 | grep -q "open"; then
        echo -e "   ${GREEN}✅ API can reach Redis on port 6379${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Cannot test connection (nc not available or connection failed)${NC}"
    fi
fi

echo ""

# Check Redis logs
echo -e "${YELLOW}6. Recent Redis logs:${NC}"
docker logs --tail 30 transcribe-redis 2>&1

echo ""

# Check Redis configuration
echo -e "${YELLOW}7. Redis configuration:${NC}"
docker exec transcribe-redis redis-cli CONFIG GET "*" 2>/dev/null | head -20 || echo "Unable to get config"

echo ""
echo -e "${BLUE}=========================${NC}"
echo -e "${BLUE}Diagnostic complete${NC}"
