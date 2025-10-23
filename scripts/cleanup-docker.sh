#!/bin/bash

# Docker Cleanup Script for Production Server
# This script safely removes unused Docker resources to free up disk space
# Usage: bash scripts/cleanup-docker.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 Docker Cleanup Script${NC}"
echo -e "${BLUE}========================${NC}"
echo ""

# Check current disk usage
DISK_BEFORE=$(df / | tail -1 | awk '{print $5}')
echo -e "${YELLOW}Current disk usage: $DISK_BEFORE${NC}"
echo ""

# Function to show space saved
show_savings() {
    DISK_AFTER=$(df / | tail -1 | awk '{print $5}')
    echo -e "${GREEN}Disk usage now: $DISK_AFTER${NC}"
}

# 1. Remove dangling images (safe - these are unused intermediate layers)
echo -e "${YELLOW}1. Removing dangling images...${NC}"
DANGLING=$(docker images -f "dangling=true" -q | wc -l)
if [ "$DANGLING" -gt 0 ]; then
    docker rmi $(docker images -f "dangling=true" -q) 2>/dev/null || true
    echo -e "${GREEN}✅ Removed $DANGLING dangling images${NC}"
else
    echo -e "${GREEN}✅ No dangling images to remove${NC}"
fi
echo ""

# 2. Remove stopped containers (safe - we're using docker-compose, containers will be recreated)
echo -e "${YELLOW}2. Removing stopped containers...${NC}"
STOPPED=$(docker ps -a -f "status=exited" -q | wc -l)
if [ "$STOPPED" -gt 0 ]; then
    docker container prune -f
    echo -e "${GREEN}✅ Removed $STOPPED stopped containers${NC}"
else
    echo -e "${GREEN}✅ No stopped containers to remove${NC}"
fi
echo ""

# 3. Remove unused networks (safe - docker-compose will recreate if needed)
echo -e "${YELLOW}3. Removing unused networks...${NC}"
docker network prune -f
echo -e "${GREEN}✅ Removed unused networks${NC}"
echo ""

# 4. Clean build cache (safe - will be rebuilt as needed)
echo -e "${YELLOW}4. Cleaning Docker build cache...${NC}"
docker builder prune -f
echo -e "${GREEN}✅ Cleaned build cache${NC}"
echo ""

# 5. Remove old/unused images (excluding currently running containers)
echo -e "${YELLOW}5. Checking for old unused images...${NC}"
# Get list of images used by running containers
USED_IMAGES=$(docker ps --format '{{.Image}}' | sort -u)

# Get all images
ALL_IMAGES=$(docker images --format '{{.Repository}}:{{.Tag}}')

# Find unused images (excluding transcribe images which might be needed)
echo "Images currently in use:"
echo "$USED_IMAGES"
echo ""

# Remove unused images that are NOT transcribe-related
echo "Removing old unused images (keeping transcribe images)..."
docker image prune -a -f --filter "until=720h" 2>/dev/null || true
echo -e "${GREEN}✅ Removed old unused images${NC}"
echo ""

# 6. Clean npm cache (if exists)
echo -e "${YELLOW}6. Cleaning npm cache...${NC}"
if [ -d "/root/.npm" ]; then
    NPM_SIZE_BEFORE=$(du -sh /root/.npm 2>/dev/null | cut -f1)
    npm cache clean --force 2>/dev/null || true
    NPM_SIZE_AFTER=$(du -sh /root/.npm 2>/dev/null | cut -f1 || echo "0")
    echo -e "${GREEN}✅ Cleaned npm cache (was: $NPM_SIZE_BEFORE, now: $NPM_SIZE_AFTER)${NC}"
else
    echo -e "${GREEN}✅ No npm cache to clean${NC}"
fi
echo ""

# 7. Remove unused volumes (CAUTION: Only removes truly dangling volumes)
echo -e "${YELLOW}7. Checking for unused volumes...${NC}"
UNUSED_VOLS=$(docker volume ls -f "dangling=true" -q | wc -l)
if [ "$UNUSED_VOLS" -gt 0 ]; then
    echo -e "${YELLOW}Found $UNUSED_VOLS unused volumes${NC}"
    docker volume ls -f "dangling=true"
    echo ""
    read -p "Remove these unused volumes? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
        echo -e "${GREEN}✅ Removed unused volumes${NC}"
    else
        echo "Skipping volume cleanup"
    fi
else
    echo -e "${GREEN}✅ No unused volumes to remove${NC}"
fi
echo ""

# Final summary
echo -e "${BLUE}========================${NC}"
echo -e "${BLUE}Cleanup Complete${NC}"
echo ""
echo "Disk usage before: $DISK_BEFORE"
show_savings

echo ""
echo "Current Docker disk usage:"
docker system df

echo ""
echo -e "${GREEN}✨ Cleanup complete!${NC}"
echo ""
echo "If you still need more space, consider:"
echo "  1. Removing old Docker images manually: docker images"
echo "  2. Clearing application logs"
echo "  3. Upgrading server storage capacity"
echo -e "${BLUE}========================${NC}"
