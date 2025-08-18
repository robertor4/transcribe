#!/bin/bash

# Deploy to Hetzner Production Server
# This script deploys the Traefik-based setup to your production server

set -e  # Exit on error

# Configuration
SERVER_IP="94.130.27.115"  # Replace with your Hetzner server IP
SERVER_USER="root"  # Or your server user
DOMAIN="neuralsummary.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if server IP is configured
if [ "$SERVER_IP" == "YOUR_HETZNER_SERVER_IP" ]; then
    print_error "Please edit this script and set your Hetzner server IP"
    exit 1
fi

print_status "Deploying to Hetzner server at $SERVER_IP"

# Step 1: Create deployment directory on server
print_status "Creating deployment directory on server..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p /opt/transcribe"

# Step 2: Copy necessary files to server
print_status "Copying files to server..."
rsync -avz --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.next' \
    --exclude='*.log' \
    --exclude='.env.local' \
    --exclude='.env.development' \
    ./ $SERVER_USER@$SERVER_IP:/opt/transcribe/

# Step 3: Copy production environment file
print_status "Copying production environment file..."
scp .env.production $SERVER_USER@$SERVER_IP:/opt/transcribe/.env.production

# Step 4: Connect to server and deploy
print_status "Connecting to server and starting deployment..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /opt/transcribe

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    apt-get update
    apt-get install -y docker-compose
fi

# Stop any existing services
echo "Stopping existing services if any..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build and start services
echo "Building and starting services..."
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 15

# Show status
echo "Service status:"
docker-compose -f docker-compose.prod.yml ps

echo "Deployment completed!"
ENDSSH

print_status "Deployment complete!"
print_status "Your application should be available at https://$DOMAIN"
print_warning "Make sure your DNS points to $SERVER_IP"
print_warning "SSL certificates will be automatically generated on first access"

# Show logs
read -p "Do you want to see Traefik logs? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh $SERVER_USER@$SERVER_IP "cd /opt/transcribe && docker logs transcribe-traefik -f"
fi