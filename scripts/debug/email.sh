#!/bin/bash

echo "=== Email Configuration Check ==="
echo ""

# Check environment variables
echo "1. Environment Variables:"
echo "   GMAIL_AUTH_USER: ${GMAIL_AUTH_USER:+SET (hidden)}"
echo "   GMAIL_AUTH_USER: ${GMAIL_AUTH_USER:-NOT SET}"
echo "   GMAIL_FROM_EMAIL: ${GMAIL_FROM_EMAIL:-NOT SET}"
echo "   GMAIL_APP_PASSWORD: ${GMAIL_APP_PASSWORD:+SET (hidden)}"
echo "   GMAIL_APP_PASSWORD: ${GMAIL_APP_PASSWORD:-NOT SET}"
echo "   FRONTEND_URL: ${FRONTEND_URL:-NOT SET}"
echo ""

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "2. Running in Docker container"
    echo "   Checking mounted .env file:"
    if [ -f /app/.env ]; then
        echo "   .env file exists"
        grep -E "GMAIL_|FRONTEND_URL" /app/.env | sed 's/=.*/=***/'
    else
        echo "   .env file NOT FOUND"
    fi
else
    echo "2. Running on host system"
    echo "   Checking .env file:"
    if [ -f .env ]; then
        echo "   .env file exists"
        grep -E "GMAIL_|FRONTEND_URL" .env | sed 's/=.*/=***/'
    else
        echo "   .env file NOT FOUND"
    fi
fi
echo ""

# Test DNS resolution
echo "3. DNS Resolution:"
nslookup smtp.gmail.com | head -5
echo ""

# Check application logs
echo "4. Recent Email-related Logs:"
if command -v pm2 &> /dev/null; then
    pm2 logs api --nostream --lines 50 | grep -i "email\|gmail" | tail -10
elif command -v docker &> /dev/null; then
    docker ps --format "table {{.Names}}" | grep -i api | while read container; do
        echo "Container: $container"
        docker logs $container 2>&1 | grep -i "email\|gmail" | tail -10
    done
else
    journalctl -u neuralsummary-api --no-pager -n 50 | grep -i "email\|gmail" | tail -10
fi
echo ""

echo "5. Quick Node.js Gmail Test:"
cat << 'EOF' > /tmp/test-email.js
const nodemailer = require('nodemailer');

const user = process.env.GMAIL_AUTH_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

if (!user || !pass) {
  console.error('❌ Missing GMAIL_AUTH_USER or GMAIL_APP_PASSWORD');
  process.exit(1);
}

console.log(`Testing with user: ${user.substring(0, 3)}***`);

async function test() {
  // Test 1: Service config
  console.log('\nTest 1: Gmail service config...');
  try {
    const t1 = nodemailer.createTransporter({
      service: 'gmail',
      auth: { user, pass }
    });
    await t1.verify();
    console.log('✅ Service config works!');
  } catch (e) {
    console.error('❌ Service config failed:', e.message);
  }

  // Test 2: Direct SMTP
  console.log('\nTest 2: Direct SMTP (port 587)...');
  try {
    const t2 = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
    await t2.verify();
    console.log('✅ Direct SMTP works!');
    
    // Try sending
    const info = await t2.sendMail({
      from: user,
      to: user,
      subject: 'Test from Hetzner',
      text: 'If you see this, email works!'
    });
    console.log('✅ Email sent:', info.messageId);
  } catch (e) {
    console.error('❌ Direct SMTP failed:', e.message);
    if (e.response) console.error('Response:', e.response);
  }
}

test().catch(console.error);
EOF

# Run test if node is available
if command -v node &> /dev/null; then
    cd /tmp
    npm install nodemailer 2>/dev/null || true
    node /tmp/test-email.js
else
    echo "Node.js not found, skipping test"
fi