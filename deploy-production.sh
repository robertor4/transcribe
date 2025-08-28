#!/bin/bash

# Production deployment script with Git integration
# Usage: ./deploy-production.sh

set -e  # Exit on error

echo "🚀 Starting production deployment..."

# Server details
SERVER="root@94.130.27.115"
REMOTE_DIR="/opt/transcribe"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if there are uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Do you want to commit them first? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
    fi
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

# Initialize Git on server if needed and pull latest code
echo "📥 Updating code on server..."
ssh $SERVER << EOF
    set -e
    cd $REMOTE_DIR
    
    # Initialize git if not already done
    if [ ! -d .git ]; then
        echo "Initializing Git repository..."
        git init
        git remote add origin https://github.com/robertor4/transcribe.git
        git fetch origin main
        git reset --hard origin/main
    else
        echo "Pulling latest changes..."
        git fetch origin main
        git reset --hard origin/main
    fi
    
    # Ensure .env file exists
    if [ ! -f .env ]; then
        echo -e "${RED}Error: .env file not found on server${NC}"
        echo "Please create .env file at $REMOTE_DIR/.env"
        exit 1
    fi
    
    echo "✅ Code updated successfully"
EOF

# Build and deploy
echo "🔨 Building and deploying containers..."
ssh $SERVER << EOF
    set -e
    cd $REMOTE_DIR
    
    # Stop existing containers
    echo "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down
    
    # Build containers
    echo "Building containers..."
    docker-compose -f docker-compose.prod.yml build
    
    # Start containers
    echo "Starting containers..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for containers to be healthy
    echo "Waiting for containers to be healthy..."
    sleep 10
    
    # Check container status
    echo ""
    echo "Container Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Check API logs
    echo ""
    echo "API Logs (last 20 lines):"
    docker logs --tail 20 transcribe-api
    
    # Test health endpoints
    echo ""
    echo "Testing endpoints:"
    curl -s -o /dev/null -w "API Health: %{http_code}\n" http://localhost:3001/health
    curl -s -o /dev/null -w "Web Health: %{http_code}\n" http://localhost:3000
EOF

echo ""
echo -e "${GREEN}✨ Deployment complete!${NC}"
echo "Visit https://neuralsummary.com to verify"