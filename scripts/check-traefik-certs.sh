#!/bin/bash
# Diagnostic script for Traefik Let's Encrypt certificate issues
# Usage: bash scripts/check-traefik-certs.sh

set -e

echo "=========================================="
echo "Traefik Certificate Diagnostic Tool"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on production server
if [ -d "/opt/transcribe" ]; then
    DEPLOY_DIR="/opt/transcribe"
    echo "✓ Running on production server"
else
    DEPLOY_DIR="."
    echo "✓ Running locally"
fi

echo ""
echo "=========================================="
echo "1. Checking ACME_EMAIL Configuration"
echo "=========================================="

if [ -f "$DEPLOY_DIR/.env.production" ]; then
    if grep -q "ACME_EMAIL=" "$DEPLOY_DIR/.env.production"; then
        ACME_EMAIL=$(grep "ACME_EMAIL=" "$DEPLOY_DIR/.env.production" | cut -d '=' -f2)
        if [ -n "$ACME_EMAIL" ] && [ "$ACME_EMAIL" != "admin@yourdomain.com" ]; then
            echo -e "${GREEN}✓ ACME_EMAIL is configured: $ACME_EMAIL${NC}"
        else
            echo -e "${RED}✗ ACME_EMAIL is set to default/empty value${NC}"
            echo "  Action: Set a valid email in .env.production"
        fi
    else
        echo -e "${RED}✗ ACME_EMAIL not found in .env.production${NC}"
        echo "  Action: Add 'ACME_EMAIL=your@email.com' to .env.production"
    fi
else
    echo -e "${YELLOW}⚠ .env.production file not found${NC}"
fi

echo ""
echo "=========================================="
echo "2. Checking Traefik Container Status"
echo "=========================================="

if command -v docker &> /dev/null; then
    if docker ps | grep -q "transcribe-traefik"; then
        echo -e "${GREEN}✓ Traefik container is running${NC}"

        # Get container uptime
        UPTIME=$(docker ps --format "{{.Status}}" --filter "name=transcribe-traefik")
        echo "  Uptime: $UPTIME"
    else
        echo -e "${RED}✗ Traefik container is not running${NC}"
        echo "  Action: Start with: docker-compose -f docker-compose.prod.yml up -d traefik"
    fi
else
    echo -e "${YELLOW}⚠ Docker not available${NC}"
fi

echo ""
echo "=========================================="
echo "3. Checking Certificate Volume"
echo "=========================================="

if command -v docker &> /dev/null; then
    if docker volume ls | grep -q "transcribe_traefik-certificates"; then
        echo -e "${GREEN}✓ Certificate volume exists${NC}"

        # Check if acme.json exists in volume
        if docker run --rm -v transcribe_traefik-certificates:/data alpine ls /data/acme.json &> /dev/null; then
            echo -e "${GREEN}✓ acme.json file exists${NC}"

            # Check file size (empty file means no certificates)
            SIZE=$(docker run --rm -v transcribe_traefik-certificates:/data alpine stat -c%s /data/acme.json 2>/dev/null || echo "0")
            if [ "$SIZE" -gt 100 ]; then
                echo -e "${GREEN}✓ acme.json contains data ($SIZE bytes)${NC}"
            else
                echo -e "${YELLOW}⚠ acme.json is empty or very small ($SIZE bytes)${NC}"
                echo "  This might indicate no certificates have been issued yet"
            fi

            # Check permissions
            PERMS=$(docker run --rm -v transcribe_traefik-certificates:/data alpine stat -c%a /data/acme.json 2>/dev/null || echo "unknown")
            if [ "$PERMS" = "600" ]; then
                echo -e "${GREEN}✓ acme.json has correct permissions (600)${NC}"
            else
                echo -e "${YELLOW}⚠ acme.json permissions: $PERMS (should be 600)${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ acme.json file not found in volume${NC}"
            echo "  This is normal on first run before certificates are issued"
        fi
    else
        echo -e "${RED}✗ Certificate volume not found${NC}"
        echo "  Action: Volume will be created on first docker-compose up"
    fi
fi

echo ""
echo "=========================================="
echo "4. Checking Traefik Logs for ACME Errors"
echo "=========================================="

if command -v docker &> /dev/null && docker ps | grep -q "transcribe-traefik"; then
    echo "Recent ACME-related log entries:"
    echo ""

    # Check for errors
    ERRORS=$(docker logs transcribe-traefik 2>&1 | grep -i -E "acme|certificate|letsencrypt|error" | tail -20)

    if [ -z "$ERRORS" ]; then
        echo -e "${GREEN}✓ No recent ACME errors found${NC}"
    else
        echo "$ERRORS" | while IFS= read -r line; do
            if echo "$line" | grep -qi "error"; then
                echo -e "${RED}$line${NC}"
            else
                echo "$line"
            fi
        done
    fi
else
    echo -e "${YELLOW}⚠ Traefik container not running${NC}"
fi

echo ""
echo "=========================================="
echo "5. Checking DNS Resolution"
echo "=========================================="

DOMAINS=("neuralsummary.com" "www.neuralsummary.com")

for DOMAIN in "${DOMAINS[@]}"; do
    if command -v nslookup &> /dev/null; then
        IP=$(nslookup "$DOMAIN" 2>/dev/null | grep -A1 "Name:" | tail -1 | awk '{print $2}')
        if [ -n "$IP" ]; then
            echo -e "${GREEN}✓ $DOMAIN resolves to: $IP${NC}"
        else
            echo -e "${RED}✗ $DOMAIN does not resolve${NC}"
        fi
    elif command -v dig &> /dev/null; then
        IP=$(dig +short "$DOMAIN" | tail -1)
        if [ -n "$IP" ]; then
            echo -e "${GREEN}✓ $DOMAIN resolves to: $IP${NC}"
        else
            echo -e "${RED}✗ $DOMAIN does not resolve${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ DNS tools (nslookup/dig) not available${NC}"
        break
    fi
done

echo ""
echo "=========================================="
echo "6. Checking Port 80 Accessibility"
echo "=========================================="

if command -v curl &> /dev/null; then
    echo "Testing HTTP challenge endpoint..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://neuralsummary.com/.well-known/acme-challenge/test 2>/dev/null || echo "failed")

    if [ "$RESPONSE" = "404" ] || [ "$RESPONSE" = "301" ] || [ "$RESPONSE" = "302" ]; then
        echo -e "${GREEN}✓ Port 80 is accessible (HTTP $RESPONSE)${NC}"
        echo "  404/301/302 is expected when no challenge is active"
    elif [ "$RESPONSE" = "failed" ]; then
        echo -e "${RED}✗ Cannot reach port 80${NC}"
        echo "  Action: Check firewall allows port 80"
    else
        echo -e "${YELLOW}⚠ Unexpected response: HTTP $RESPONSE${NC}"
    fi
else
    echo -e "${YELLOW}⚠ curl not available${NC}"
fi

echo ""
echo "=========================================="
echo "7. Checking Current SSL Certificate"
echo "=========================================="

if command -v openssl &> /dev/null && command -v curl &> /dev/null; then
    echo "Checking certificate for neuralsummary.com..."
    echo ""

    CERT_INFO=$(echo | openssl s_client -servername neuralsummary.com -connect neuralsummary.com:443 2>/dev/null | openssl x509 -noout -subject -issuer -dates 2>/dev/null)

    if [ $? -eq 0 ]; then
        ISSUER=$(echo "$CERT_INFO" | grep "issuer" | cut -d'=' -f4-)
        SUBJECT=$(echo "$CERT_INFO" | grep "subject" | cut -d'=' -f2-)
        NOT_AFTER=$(echo "$CERT_INFO" | grep "notAfter" | cut -d'=' -f2-)

        if echo "$ISSUER" | grep -qi "Let's Encrypt"; then
            echo -e "${GREEN}✓ Using Let's Encrypt certificate${NC}"
            echo "  Issuer: $ISSUER"
            echo "  Subject: $SUBJECT"
            echo "  Expires: $NOT_AFTER"
        elif echo "$ISSUER" | grep -qi "Traefik"; then
            echo -e "${RED}✗ Using Traefik default self-signed certificate${NC}"
            echo "  Issuer: $ISSUER"
            echo "  This indicates Let's Encrypt is not working"
            echo ""
            echo "  Common causes:"
            echo "  - ACME_EMAIL not configured"
            echo "  - Port 80 not accessible for HTTP challenge"
            echo "  - DNS not pointing to this server"
            echo "  - Let's Encrypt rate limit reached"
        else
            echo -e "${YELLOW}⚠ Using unknown certificate${NC}"
            echo "  Issuer: $ISSUER"
            echo "  Subject: $SUBJECT"
        fi
    else
        echo -e "${RED}✗ Could not retrieve certificate${NC}"
        echo "  Action: Check if HTTPS is accessible"
    fi
else
    echo -e "${YELLOW}⚠ openssl or curl not available${NC}"
fi

echo ""
echo "=========================================="
echo "8. Dashboard Security Check"
echo "=========================================="

if command -v curl &> /dev/null; then
    DASHBOARD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://neuralsummary.com:8080/dashboard/ 2>/dev/null || echo "failed")

    if [ "$DASHBOARD_RESPONSE" = "failed" ] || [ "$DASHBOARD_RESPONSE" = "000" ]; then
        echo -e "${GREEN}✓ Dashboard port 8080 is not accessible (secure)${NC}"
    else
        echo -e "${RED}✗ Dashboard is accessible on port 8080 (HTTP $DASHBOARD_RESPONSE)${NC}"
        echo "  SECURITY RISK: Dashboard should not be publicly accessible"
        echo "  Action: Remove '--api.insecure=true' and port 8080 mapping"
    fi
fi

echo ""
echo "=========================================="
echo "Summary & Recommendations"
echo "=========================================="
echo ""
echo "If using Traefik default certificate, try these steps:"
echo ""
echo "1. Ensure ACME_EMAIL is set in .env.production:"
echo "   echo 'ACME_EMAIL=admin@neuralsummary.com' >> $DEPLOY_DIR/.env.production"
echo ""
echo "2. Restart Traefik to apply changes:"
echo "   docker-compose -f docker-compose.prod.yml restart traefik"
echo ""
echo "3. Monitor logs for certificate issuance:"
echo "   docker logs -f transcribe-traefik | grep -i acme"
echo ""
echo "4. If rate limited, wait or use staging environment:"
echo "   Add to docker-compose.prod.yml:"
echo "   - \"--certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory\""
echo ""
echo "5. If still failing, delete volume and start fresh:"
echo "   docker-compose -f docker-compose.prod.yml stop traefik"
echo "   docker volume rm transcribe_traefik-certificates"
echo "   docker-compose -f docker-compose.prod.yml up -d traefik"
echo ""
echo "=========================================="
