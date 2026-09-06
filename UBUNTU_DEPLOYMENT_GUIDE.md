# ==============================================================================
# PakParcha AI — Complete Ubuntu VPS Deployment & Domain Setup Guide
# ==============================================================================

This step-by-step guide walks you through deploying **PakParcha AI** on a fresh **Ubuntu 22.04 / 24.04 VPS** with:
- Node.js 20 & PM2 Cluster
- Local PostgreSQL Database
- Local Redis Cache (high concurrency)
- Nginx Reverse Proxy with Gzip & File limits
- Free SSL Certificate (Let's Encrypt Certbot)
- Custom Domain DNS Configuration
- Cloudflare CDN Setup (optional but recommended)

---

## Phase 1: Connect to your Ubuntu VPS

Open PowerShell or Terminal on your local PC:

```bash
ssh root@YOUR_SERVER_IP
```
*(Enter your server password when prompted)*

---

## Phase 2: Run Initial System Setup & Packages

Run the automated script or run these commands one by one:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install essentials, Nginx, PostgreSQL, Redis, Certbot
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx postgresql postgresql-contrib redis-server ufw

# 3. Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install PM2 process manager globally
sudo npm install -g pm2

# 5. Enable firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

Verify installations:
```bash
node -v    # should show v20.x.x
npm -v     # should show 10.x.x
pm2 -v     # should show pm2 version
```

---

## Phase 3: Setup Local PostgreSQL Database

Create the PostgreSQL user and database:

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell (`postgres=#`), run:

```sql
CREATE DATABASE paktest_db;
CREATE USER paktest_user WITH ENCRYPTED PASSWORD 'YourStrongDbPasswordHere123!';
GRANT ALL PRIVILEGES ON DATABASE paktest_db TO paktest_user;
ALTER DATABASE paktest_db OWNER TO paktest_user;
\q
```

---

## Phase 4: Configure Domain DNS Records

Go to where you bought your domain (Namecheap, GoDaddy, Cloudflare, etc.) -> **DNS Management**:

Add two **A Records**:

| Type | Name / Host | Target / Value | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `YOUR_SERVER_IP` | Auto / 1 min |
| **A** | `www` | `YOUR_SERVER_IP` | Auto / 1 min |

*(If using a subdomain like `api.yourdomain.com`, add `A` record with name `api` pointing to `YOUR_SERVER_IP`).*

---

## Phase 5: Clone & Build the Application

On your Ubuntu server:

```bash
# 1. Go to web directory
cd /var/www

# 2. Clone repository from GitHub
git clone https://github.com/Muhammad512dev/paktest.git
cd paktest

# 3. Install dependencies for frontend & backend
npm install
cd backend && npm install && cd ..
```

### Create Backend `.env` File:

```bash
nano /var/www/paktest/backend/.env
```

Paste your production variables into nano:

```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://paktest_user:YourStrongDbPasswordHere123!@localhost:5432/paktest_db?schema=public"
DATABASE_POOL_SIZE=20
JWT_SECRET="generate_a_random_32_character_secret_here"
REDIS_URL="redis://localhost:6379"
GEMINI_API_KEY="your_gemini_api_keys_comma_separated"
STORAGE_PROVIDER="local"
PUBLIC_API_URL="https://yourdomain.com"
```
*(Press `Ctrl + O`, then `Enter` to save, and `Ctrl + X` to exit).*

---

## Phase 6: Run Database Migrations & Build Code

```bash
cd /var/www/paktest/backend

# 1. Push Prisma database schema to PostgreSQL
npx prisma db push

# 2. Compile TypeScript backend to JavaScript
npx tsc

# 3. Build frontend production assets
cd /var/www/paktest
npm run build
```

---

## Phase 7: Start Backend with PM2 (Cluster Mode)

Run the backend with PM2 so it stays alive 24/7 and auto-restarts on server reboot:

```bash
cd /var/www/paktest/backend

# Start in cluster mode using all CPU cores
pm2 start dist/server.js -i max --name "paktest-api"

# Save PM2 state
pm2 save

# Setup PM2 startup script on boot
pm2 startup
```
*(Copy and paste the line that PM2 outputs to enable auto-boot).*

---

## Phase 8: Configure Nginx Reverse Proxy

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/paktest
```

Paste this configuration (replace `yourdomain.com` with your real domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Client body limit for exam PDF and image uploads
    client_max_body_size 50M;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # 1. Frontend Static Files
    root /var/www/paktest/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Uploaded Files
    location /uploads/ {
        alias /var/www/paktest/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # 3. Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/paktest /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Phase 9: Setup Free SSL (HTTPS) with Certbot

Run Certbot to automatically fetch and configure SSL certificates:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

- Enter your email address when asked.
- Agree to terms (`Y`).
- Choose **Redirect HTTP to HTTPS** (Option 2).

Certbot will automatically install the SSL certificate and configure auto-renewal!

---

## Phase 10: How to Use Antigravity / AI Agent with your Ubuntu VPS

You have **two powerful ways** to use me (Antigravity) with your Ubuntu VPS:

### Method A: Direct Remote Pairing via VS Code (Recommended)
1. In your Antigravity / VS Code IDE, install the extension **Remote - SSH** (Microsoft).
2. Click the green icon in the bottom-left corner -> **Connect to Host...** -> Enter `ssh root@YOUR_SERVER_IP`.
3. Open the folder `/var/www/paktest`.
4. I will then have full direct access to edit your Ubuntu files, run server terminal commands, restart PM2, check logs, and manage Nginx directly!

### Method B: Git Push & Auto-Deploy (Continuous Deployment)
Whenever you ask me to make changes here on your local computer:
1. I push the code to your GitHub repository (`git push origin main`).
2. On your VPS, you simply run:
   ```bash
   cd /var/www/paktest
   git pull origin main
   npm run build
   pm2 restart paktest-api
   ```
   *(Or you can set up a GitHub webhook to automate this on every commit).*
