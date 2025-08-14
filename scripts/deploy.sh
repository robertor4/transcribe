#!/bin/bash

# Deployment script for Transcribe App
# Usage: ./deploy.sh [staging|production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="transcribe"
REMOTE_USER="root"
REMOTE_HOST="your-server-ip"
REMOTE_PATH="/opt/transcribe"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Function to print colored output
print_message() {
    echo -e "${2}${1}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_message "Checking prerequisites..." "$YELLOW"

if ! command_exists git; then
    print_message "Error: git is not installed" "$RED"
    exit 1
fi

if ! command_exists ssh; then
    print_message "Error: ssh is not installed" "$RED"
    exit 1
fi

# Check for uncommitted changes
if [[ $(git status --porcelain) ]]; then
    print_message "Warning: You have uncommitted changes" "$YELLOW"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_message "Starting deployment to $ENVIRONMENT..." "$GREEN"

# Get current git commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)
print_message "Deploying commit: $COMMIT_HASH" "$YELLOW"

# Create deployment archive
print_message "Creating deployment archive..." "$YELLOW"
ARCHIVE_NAME="${PROJECT_NAME}-${COMMIT_HASH}.tar.gz"

# Files to include in deployment
tar -czf "/tmp/$ARCHIVE_NAME" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.next \
    --exclude=dist \
    --exclude=temp \
    --exclude=logs \
    --exclude=.env \
    --exclude=.env.local \
    .

print_message "Archive created: $ARCHIVE_NAME" "$GREEN"

# Upload to server
print_message "Uploading to server..." "$YELLOW"
scp "/tmp/$ARCHIVE_NAME" "${REMOTE_USER}@${REMOTE_HOST}:/tmp/"

# Execute deployment on server
print_message "Executing remote deployment..." "$YELLOW"

ssh "${REMOTE_USER}@${REMOTE_HOST}" << ENDSSH
set -e

# Colors for remote output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting remote deployment...${NC}"

# Create project directory if it doesn't exist
mkdir -p ${REMOTE_PATH}
cd ${REMOTE_PATH}

# Backup current deployment
if [ -d "current" ]; then
    echo -e "${YELLOW}Backing up current deployment...${NC}"
    rm -rf previous
    mv current previous
fi

# Extract new deployment
echo -e "${YELLOW}Extracting new deployment...${NC}"
mkdir current
tar -xzf "/tmp/$ARCHIVE_NAME" -C current
rm "/tmp/$ARCHIVE_NAME"

cd current

# Check for environment file
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found!${NC}"
    echo -e "${YELLOW}Please create $ENV_FILE on the server before deploying${NC}"
    exit 1
fi

# Build Docker images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache

# Stop old containers
echo -e "${YELLOW}Stopping old containers...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE down || true

# Start new containers
echo -e "${YELLOW}Starting new containers...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check if services are running
echo -e "${YELLOW}Checking service status...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE ps

# Run database migrations if needed
# docker-compose -f $DOCKER_COMPOSE_FILE exec -T api npm run migration:run || true

# Clean up old Docker images
echo -e "${YELLOW}Cleaning up old Docker images...${NC}"
docker image prune -f

echo -e "${GREEN}Deployment completed successfully!${NC}"
ENDSSH

# Clean up local archive
rm "/tmp/$ARCHIVE_NAME"

print_message "Deployment completed successfully!" "$GREEN"
print_message "Commit $COMMIT_HASH deployed to $ENVIRONMENT" "$GREEN"

# Show service URLs
print_message "\nService URLs:" "$YELLOW"
print_message "Frontend: https://${REMOTE_HOST}" "$GREEN"
print_message "API: https://${REMOTE_HOST}/api" "$GREEN"
print_message "Health check: https://${REMOTE_HOST}/health" "$GREEN"

# Check deployment status
print_message "\nChecking deployment status..." "$YELLOW"
curl -s -o /dev/null -w "Frontend HTTP Status: %{http_code}\n" "https://${REMOTE_HOST}" || true
curl -s -o /dev/null -w "API HTTP Status: %{http_code}\n" "https://${REMOTE_HOST}/api/health" || true