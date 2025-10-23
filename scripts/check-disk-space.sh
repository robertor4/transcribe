#!/bin/bash

# Disk Space Diagnostic Script
# Run this on the production server to check disk usage
# Usage: ssh root@server 'bash -s' < scripts/check-disk-space.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}💾 Disk Space Diagnostic Report${NC}"
echo -e "${BLUE}===============================${NC}"
echo ""

# Overall disk usage
echo -e "${YELLOW}1. Overall Disk Usage:${NC}"
df -h /

echo ""

# Check Docker disk usage
echo -e "${YELLOW}2. Docker Disk Usage:${NC}"
docker system df

echo ""

# Check for large directories
echo -e "${YELLOW}3. Largest Directories in /opt/transcribe:${NC}"
if [ -d "/opt/transcribe" ]; then
    du -h --max-depth=1 /opt/transcribe 2>/dev/null | sort -hr | head -10
else
    echo "Directory /opt/transcribe not found"
fi

echo ""

# Docker images
echo -e "${YELLOW}4. Docker Images:${NC}"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -15

echo ""

# Docker containers
echo -e "${YELLOW}5. Docker Containers:${NC}"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Size}}"

echo ""

# Docker volumes
echo -e "${YELLOW}6. Docker Volumes:${NC}"
docker volume ls
echo ""
echo "Volume sizes:"
docker system df -v | grep -A 20 "Local Volumes" || true

echo ""

# Check for old/unused Docker resources
echo -e "${YELLOW}7. Potentially Removable Docker Resources:${NC}"
echo ""
echo "Dangling images (can be safely removed):"
DANGLING=$(docker images -f "dangling=true" -q | wc -l)
if [ "$DANGLING" -gt 0 ]; then
    echo -e "${YELLOW}  $DANGLING dangling images found${NC}"
    docker images -f "dangling=true" --format "table {{.ID}}\t{{.CreatedSince}}\t{{.Size}}" | head -10
else
    echo -e "${GREEN}  No dangling images${NC}"
fi

echo ""
echo "Stopped containers (can be safely removed):"
STOPPED=$(docker ps -a -f "status=exited" -q | wc -l)
if [ "$STOPPED" -gt 0 ]; then
    echo -e "${YELLOW}  $STOPPED stopped containers found${NC}"
    docker ps -a -f "status=exited" --format "table {{.Names}}\t{{.Status}}" | head -10
else
    echo -e "${GREEN}  No stopped containers${NC}"
fi

echo ""
echo "Unused volumes (can be safely removed if not needed):"
UNUSED_VOLS=$(docker volume ls -f "dangling=true" -q | wc -l)
if [ "$UNUSED_VOLS" -gt 0 ]; then
    echo -e "${YELLOW}  $UNUSED_VOLS unused volumes found${NC}"
    docker volume ls -f "dangling=true"
else
    echo -e "${GREEN}  No unused volumes${NC}"
fi

echo ""

# Check npm cache
echo -e "${YELLOW}8. NPM Cache:${NC}"
if [ -d "/root/.npm" ]; then
    NPM_SIZE=$(du -sh /root/.npm 2>/dev/null | cut -f1)
    echo "NPM cache size: $NPM_SIZE"
else
    echo "No npm cache found"
fi

echo ""

# Check Docker build cache
echo -e "${YELLOW}9. Docker Build Cache:${NC}"
docker buildx du 2>/dev/null || echo "Build cache info not available (buildx not configured)"

echo ""

# Summary and recommendations
echo -e "${BLUE}===============================${NC}"
echo -e "${BLUE}Summary & Recommendations:${NC}"
echo ""

DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}⚠️  CRITICAL: Disk usage is at ${DISK_USAGE}%${NC}"
    echo ""
    echo "Immediate actions needed:"
    echo "  1. Run cleanup script: bash scripts/cleanup-docker.sh"
    echo "  2. Consider upgrading server storage"
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "${YELLOW}⚠️  WARNING: Disk usage is at ${DISK_USAGE}%${NC}"
    echo ""
    echo "Recommended actions:"
    echo "  1. Run cleanup script: bash scripts/cleanup-docker.sh"
    echo "  2. Monitor disk space regularly"
else
    echo -e "${GREEN}✅ Disk usage is healthy at ${DISK_USAGE}%${NC}"
fi

echo ""
echo "To free up space, run: bash scripts/cleanup-docker.sh"
echo -e "${BLUE}===============================${NC}"
