#!/bin/bash

# VPS Setup Script for Ubuntu 22.04/24.04
# This script sets up a fresh VPS with all required dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME=${1:-"yourdomain.com"}
EMAIL=${2:-"admin@yourdomain.com"}
PROJECT_PATH="/opt/transcribe"
SWAP_SIZE="2G"

# Function to print colored output
print_message() {
    echo -e "${2}${1}${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_message "This script must be run as root" "$RED"
   exit 1
fi

print_message "Starting VPS setup for Transcribe App..." "$GREEN"
print_message "Domain: $DOMAIN_NAME" "$YELLOW"
print_message "Email: $EMAIL" "$YELLOW"

# Update system
print_message "Updating system packages..." "$YELLOW"
apt-get update
apt-get upgrade -y

# Install essential packages
print_message "Installing essential packages..." "$YELLOW"
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    ufw \
    fail2ban \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    build-essential \
    python3-pip

# Install Docker
print_message "Installing Docker..." "$YELLOW"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
else
    print_message "Docker already installed" "$GREEN"
fi

# Install Docker Compose
print_message "Installing Docker Compose..." "$YELLOW"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    print_message "Docker Compose already installed" "$GREEN"
fi

# Install Node.js (for running build scripts)
print_message "Installing Node.js..." "$YELLOW"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    print_message "Node.js already installed" "$GREEN"
fi

# Install FFmpeg
print_message "Installing FFmpeg..." "$YELLOW"
apt-get install -y ffmpeg

# Install Nginx
print_message "Installing Nginx..." "$YELLOW"
apt-get install -y nginx
systemctl stop nginx  # Will be managed by Docker

# Install Certbot
print_message "Installing Certbot..." "$YELLOW"
apt-get install -y certbot python3-certbot-nginx

# Setup swap if not exists
print_message "Setting up swap space..." "$YELLOW"
if [ ! -f /swapfile ]; then
    fallocate -l $SWAP_SIZE /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    
    # Optimize swappiness for server
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    sysctl -p
else
    print_message "Swap already configured" "$GREEN"
fi

# Configure firewall
print_message "Configuring firewall..." "$YELLOW"
ufw --force disable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Configure fail2ban
print_message "Configuring fail2ban..." "$YELLOW"
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
port = http,https
filter = nginx-noproxy
logpath = /var/log/nginx/error.log
maxretry = 2
EOF

systemctl restart fail2ban

# Setup project directory
print_message "Setting up project directory..." "$YELLOW"
mkdir -p $PROJECT_PATH
cd $PROJECT_PATH

# Get SSL certificate
print_message "Obtaining SSL certificate..." "$YELLOW"
print_message "Please ensure your domain $DOMAIN_NAME points to this server's IP address" "$RED"
read -p "Press enter when ready to continue..."

# Stop any service using port 80
systemctl stop nginx || true
docker-compose down || true

# Get certificate
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN_NAME \
    -d www.$DOMAIN_NAME

# Setup auto-renewal
print_message "Setting up SSL auto-renewal..." "$YELLOW"
cat > /etc/systemd/system/certbot-renewal.service << EOF
[Unit]
Description=Certbot Renewal
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --pre-hook "docker-compose -f $PROJECT_PATH/current/docker-compose.prod.yml stop nginx" --post-hook "docker-compose -f $PROJECT_PATH/current/docker-compose.prod.yml start nginx"
EOF

cat > /etc/systemd/system/certbot-renewal.timer << EOF
[Unit]
Description=Run certbot twice daily

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=43200
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable certbot-renewal.timer
systemctl start certbot-renewal.timer

# Setup log rotation
print_message "Setting up log rotation..." "$YELLOW"
cat > /etc/logrotate.d/transcribe << EOF
$PROJECT_PATH/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        docker-compose -f $PROJECT_PATH/current/docker-compose.prod.yml kill -s USR1 nginx
    endscript
}
EOF

# Create environment file template
print_message "Creating environment file template..." "$YELLOW"
cat > $PROJECT_PATH/.env.production << 'EOF'
# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Admin (for NestJS backend)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app

# Firebase Client (for Next.js frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Backend API URL
NEXT_PUBLIC_API_URL=https://DOMAIN_NAME/api

# Redis (for job queue)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secret
JWT_SECRET=your_secure_jwt_secret_here

# Environment
NODE_ENV=production
PORT=3001

# AssemblyAI
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# Resend (Email service)
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@DOMAIN_NAME

# Frontend URL
FRONTEND_URL=https://DOMAIN_NAME
EOF

# Replace domain in env file
sed -i "s/DOMAIN_NAME/$DOMAIN_NAME/g" $PROJECT_PATH/.env.production

print_message "Environment template created at $PROJECT_PATH/.env.production" "$GREEN"
print_message "Please edit this file with your actual API keys and configuration" "$RED"

# Setup monitoring with netdata (optional)
print_message "Setting up monitoring with Netdata..." "$YELLOW"
read -p "Install Netdata monitoring? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    bash <(curl -Ss https://my-netdata.io/kickstart.sh) --dont-wait --disable-telemetry
    
    # Configure Netdata to monitor Docker
    cat >> /etc/netdata/netdata.conf << EOF

[plugins]
    docker = yes
    
[plugin:docker]
    update every = 1
EOF
    
    systemctl restart netdata
    print_message "Netdata installed - Access at http://$DOMAIN_NAME:19999" "$GREEN"
fi

# Create deployment user (optional)
print_message "Creating deployment user..." "$YELLOW"
read -p "Create a deployment user? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter username for deployment: " DEPLOY_USER
    adduser --disabled-password --gecos "" $DEPLOY_USER
    usermod -aG docker $DEPLOY_USER
    usermod -aG sudo $DEPLOY_USER
    
    # Setup SSH key for deployment user
    mkdir -p /home/$DEPLOY_USER/.ssh
    touch /home/$DEPLOY_USER/.ssh/authorized_keys
    chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
    chmod 700 /home/$DEPLOY_USER/.ssh
    chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys
    
    print_message "Deployment user $DEPLOY_USER created" "$GREEN"
    print_message "Add your SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys" "$YELLOW"
fi

# System optimization
print_message "Optimizing system settings..." "$YELLOW"

# Increase file descriptor limits
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536
EOF

# Optimize kernel parameters
cat >> /etc/sysctl.conf << EOF
# Network optimizations
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 8192
net.core.netdev_max_backlog = 16384
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15

# Memory optimizations
vm.overcommit_memory = 1
EOF

sysctl -p

# Create backup script
print_message "Creating backup script..." "$YELLOW"
cat > $PROJECT_PATH/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/transcribe"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup Redis data
docker exec transcribe-redis redis-cli BGSAVE
sleep 5
docker cp transcribe-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x $PROJECT_PATH/backup.sh

# Add backup to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_PATH/backup.sh >> $PROJECT_PATH/backup.log 2>&1") | crontab -

# Final instructions
print_message "\n========================================" "$GREEN"
print_message "VPS Setup Complete!" "$GREEN"
print_message "========================================" "$GREEN"
print_message "\nNext steps:" "$YELLOW"
print_message "1. Edit environment file: nano $PROJECT_PATH/.env.production" "$BLUE"
print_message "2. Clone your repository to $PROJECT_PATH/current" "$BLUE"
print_message "3. Update Nginx config with your domain in: $PROJECT_PATH/current/nginx/sites-enabled/transcribe.conf" "$BLUE"
print_message "4. Run deployment: cd $PROJECT_PATH/current && ./scripts/deploy.sh" "$BLUE"
print_message "\nImportant paths:" "$YELLOW"
print_message "- Project: $PROJECT_PATH" "$BLUE"
print_message "- Logs: /var/log/nginx/" "$BLUE"
print_message "- SSL Certs: /etc/letsencrypt/live/$DOMAIN_NAME/" "$BLUE"
print_message "\nSecurity notes:" "$YELLOW"
print_message "- Firewall is enabled (ports 22, 80, 443 open)" "$BLUE"
print_message "- Fail2ban is protecting SSH and Nginx" "$BLUE"
print_message "- SSL certificate will auto-renew" "$BLUE"
print_message "- Backups run daily at 2 AM" "$BLUE"

# Reboot prompt
print_message "\nSetup complete! A reboot is recommended." "$GREEN"
read -p "Reboot now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    reboot
fi