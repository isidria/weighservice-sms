# WeighService SMS - Complete OVH VPS Setup Guide

A comprehensive step-by-step guide to deploy the entire WeighService SMS application on an OVH VPS, including the backend Node.js server, PostgreSQL database, and React web frontend.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial VPS Setup](#initial-vps-setup)
3. [Install System Dependencies](#install-system-dependencies)
4. [PostgreSQL Database Setup](#postgresql-database-setup)
5. [Backend Application Setup](#backend-application-setup)
6. [Frontend Application Setup](#frontend-application-setup)
7. [Nginx Reverse Proxy Configuration](#nginx-reverse-proxy-configuration)
8. [SSL/TLS with Cloudflare](#ssltls-with-cloudflare)
9. [Process Management (PM2)](#process-management-pm2)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, you need:

- **OVH VPS** with root access (Ubuntu 22.04 LTS recommended)
- **Domain name** (e.g., `weighservice.com`)
- **GitHub repository** with project code
- **Twilio account** with phone number and credentials
- **Google Cloud Console** credentials for OAuth 2.0
- **SSH client** on your local machine
- **Cloudflare account** (optional but recommended)

---

## Initial VPS Setup

### Step 1: Connect to Your VPS

```bash
ssh root@your_vps_ip_address
```

Replace `your_vps_ip_address` with your actual VPS IP.

### Step 2: Update System

```bash
apt update && apt upgrade -y
```

### Step 3: Create a Non-Root User (Recommended)

```bash
# Create user 'weighservice'
adduser weighservice

# Add user to sudo group
usermod -aG sudo weighservice

# Switch to new user
su - weighservice
```

### Step 4: Configure SSH Key (Optional but Recommended)

On your **local machine**:

```bash
ssh-keygen -t ed25519 -C "weighservice@vps"
# Press Enter for all prompts or set a passphrase
```

Copy the public key to your VPS:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub weighservice@your_vps_ip_address
```

Now you can SSH without a password:

```bash
ssh weighservice@your_vps_ip_address
```

### Step 5: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

---

## Install System Dependencies

### Step 1: Install Node.js (v18+)

```bash
# Download NodeSource setup script
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Install PostgreSQL

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update and install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### Step 3: Install Nginx

```bash
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
sudo systemctl status nginx
```

### Step 4: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Set up PM2 to auto-start on reboot
pm2 startup
```

### Optional: Use nSolid (commercial hardened Node.js runtime)

nSolid (from NodeSource) is a commercial, hardened Node.js runtime that provides additional observability and stability features. Use this only if you have an nSolid subscription or license. nSolid is not required for the app to run, but it can remove certain deprecation warnings and provide enterprise monitoring.

Important notes:
- nSolid is commercial — you must obtain access and any authentication tokens from NodeSource (https://nodesource.com/products/nsolid).
- The installation procedure and package names vary by distribution and by the nSolid version you are provided.

Typical high-level steps (replace placeholders with the values and URLs provided by NodeSource):

1. Obtain the nSolid package or repository credentials from NodeSource.

2. Follow NodeSource's installation instructions for your distribution. Example (illustrative only — follow NodeSource docs):

```bash
# Add NodeSource / nSolid repository (example placeholder - use the URL/token NodeSource gives you)
# curl -sL "https://<nsolid-repo-url>/setup.sh" | sudo -E bash -

# Install nSolid runtime package (package name depends on the release you have)
sudo apt install -y nsolid
```

3. Make `nsolid` available as a node interpreter on your PATH (if the installer did not already):

```bash
sudo ln -s /opt/nsolid/bin/nsolid /usr/local/bin/nsolid
```

4. Start the backend with the nSolid interpreter using PM2 so PM2 uses the nSolid binary instead of the system `node`:

```bash
cd /home/weighservice/weighservice-sms/backend
pm2 start src/server.js --name "weighservice-backend" --interpreter /usr/local/bin/nsolid --env production
pm2 save
```

5. Configure the nSolid control center / monitoring according to NodeSource's docs (you will need the control plane hostname and any tokens). nSolid provides additional environment variables (for example `NSOLID_CTL`) to configure its agent.

Troubleshooting and tips:
- If you see deprecation warnings removed after switching to nSolid, confirm your runtime path: `which nsolid` and `nsolid --version`.
- Keep standard Node.js installed as a fallback; do not remove `node` unless you're certain other system packages won't depend on it.
- If you use Docker for deployment instead, NodeSource provides official nSolid Docker images you can use as the base image.

If you want, I can add a short example `systemd` unit or PM2 ecosystem file that points to the `nsolid` interpreter.

### Step 5: Install Git and Other Tools

```bash
sudo apt install -y git curl wget ufw
```

---

## PostgreSQL Database Setup

### Step 1: Create Database and User

Connect to PostgreSQL:

```bash
sudo -u postgres psql
```

In the PostgreSQL prompt, run:

```sql
-- Create database
CREATE DATABASE weighservice_sms;

-- Create user
CREATE USER weighuser WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
ALTER ROLE weighuser SET client_encoding TO 'utf8';
ALTER ROLE weighuser SET default_transaction_isolation TO 'read committed';
ALTER ROLE weighuser SET default_transaction_deferrable TO on;
ALTER ROLE weighuser SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE weighservice_sms TO weighuser;

-- Exit PostgreSQL
\q
```

### Step 2: Verify Database Connection

```bash
psql -h localhost -U weighuser -d weighservice_sms -c "SELECT version();"
```

You'll be prompted for the password. If successful, you'll see the PostgreSQL version.

---

## Backend Application Setup

### Step 1: Clone Repository

```bash
cd /home/weighservice
git clone https://github.com/isidria/weighservice-sms.git
cd weighservice-sms/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

```bash
cp .env.example .env
```
v
Edit `.env` with your VPS configuration:

```bash
sudo nano .env
```

Update the following values:

```dotenv
# Server Configuration
NODE_ENV=production
PORT=3002
API_URL=https://your-domain.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weighservice_sms
DB_USER=weighuser
DB_PASSWORD=your_secure_password_here
DB_SSL=false

# JWT
JWT_SECRET=your-very-long-random-secret-key-generate-with-openssl-rand-base64-32
JWT_EXPIRY=7d

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URLs
WEB_URL=https://your-domain.com
MOBILE_URL=weighservice://

# WebSocket
WS_URL=https://your-domain.com
```

**Generate a secure JWT_SECRET:**

```bash
openssl rand -base64 32
```

### Step 4: Run Database Migrations

```bash
npm run migrate
```

This will create the necessary database tables.

### Step 5: (Optional) Seed Initial Data

```bash
npm run seed
```

### Step 6: Test Backend Locally

```bash
npm start
```

You should see:
```
Server running on port 3002
Connected to database
```

Stop with `Ctrl+C`.

---

## Frontend Application Setup

### Step 1: Navigate to Web Directory

```bash
cd /home/weighservice/weighservice-sms/web
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File (if needed)

Create `.env` file:

```bash
nano .env
```

Add:

```dotenv
VITE_API_URL=https://your-domain.com
VITE_WS_URL=wss://your-domain.com
```

### Step 4: Build Frontend

```bash
npm run build
```

This creates a `dist/` folder with optimized production files.

### Step 5: Verify Build

```bash
ls -la dist/
```

You should see `index.html`, `assets/`, etc.

---

## Nginx Reverse Proxy Configuration

### Step 1: Create Nginx Configuration File

```bash
sudo nano /etc/nginx/sites-available/weighservice-sms
```

Add this configuration:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

# Main HTTPS server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL certificates (using Certbot with Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root location for static files
    root /home/weighservice/weighservice-sms/web/dist;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts for long-polling
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:3002/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Authentication endpoints
    location /auth/ {
        proxy_pass http://localhost:3002/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Webhooks (Twilio)
    location /webhooks/ {
        proxy_pass http://localhost:3002/webhooks/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React app routing - serve index.html for all other requests
    location / {
        try_files $uri /index.html;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### Step 2: Enable the Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/weighservice-sms /etc/nginx/sites-enabled/

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
```

You should see:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 3: Reload Nginx

```bash
sudo systemctl reload nginx
```

---

## SSL/TLS with Cloudflare

### Option A: Let's Encrypt + Cloudflare (Easiest)

#### Step 1: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### Step 2: Obtain Certificate

```bash
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts. The certificates will be stored in `/etc/letsencrypt/live/your-domain.com/`.

#### Step 3: Update Nginx Configuration

The certificates are already referenced in the Nginx config above. Reload:

```bash
sudo systemctl reload nginx
```

#### Step 4: Set Up Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check timer status
sudo systemctl status certbot.timer
```

### Option B: Cloudflare Origin Certificate

If you prefer to use Cloudflare's managed TLS:

#### Step 1: Create Cloudflare Origin Certificate

1. Go to Cloudflare Dashboard > SSL/TLS > Origin Server
2. Click "Create Certificate"
3. Select your domain (e.g., `your-domain.com`)
4. Leave "Include Subdomains" checked
5. Select a validity period (e.g., 15 years)
6. Click "Create"

#### Step 2: Save Certificate Files

Copy the certificate and key from Cloudflare into your VPS:

```bash
# Create directory
sudo mkdir -p /etc/ssl/cloudflare

# Create certificate file
sudo nano /etc/ssl/cloudflare/cert.pem
# Paste the certificate from Cloudflare

# Create private key file
sudo nano /etc/ssl/cloudflare/key.pem
# Paste the private key from Cloudflare

# Set permissions
sudo chmod 600 /etc/ssl/cloudflare/key.pem
```

#### Step 3: Update Nginx Configuration

Replace the SSL lines in your Nginx config:

```nginx
ssl_certificate /etc/ssl/cloudflare/cert.pem;
ssl_certificate_key /etc/ssl/cloudflare/key.pem;
```

Reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

#### Step 4: Configure Cloudflare DNS

1. In Cloudflare Dashboard, add DNS records:
   - **Type:** A
   - **Name:** your-domain.com
   - **IPv4 Address:** your VPS IP
   - **Proxy Status:** Proxied (orange cloud)

2. Set SSL/TLS mode to "Full (strict)"

---

## Process Management (PM2)

### Step 1: Start Backend with PM2

```bash
cd /home/weighservice/weighservice-sms/backend

# Start the application
pm2 start src/server.js --name "weighservice-backend" --env production

# Verify it's running
pm2 status
```

You should see the process running with status "online".

### Step 2: View Logs

```bash
# Real-time logs
pm2 logs weighservice-backend

# Save logs
pm2 logs weighservice-backend >> ~/backend.log
```

### Step 3: Create PM2 Startup Script

```bash
# Generate startup script
pm2 startup

# Save PM2 process list
pm2 save

# Verify it will auto-start
pm2 show weighservice-backend
```

### Step 4: Restart on Code Changes (Optional)

Create a deployment script `~/deploy.sh`:

```bash
#!/bin/bash
cd /home/weighservice/weighservice-sms/backend
git pull origin main
npm install
npm run migrate
pm2 restart weighservice-backend
echo "Deployment complete at $(date)"
```

Make it executable:

```bash
chmod +x ~/deploy.sh
```

---

## Monitoring and Maintenance

### Step 1: Monitor Processes with PM2

```bash
# Dashboard
pm2 monit

# Email alerts (optional)
pm2 install pm2-auto-pull
```

### Step 2: Monitor System Resources

```bash
# Install htop for real-time monitoring
sudo apt install -y htop

# Run it
htop
```

### Step 3: Check Disk Usage

```bash
# Disk space
df -h

# Directory size
du -sh /home/weighservice/weighservice-sms
```

### Step 4: Monitor PostgreSQL

```bash
# Connect to PostgreSQL
sudo -u postgres psql weighservice_sms

# Useful commands
\dt              -- List tables
\du              -- List users
SELECT * FROM pg_stat_statements;  -- Query performance
\q               -- Exit
```

### Step 5: Set Up Log Rotation

Create `/etc/logrotate.d/weighservice`:

```bash
sudo nano /etc/logrotate.d/weighservice
```

Add:

```
/home/weighservice/.pm2/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 weighservice weighservice
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs weighservice-backend --err

# Check environment variables
cat /home/weighservice/weighservice-sms/backend/.env

# Test database connection manually
psql -h localhost -U weighuser -d weighservice_sms -c "SELECT 1;"
```

### Nginx Not Serving Frontend

```bash
# Check Nginx configuration
sudo nginx -t

# Check if backend is running
pm2 status

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### WebSocket Connection Issues

```bash
# Verify proxy headers in Nginx config
sudo grep -A 5 "socket.io" /etc/nginx/sites-enabled/weighservice-sms

# Check if WebSocket upgrade is allowed
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" https://your-domain.com/socket.io/
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials
psql -h localhost -U weighuser -d weighservice_sms

# Check database permissions
sudo -u postgres psql -c "\dp weighservice_sms"
```

### High CPU/Memory Usage

```bash
# Monitor processes
pm2 monit

# Restart stuck process
pm2 restart weighservice-backend

# Check for memory leaks in backend logs
pm2 logs weighservice-backend | grep -i "memory\|error"
```

### SSL Certificate Issues

```bash
# Check certificate validity
sudo openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout

# Check renewal status
sudo certbot status

# Force renewal if needed
sudo certbot renew --force-renewal
```

---

## Production Checklist

Before going live, verify:

- [ ] Database user has strong password
- [ ] JWT_SECRET is long and random
- [ ] NODE_ENV is set to "production"
- [ ] Twilio credentials are correct and active
- [ ] Google OAuth callback URL matches domain
- [ ] SSL certificate is valid (HTTPS working)
- [ ] Nginx security headers are set
- [ ] Backend logs are monitored
- [ ] Database backups are scheduled
- [ ] Firewall allows only necessary ports
- [ ] PM2 auto-startup is enabled
- [ ] Domain DNS records point to VPS
- [ ] Cloudflare (if used) is configured correctly

---

## Useful Commands Reference

```bash
# Backend commands
pm2 start weighservice-backend
pm2 stop weighservice-backend
pm2 restart weighservice-backend
pm2 delete weighservice-backend
pm2 logs weighservice-backend

# Frontend build and deploy
cd /home/weighservice/weighservice-sms/web
npm run build

# PostgreSQL commands
sudo -u postgres psql weighservice_sms
sudo systemctl restart postgresql
sudo systemctl status postgresql

# Nginx commands
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Firewall commands
sudo ufw status
sudo ufw allow 8080/tcp
sudo ufw delete allow 8080/tcp

# Git commands
cd /home/weighservice/weighservice-sms
git pull origin main
git log --oneline
```

---

## Next Steps

1. **Monitor application** - Check PM2 logs and system metrics daily
2. **Backup database** - Set up automated PostgreSQL backups
3. **Update dependencies** - Keep Node.js, npm, and packages updated
4. **Scale if needed** - Consider load balancing for multiple instances
5. **Add analytics** - Implement monitoring/alerting for production issues

For support, check backend logs with `pm2 logs weighservice-backend` and database logs with `sudo tail -f /var/log/postgresql/`.

---

**Last Updated:** November 2025  
**Version:** 1.0
