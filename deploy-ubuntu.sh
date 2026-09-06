#!/bin/bash
# ==============================================================================
# PakParcha AI - Automated Production Deployment Script for Ubuntu 22.04 / 24.04
# ==============================================================================

set -e

echo "=========================================="
echo " Starting PakParcha AI VPS Setup & Deploy "
echo "=========================================="

# 1. Update and Upgrade Packages
sudo apt update && sudo apt upgrade -y

# 2. Install Essentials
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx postgresql postgresql-contrib redis-server ufw

# 3. Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install PM2 Globally
sudo npm install -g pm2

# 5. Configure Firewall (UFW)
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 6. Enable and Start Services
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl enable redis-server
sudo systemctl start redis-server
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "=========================================="
echo " Core packages and services installed!    "
echo "=========================================="
