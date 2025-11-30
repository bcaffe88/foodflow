# 🚀 RAILWAY DEPLOYMENT GUIDE

**Status**: Ready for production deployment  
**Time to Deploy**: 10 minutes  
**Cost**: FREE tier available ($5/month recommended)

---

## 🎯 STEP-BY-STEP DEPLOYMENT

### Step 1: Connect GitHub Repository
```bash
1. Go to railway.app
2. Click "New Project"
3. Select "GitHub" 
4. Authorize and select your repo
5. Railway auto-detects Node.js
```

### Step 2: Configure Environment Variables
In Railway Dashboard → Project → Variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/wilson_pizzaria

# Authentication & Security
JWT_SECRET=your-secure-random-string-32-chars-minimum
NODE_ENV=production

# Payments (Get from Stripe Live account)
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here

# Notifications (Optional but recommended)
SENDGRID_API_KEY=SG.your_sendgrid_key
FIREBASE_PROJECT_ID=your_firebase_project
FIREBASE_CLIENT_EMAIL=your_firebase_email
FIREBASE_PRIVATE_KEY=your_firebase_key

# WhatsApp Integration (Optional)
N8N_HOST=https://your-n8n-instance.com
N8N_API_KEY=your_n8n_key

# Supabase (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_key

# Redis Cache (Optional)
REDIS_URL=redis://user:password@host:6379
```

### Step 3: Configure Build & Deploy Settings
```
Build Command: npm run build
Start Command: npm start
Port: 5000 (auto-detected)
```

### Step 4: Deploy!
```
Railway auto-deploys on git push
Watch logs in dashboard
Takes 2-5 minutes typically
```

---

## 📊 DEPLOYMENT CHECKLIST

- [ ] GitHub repo created
- [ ] Railway project linked
- [ ] Environment variables set
- [ ] Database URL configured
- [ ] First deploy successful
- [ ] Health check passed (GET /api/health)
- [ ] Login endpoint tested
- [ ] Stripe keys verified (not logged)
- [ ] WebSocket working
- [ ] Database migrations ran

---

## 🔍 POST-DEPLOYMENT VALIDATION

### Test 1: Health Check
```bash
curl https://your-app.railway.app/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Test 2: Public API
```bash
curl https://your-app.railway.app/api/storefront/restaurants
# Expected: Wilson Pizzaria restaurant data
```

### Test 3: Login
```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@foodflow.com","password":"Admin123!"}'
# Expected: JWT token + user data
```

### Test 4: Security (No Stripe Keys)
```bash
curl https://your-app.railway.app/api/admin/tenants \
  -H "Authorization: Bearer YOUR_TOKEN" | grep -i stripesecretkey
# Expected: (empty - keys NOT exposed)
```

---

## 💾 DATABASE SETUP

### Option 1: Railway PostgreSQL (RECOMMENDED)
```
1. In Railway Dashboard
2. Create new PostgreSQL service
3. Copy DATABASE_URL to env vars
4. Migrations auto-run on deploy
```

### Option 2: Existing PostgreSQL
```
Set DATABASE_URL environment variable
Migrations will run automatically
```

### Verify Database Connected
```bash
# Check logs for:
# [DB] ✅ PostgreSQL connected successfully
# [6:09:26 PM] [express] ✅ Migrations complete.
```

---

## 🔐 SECURITY CHECKLIST

- [ ] No hardcoded secrets in code
- [ ] All secrets in environment variables
- [ ] Stripe keys: secret NOT exposed (only public)
- [ ] JWT_SECRET: Set to random 32+ char string
- [ ] HTTPS: Auto-enabled by Railway
- [ ] Rate limiting: Enabled
- [ ] CORS: Configured for your domain
- [ ] Headers: Security headers active

---

## 📈 MONITORING & LOGS

### View Logs
```
Railway Dashboard → Logs tab
Real-time streaming logs
Filter by service
```

### Common Log Messages
```
✅ [DB] ✅ PostgreSQL connected successfully
✅ [6:09:26 PM] [express] ✅ Migrations complete.
✅ [DriverSocket] WebSocket server initialized
⚠️ [Stripe] STRIPE_SECRET_KEY not set (OK if using Stripe keys)
```

### Set Up Alerts (Optional)
```
Railway Dashboard → Settings → Notifications
Get alerts for:
- Build failures
- Deployment complete
- High resource usage
```

---

## 🆘 TROUBLESHOOTING

| Error | Solution |
|-------|----------|
| `DATABASE_URL invalid` | Check PostgreSQL service is running in Railway |
| `Build failed` | Check npm run build works locally |
| `App crashes on start` | Check logs for missing env vars |
| `401 Unauthorized on admin endpoints` | JWT_SECRET mismatch or missing token |
| `Stripe keys exposed in logs` | Review code for console.log statements |

---

## 💰 COSTS (Railroad)

| Service | Price | Notes |
|---------|-------|-------|
| Compute | $0.39/GB-hour | ~$5/month for 1GB |
| PostgreSQL | $15/month | Managed by Railway |
| Total | ~$20/month | Can scale down to free tier |

---

## 🚀 AFTER DEPLOYMENT

### Day 1
- [ ] Verify all endpoints working
- [ ] Check admin login works
- [ ] Confirm Stripe keys not exposed
- [ ] Monitor error logs

### Week 1
- [ ] Setup error tracking (Sentry)
- [ ] Configure logging (Papertrail)
- [ ] Setup uptime monitoring
- [ ] Configure alerts

### Ongoing
- [ ] Monitor performance
- [ ] Update dependencies monthly
- [ ] Backup database regularly
- [ ] Review security logs

---

## 📞 SUPPORT

Railway Support: support@railway.app  
Docs: https://docs.railway.app

---

**You're deployed! 🚀**
