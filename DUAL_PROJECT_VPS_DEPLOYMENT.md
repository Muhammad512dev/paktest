# Dual-Project VPS Deployment Guide
**Server Specs:** 6 vCPU, 8 GB RAM, 60 GB NVMe (Ubuntu 22.04 / 24.04)

This guide provides the complete production method for hosting **two distinct web applications** (e.g., PakParcha AI and Seerat Model) on the exact same VPS without conflict, utilizing low resources.

---

## The Architecture Strategy
To keep RAM and CPU usage extremely low while hosting two projects, we will:
1. **Share the Database & Cache:** Both apps will connect to the same PostgreSQL server (using different databases) and the same Redis server.
2. **Use Nginx Server Blocks:** Nginx will listen on port 80/443 and route traffic to the correct project based on the domain name the user typed.
3. **Use PM2 for Backend Routing:** The Node.js backends will run on different internal ports (e.g., 5000 and 5001).

---

## Phase 1: Server Preparation
*(Do this only once for the entire VPS)*

1. **Update system & install core dependencies:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx postgresql postgresql-contrib redis-server ufw
   ```
2. **Install Node.js & PM2:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm install -g pm2
   ```
3. **Configure Firewall:**
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw --force enable
   ```

---

## Phase 2: Database Setup (Shared PostgreSQL)
Instead of installing two database servers, we create two databases inside our one PostgreSQL server.

1. **Login to PostgreSQL:**
   ```bash
   sudo -u postgres psql
   ```
2. **Create the databases and users:**
   ```sql
   -- Project 1: PakParcha
   CREATE DATABASE paktest_db;
   CREATE USER paktest_user WITH ENCRYPTED PASSWORD 'your_secure_password_1';
   GRANT ALL PRIVILEGES ON DATABASE paktest_db TO paktest_user;

   -- Project 2: Seerat Model
   CREATE DATABASE seerat_db;
   CREATE USER seerat_user WITH ENCRYPTED PASSWORD 'your_secure_password_2';
   GRANT ALL PRIVILEGES ON DATABASE seerat_db TO seerat_user;
   
   \q
   ```

---

## Phase 3: Project 1 Setup (PakParcha AI)

1. **Clone & Install:**
   ```bash
   mkdir -p /var/www/paktest
   # Upload your code or git clone here
   cd /var/www/paktest
   
   npm install
   cd backend && npm install
   ```

2. **Configure Environment:**
   - In `/var/www/paktest/.env.production`, ensure `VITE_API_URL=` (leave it empty).
   - In `/var/www/paktest/backend/.env`, set:
     ```env
     PORT=5000
     DATABASE_URL="postgresql://paktest_user:your_secure_password_1@localhost:5432/paktest_db?schema=public"
     REDIS_URL="redis://localhost:6379/0"
     ```

3. **Build & Start Backend:**
   ```bash
   cd /var/www/paktest
   npm run build
   
   cd backend
   npx prisma db push
   pm2 start dist/server.js --name "paktest-api"
   ```

---

## Phase 4: Project 2 Setup (Seerat Model)

1. **Clone & Install:**
   ```bash
   mkdir -p /var/www/seerat
   # Upload your Seerat Model code here
   cd /var/www/seerat
   
   npm install
   cd backend && npm install
   ```

2. **Configure Environment:**
   - In `/var/www/seerat/.env.production`, ensure `VITE_API_URL=` (leave it empty).
   - In `/var/www/seerat/backend/.env`, set a **DIFFERENT PORT** and **DIFFERENT DB**:
     ```env
     PORT=5001   <-- CRITICAL: Must be different from Project 1
     DATABASE_URL="postgresql://seerat_user:your_secure_password_2@localhost:5432/seerat_db?schema=public"
     REDIS_URL="redis://localhost:6379/1"  <-- CRITICAL: Use DB index 1 instead of 0
     ```

3. **Build & Start Backend:**
   ```bash
   cd /var/www/seerat
   npm run build
   
   cd backend
   npx prisma db push
   pm2 start dist/server.js --name "seerat-api"
   ```

4. **Save PM2 State:**
   ```bash
   pm2 save
   pm2 startup
   ```

---

## Phase 5: Nginx Reverse Proxy (The Traffic Cop)

We will create two separate Nginx configuration files so Nginx knows which domain goes to which project folder.

### Config 1: PakParcha
```bash
sudo nano /etc/nginx/sites-available/paktest
```
Paste this:
```nginx
server {
    listen 80;
    server_name pakparcha.com www.pakparcha.com;
    client_max_body_size 50M;

    root /var/www/paktest/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;  # <-- Points to PM2 port 5000
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### Config 2: Seerat Model
```bash
sudo nano /etc/nginx/sites-available/seerat
```
Paste this:
```nginx
server {
    listen 80;
    server_name seeratmodel.com www.seeratmodel.com;
    client_max_body_size 50M;

    root /var/www/seerat/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5001;  # <-- Points to PM2 port 5001
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

### Enable Both Sites:
```bash
sudo ln -s /etc/nginx/sites-available/paktest /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/seerat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

---

## Phase 6: Secure Both with SSL

Run Certbot. It will detect both domains from your Nginx configs.
```bash
sudo certbot --nginx
```
- Select both domains when prompted.
- Choose "Redirect HTTP to HTTPS".

**Done!** You are now running two completely isolated, full-stack web applications on a single VPS with highly efficient memory and CPU usage.
