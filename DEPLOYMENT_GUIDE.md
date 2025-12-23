# Lava Bytes Radio - Deployment Guide

This guide covers two deployment options for Lava Bytes Radio:
1. **Replit Deployment** - Quick and easy with built-in hosting
2. **Self-Hosted VPS Deployment** - Full control on your own server

---

## Option 1: Deploy on Replit with Custom Domain

The easiest way to get your app live with a custom domain.

### Step 1: Publish Your App

1. Click the **Publish** button in Replit
2. Follow the prompts to deploy your app
3. Your app will be available at `your-app-name.replit.app`

### Step 2: Connect Your Custom Domain

1. Go to the **Deployments** tab in your Replit project
2. Select the **Settings** tab
3. Click **Link a domain** or **Manually connect from another registrar**
4. Enter your custom domain name (e.g., `lavabytesradio.com`)

### Step 3: Configure DNS Records

In your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

1. Add an **A Record**:
   - Type: `A`
   - Name: `@` (or your domain)
   - Value: The IP address provided by Replit
   - TTL: 3600

2. Add a **TXT Record** (for verification):
   - Type: `TXT`
   - Name: `@`
   - Value: The verification code provided by Replit

3. For `www` subdomain, add another **A Record**:
   - Type: `A`
   - Name: `www`
   - Value: Same IP address as above

### Step 4: Wait for DNS Propagation

- DNS changes can take 5 minutes to 48 hours to propagate
- Check propagation status at [whatsmydns.net](https://www.whatsmydns.net)
- Once complete, your domain will load your Replit app with automatic HTTPS

---

## Option 2: Self-Hosted VPS Deployment

Deploy on your own server (DigitalOcean, Linode, AWS, etc.) for full control.

### Prerequisites

- VPS server running Ubuntu 20.04/22.04
- Domain name with DNS access
- SSH access to your server
- PostgreSQL database (local or hosted like Neon, Supabase)

### Step 1: Initial Server Setup

```bash
# Connect to your server
ssh root@your_server_ip

# Update system
sudo apt update && sudo apt upgrade -y

# Create a deploy user (recommended)
sudo adduser deploy
sudo usermod -aG sudo deploy
```

### Step 2: Install Node.js

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v  # Should show v20.x.x
npm -v
```

### Step 3: Install PM2 Process Manager

PM2 keeps your app running and auto-restarts on crashes:

```bash
sudo npm install -g pm2
```

### Step 4: Clone and Setup Your App

```bash
# Create web directory
sudo mkdir -p /var/www
cd /var/www

# Clone your repository (or upload files via SCP)
git clone https://github.com/yourusername/lava-bytes-radio.git
cd lava-bytes-radio

# Install dependencies
npm install --production

# Set permissions
sudo chown -R $USER:$USER /var/www/lava-bytes-radio
```

### Step 5: Configure Environment Variables

Create a `.env` file:

```bash
nano .env
```

Add your production environment variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your_secure_random_string_here

# Object Storage (if using Google Cloud Storage)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your_bucket_id
PRIVATE_OBJECT_DIR=.private
PUBLIC_OBJECT_SEARCH_PATHS=public
```

### Step 6: Build the Application

```bash
# Build the frontend and backend
npm run build
```

### Step 7: Start with PM2

```bash
# Start the production server
pm2 start dist/index.js --name "lava-bytes-radio"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Run the command it outputs
```

### Step 8: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/lavabytesradio.com
```

Add this configuration (replace `lavabytesradio.com` with your domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name lavabytesradio.com www.lavabytesradio.com;
    
    # Increase max upload size for audio files
    client_max_body_size 100M;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/lavabytesradio.com /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 9: Configure Your Domain's DNS

In your domain registrar, add:

```
Type: A
Name: @
Value: your_server_ip_address
TTL: 3600

Type: A
Name: www
Value: your_server_ip_address
TTL: 3600
```

### Step 10: Install SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d lavabytesradio.com -d www.lavabytesradio.com

# Follow prompts (enter email, agree to terms)
```

Certbot automatically configures Nginx for HTTPS and sets up auto-renewal.

Test auto-renewal:

```bash
sudo certbot renew --dry-run
```

### Step 11: Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 12: Verify Deployment

1. Visit `https://lavabytesradio.com` in your browser
2. Check for the padlock icon (SSL working)
3. Test the radio player functionality

---

## Database Setup (for Self-Hosted)

### Option A: Use a Managed PostgreSQL Service

Recommended services:
- **Neon** (free tier available) - [neon.tech](https://neon.tech)
- **Supabase** (free tier available) - [supabase.com](https://supabase.com)
- **Railway** - [railway.app](https://railway.app)

Just use the connection string they provide as your `DATABASE_URL`.

### Option B: Install PostgreSQL Locally

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE lavabytesradio;
CREATE USER lavauser WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE lavabytesradio TO lavauser;
\q
```

Update your `.env`:

```env
DATABASE_URL=postgresql://lavauser:your_secure_password@localhost:5432/lavabytesradio
```

Run database migrations:

```bash
npm run db:push
```

---

## Object Storage Setup (for Self-Hosted)

For audio file storage, you have several options:

### Option A: Local File Storage

Store files on your server's filesystem (simplest option for small deployments).

### Option B: Google Cloud Storage

1. Create a GCS bucket
2. Set up service account credentials
3. Configure environment variables

### Option C: AWS S3

1. Create an S3 bucket
2. Configure IAM credentials
3. Update the object storage service to use S3

---

## Useful PM2 Commands

```bash
pm2 list                      # List all apps
pm2 logs lava-bytes-radio     # View logs
pm2 restart lava-bytes-radio  # Restart app
pm2 stop lava-bytes-radio     # Stop app
pm2 monit                     # Monitor resources
```

---

## Updating Your Deployed App

```bash
cd /var/www/lava-bytes-radio

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install --production

# Rebuild
npm run build

# Restart the app
pm2 restart lava-bytes-radio
```

---

## Troubleshooting

### App not loading?
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs lava-bytes-radio`
- Verify Nginx config: `sudo nginx -t`

### 502 Bad Gateway?
- Ensure app is running: `pm2 list`
- Check if port 5000 is correct
- Check app logs for errors

### Domain not working?
- Wait for DNS propagation (up to 48 hours)
- Verify DNS records: `dig lavabytesradio.com`
- Clear browser cache

### SSL certificate issues?
- Re-run Certbot: `sudo certbot --nginx -d yourdomain.com`
- Check certificate status: `sudo certbot certificates`

---

## Security Checklist

- [ ] Use strong, unique passwords
- [ ] Keep `SESSION_SECRET` secure and random
- [ ] Never commit `.env` files to git
- [ ] Keep system packages updated
- [ ] Enable firewall (UFW)
- [ ] Use HTTPS (SSL certificate)
- [ ] Regularly backup your database

---

## Support

For issues specific to:
- **Replit hosting**: Check [Replit Docs](https://docs.replit.com)
- **VPS/Server issues**: Contact your hosting provider
- **App bugs**: Check the GitHub issues or logs

Happy streaming! 🎵
