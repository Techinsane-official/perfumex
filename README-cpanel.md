# 🚀 cPanel Deployment Guide for Perfume Selling App

## 📋 Prerequisites

- cPanel with Node.js 18+ support
- SSH access to your cPanel account
- Domain name configured

## 🛠️ Step-by-Step Deployment

### 1. Upload Files to cPanel

1. **Via File Manager:**
   - Go to cPanel → File Manager
   - Navigate to your domain's public_html or a subdirectory
   - Upload all project files

2. **Via SSH (Recommended):**
   ```bash
   # Connect to your cPanel via SSH
   ssh username@yourdomain.com
   
   # Navigate to your domain directory
   cd public_html
   
   # Upload files (you can use git clone or scp)
   git clone https://github.com/your-repo/perfume-app.git
   ```

### 2. Configure Environment Variables

1. **Create .env file:**
   ```bash
   cp .env.cpanel .env
   ```

2. **Edit .env file with your actual values:**
   - Replace `yourdomain.com` with your actual domain
   - Update email settings if needed
   - Keep database URLs as they are (using Supabase)

### 3. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install PM2 globally (if not already installed)
npm install -g pm2
```

### 4. Build and Deploy

```bash
# Make deployment script executable
chmod +x cpanel-deploy.sh

# Run deployment script
./cpanel-deploy.sh
```

### 5. Configure Domain

1. **In cPanel:**
   - Go to Domains → Manage Domains
   - Point your domain to the correct directory

2. **Set up reverse proxy (if needed):**
   - Go to cPanel → Apache Configuration
   - Add reverse proxy rules to forward requests to port 3000

### 6. Start the Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

## 🔧 Configuration Files

### ecosystem.config.js
PM2 configuration for process management.

### cpanel-deploy.sh
Automated deployment script.

### .env.cpanel
Environment variables template.

## 📊 Monitoring

```bash
# Check application status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit
```

## 🔄 Updates

```bash
# Pull latest changes
git pull

# Rebuild and restart
npm run build
pm2 restart perfume-app
```

## 🛡️ Security Considerations

1. **Environment Variables:**
   - Keep .env file secure
   - Don't commit sensitive data

2. **PM2 Security:**
   - Use PM2 ecosystem file for configuration
   - Set up proper logging

3. **Domain Security:**
   - Use HTTPS
   - Configure proper headers

## 🐛 Troubleshooting

### Common Issues:

1. **Port 3000 not accessible:**
   - Check firewall settings
   - Configure reverse proxy

2. **Database connection issues:**
   - Verify DATABASE_URL in .env
   - Check Supabase connection

3. **Build errors:**
   - Ensure Node.js 18+ is installed
   - Check npm install completed

### Useful Commands:

```bash
# Check Node.js version
node --version

# Check PM2 status
pm2 status

# View application logs
pm2 logs perfume-app

# Restart application
pm2 restart perfume-app

# Stop application
pm2 stop perfume-app
```

## 📞 Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs`
2. Verify environment variables
3. Ensure all dependencies are installed
4. Check domain configuration

## 🎯 Login Credentials

After deployment, you can login with:
- **Email:** mkalleche@gmail.com
- **Password:** admin123

---

**✅ Your app should now be running on your cPanel domain!** 