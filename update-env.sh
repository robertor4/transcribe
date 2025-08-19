#!/bin/bash

# This script helps update your .env file for the new Gmail configuration

echo "Updating .env file for Gmail configuration..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# Backup existing .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "Created backup of .env"

# Check if old GMAIL_EMAIL exists and replace with new variables
if grep -q "^GMAIL_EMAIL=" .env; then
    # Get the current GMAIL_EMAIL value
    OLD_EMAIL=$(grep "^GMAIL_EMAIL=" .env | cut -d'=' -f2)
    
    # Replace GMAIL_EMAIL with GMAIL_AUTH_USER
    sed -i '' "s/^GMAIL_EMAIL=.*/GMAIL_AUTH_USER=roberto@dreamone.nl/" .env
    
    # Add GMAIL_FROM_EMAIL after GMAIL_AUTH_USER
    sed -i '' "/^GMAIL_AUTH_USER=/a\\
GMAIL_FROM_EMAIL=noreply@neuralsummary.com" .env
    
    echo "✓ Updated email configuration:"
    echo "  - GMAIL_AUTH_USER=roberto@dreamone.nl (for authentication)"
    echo "  - GMAIL_FROM_EMAIL=noreply@neuralsummary.com (shown in FROM field)"
else
    echo "GMAIL_EMAIL not found in .env"
    echo "Please manually add:"
    echo "  GMAIL_AUTH_USER=roberto@dreamone.nl"
    echo "  GMAIL_FROM_EMAIL=noreply@neuralsummary.com"
    echo "  GMAIL_APP_PASSWORD=your_app_password_here"
fi

echo ""
echo "Configuration complete!"
echo "Make sure GMAIL_APP_PASSWORD is set with your Google App Password"
echo ""
echo "To test the configuration:"
echo "1. Run: npm run fresh"
echo "2. Try sending a share email from the application"