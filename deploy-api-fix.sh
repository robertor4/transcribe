#!/bin/bash

echo "Deploying API fix to production..."

# SSH to server and rebuild API
ssh root@116.203.212.45 << 'EOF'
cd /root/transcribe
echo "Pulling latest changes..."
git pull

echo "Building API container..."
docker-compose -f docker-compose.prod.yml build api

echo "Restarting API container..."
docker-compose -f docker-compose.prod.yml up -d api

echo "Waiting for container to start..."
sleep 5

echo "Checking container status..."
docker ps | grep transcribe-api

echo "Checking API logs..."
docker logs --tail 20 transcribe-api
EOF

echo "Deployment complete!"