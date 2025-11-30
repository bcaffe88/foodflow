# Wilson Pizzaria - Railway Deployment Guide

## 🚀 Step-by-Step Setup

### 1. Create Railway Project
```bash
# Go to https://railway.app
# Click "Create Project"
# Select "Deploy from GitHub"
# Connect your GitHub account
# Select this repository
```

### 2. Configure PostgreSQL Database
```bash
# In Railway dashboard:
# 1. Click "Add Service"
# 2. Select "Database"
# 3. Choose "PostgreSQL"
# 4. Railway will auto-generate DATABASE_URL in environment
```

### 3. Set Environment Variables
In Railway dashboard, go to Variables and add:

```
NODE_ENV=production
JWT_SECRET=your-super-secret-key-here
STRIPE_SECRET_KEY=sk_live_xxxxx (from Replit secrets)
STRIPE_PUBLIC_KEY=pk_live_xxxxx
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-email@firebase.com
DATABASE_URL=postgresql://... (auto-set by Railway)
```

### 4. Configure Webhook URLs
After deployment, update iFood/UberEats webhooks to point to Railway URL:

```
https://your-railway-app.up.railway.app/api/webhooks/ifood/{tenantId}
https://your-railway-app.up.railway.app/api/webhooks/ubereats/{tenantId}
https://your-railway-app.up.railway.app/api/webhooks/loggi/{tenantId}
```

### 5. Deploy
```bash
# Push to main branch
git push origin main

# Railway will auto-deploy from GitHub Actions
# Check deployment status in Railway dashboard
```

### 6. Test Production
```bash
# Health check
curl https://your-railway-app.up.railway.app/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-30T..."}
```

## 🔐 Secrets Configuration

Create GitHub Secrets for automatic Railway deployment:

1. Go to GitHub repo → Settings → Secrets
2. Add:
   - `RAILWAY_TOKEN`: Get from Railway account settings
   - `RAILWAY_PROJECT_ID`: Get from Railway project settings

## 📊 Monitoring

```bash
# View logs in Railway dashboard
# Check real-time metrics
# Monitor database connections
# Alert on errors
```

## 🔄 Auto-Deploy on Push

GitHub Actions workflow will:
1. Run tests on every push to main
2. Build production bundle
3. Auto-deploy to Railway
4. Keep database migrations in sync

## 🆘 Troubleshooting

**App not starting:**
```bash
# Check logs in Railway
# Verify DATABASE_URL is set
# Verify NODE_ENV=production
```

**Webhook failures:**
```bash
# Verify webhook URLs in iFood/UberEats admin
# Check signature headers in logs
# Test with curl
```

**Database migrations:**
```bash
# Railway runs `npm run start` which includes `npm run db:push`
# Migrations auto-apply on startup
```

---

**Status:** ✅ Ready for production deployment
