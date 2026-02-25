#!/bin/bash

# Manual Deployment Script for Neural Summary
# ⚠️  NOTE: This is a backup/emergency deployment script
# For normal deployments, use GitHub Actions at: https://github.com/your-org/neural-summary/actions
#
# Usage:
#   ./deploy-manual.sh                    # Full deployment with rebuild
#   ./deploy-manual.sh --quick            # Quick deploy (code only, no rebuild)
#   ./deploy-manual.sh --service web      # Update specific service
#   ./deploy-manual.sh --service api,web  # Update multiple services
#   ./deploy-manual.sh --no-build         # Update without rebuilding images

set -e  # Exit on error

# Server details
SERVER="root@94.130.27.115"
REMOTE_DIR="/opt/transcribe"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
BUILD=true
QUICK=false
SERVICES=""
FULL_RESTART=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --quick|-q)
            QUICK=true
            BUILD=false
            shift
            ;;
        --no-build)
            BUILD=false
            shift
            ;;
        --service|-s)
            SERVICES="$2"
            shift 2
            ;;
        --full-restart)
            FULL_RESTART=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --quick, -q          Quick deploy (pull code and restart, no rebuild)"
            echo "  --no-build           Deploy without rebuilding Docker images"
            echo "  --service, -s        Update specific service(s), comma-separated"
            echo "                       Available: web, api, redis, traefik"
            echo "  --full-restart       Stop all containers before starting (causes downtime)"
            echo "  --help, -h           Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                   # Full deployment with rebuild"
            echo "  $0 --quick           # Quick code update without rebuild"
            echo "  $0 --service web     # Update only web service"
            echo "  $0 --service api,web # Update api and web services"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 Starting Neural Summary Production Deployment${NC}"
echo -e "${BLUE}================================================${NC}"

# Display deployment mode
if [ "$QUICK" = true ]; then
    echo -e "${YELLOW}Mode: Quick deployment (no rebuild)${NC}"
elif [ "$BUILD" = false ]; then
    echo -e "${YELLOW}Mode: Deploy without rebuild${NC}"
else
    echo -e "${YELLOW}Mode: Full deployment with rebuild${NC}"
fi

if [ -n "$SERVICES" ]; then
    echo -e "${YELLOW}Services: $SERVICES${NC}"
fi

echo ""

# Check if there are uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    read -p "Do you want to commit them first? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
    fi
fi

# Save current commit hash for potential rollback
CURRENT_COMMIT=$(git rev-parse HEAD)
echo -e "${GREEN}Current commit: ${CURRENT_COMMIT:0:8}${NC}"

# Push to GitHub
echo -e "${GREEN}📤 Pushing to GitHub...${NC}"
git push origin main

# Get latest commit hash
LATEST_COMMIT=$(git rev-parse HEAD)

# Update code on server
echo -e "${GREEN}📥 Updating code on server...${NC}"
ssh $SERVER << EOF
    set -e
    cd $REMOTE_DIR
    
    # Save previous commit for rollback
    PREVIOUS_COMMIT=\$(git rev-parse HEAD 2>/dev/null || echo "none")
    echo "Previous commit: \${PREVIOUS_COMMIT:0:8}"
    
    # Update to latest code
    git fetch origin main
    git reset --hard origin/main
    
    NEW_COMMIT=\$(git rev-parse HEAD)
    echo -e "${GREEN}Updated to commit: \${NEW_COMMIT:0:8}${NC}"
    
    # Verify .env.production exists
    if [ ! -f .env.production ]; then
        echo -e "${RED}Error: .env.production not found!${NC}"
        echo "Deployment cannot continue without environment file"
        exit 1
    fi
EOF

# Quick mode - just restart containers
if [ "$QUICK" = true ]; then
    echo -e "${GREEN}🔄 Quick restart (no rebuild)...${NC}"
    ssh $SERVER << EOF
        set -e
        cd $REMOTE_DIR
        
        if [ -n "$SERVICES" ]; then
            # Restart specific services
            for service in \$(echo $SERVICES | tr ',' ' '); do
                echo "Restarting \$service..."
                docker-compose -f docker-compose.prod.yml restart \$service
            done
        else
            # Restart all services
            echo "Restarting all services..."
            docker-compose -f docker-compose.prod.yml restart
        fi
        
        # Wait for services to be ready
        sleep 5
        
        # Show status
        docker-compose -f docker-compose.prod.yml ps
EOF
    
    echo -e "${GREEN}✨ Quick deployment complete!${NC}"
    exit 0
fi

# Build and deploy based on options
echo -e "${GREEN}🔨 Deploying services...${NC}"

if [ "$FULL_RESTART" = true ]; then
    # Full restart with downtime
    ssh $SERVER << EOF
        set -e
        cd $REMOTE_DIR
        
        echo "Stopping all containers..."
        docker-compose -f docker-compose.prod.yml down
        
        $([ "$BUILD" = true ] && echo "echo 'Building containers...'; docker-compose -f docker-compose.prod.yml build --no-cache")
        
        echo "Starting all containers..."
        docker-compose -f docker-compose.prod.yml up -d
EOF
else
    # Zero-downtime deployment
    ssh $SERVER << EOF
        set -e
        cd $REMOTE_DIR
        
        if [ -n "$SERVICES" ]; then
            # Update specific services
            SERVICES_LIST=\$(echo $SERVICES | tr ',' ' ')
            
            $([ "$BUILD" = true ] && echo "echo 'Building services: \$SERVICES_LIST'; docker-compose -f docker-compose.prod.yml build --no-cache \$SERVICES_LIST")
            
            echo "Updating services: \$SERVICES_LIST"
            docker-compose -f docker-compose.prod.yml up -d --no-deps \$SERVICES_LIST
        else
            # Update all services
            $([ "$BUILD" = true ] && echo "echo 'Building all containers...'; docker-compose -f docker-compose.prod.yml build --no-cache")
            
            echo "Updating all containers..."
            docker-compose -f docker-compose.prod.yml up -d
        fi
EOF
fi

# Health checks
echo -e "${GREEN}🏥 Running health checks...${NC}"
ssh $SERVER << 'EOF'
    set -e
    cd /opt/transcribe
    
    # Wait for containers to stabilize
    echo "Waiting for services to be ready..."
    sleep 10
    
    # Check container status
    echo ""
    echo "Container Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep transcribe || true
    
    # Test health endpoints
    echo ""
    echo "Health Check Results:"
    
    # Check Redis
    REDIS_STATUS=$(docker inspect transcribe-redis --format='{{.State.Status}}' 2>/dev/null || echo "not found")
    if [ "$REDIS_STATUS" != "running" ]; then
        echo "❌ Redis: Container is $REDIS_STATUS"
    elif timeout 5 docker exec transcribe-redis redis-cli ping 2>&1 | grep -q "PONG"; then
        echo "✅ Redis: Healthy and responding"
    else
        echo "⚠️  Redis: Container running but not responding to PING"
    fi
    
    # Check API
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
    if [ "$API_STATUS" = "200" ]; then
        echo "✅ API: Healthy (HTTP $API_STATUS)"
    else
        echo "⚠️  API: HTTP $API_STATUS"
    fi
    
    # Check Web
    WEB_STATUS=$(docker inspect transcribe-web --format='{{.State.Status}}' 2>/dev/null || echo "not found")
    if [ "$WEB_STATUS" = "running" ]; then
        echo "✅ Web: Running"
    else
        echo "❌ Web: $WEB_STATUS"
    fi
    
    # Check Traefik
    TRAEFIK_STATUS=$(docker inspect transcribe-traefik --format='{{.State.Status}}' 2>/dev/null || echo "not found")
    if [ "$TRAEFIK_STATUS" = "running" ]; then
        echo "✅ Traefik: Running"
    else
        echo "❌ Traefik: $TRAEFIK_STATUS"
    fi
    
    # Check site accessibility
    echo ""
    echo "Site Accessibility:"
    SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://neuralsummary.com 2>/dev/null || echo "000")
    if [ "$SITE_STATUS" = "200" ]; then
        echo "✅ https://neuralsummary.com is accessible (HTTP $SITE_STATUS)"
    else
        echo "⚠️  https://neuralsummary.com returned HTTP $SITE_STATUS"
    fi
    APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.neuralsummary.com 2>/dev/null || echo "000")
    if [ "$APP_STATUS" = "200" ] || [ "$APP_STATUS" = "302" ] || [ "$APP_STATUS" = "307" ]; then
        echo "✅ https://app.neuralsummary.com is accessible (HTTP $APP_STATUS)"
    else
        echo "⚠️  https://app.neuralsummary.com returned HTTP $APP_STATUS"
    fi
EOF

# Show recent logs
echo ""
echo -e "${GREEN}📋 Recent API logs:${NC}"
ssh $SERVER "docker logs --tail 10 transcribe-api 2>&1 | grep -v 'WebSocket\\|Health check' || true"

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✨ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}Deployed commit: ${LATEST_COMMIT:0:8}${NC}"
echo -e "${GREEN}Site: https://neuralsummary.com${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:        ssh $SERVER 'docker logs -f transcribe-[service]'"
echo "  Check status:     ssh $SERVER 'docker ps | grep transcribe'"
echo "  Quick rollback:   git reset --hard $CURRENT_COMMIT && ./deploy.sh --quick"
echo -e "${BLUE}================================================${NC}"