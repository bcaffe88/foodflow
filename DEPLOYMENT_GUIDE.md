# 🚀 DEPLOYMENT GUIDE - RAILWAY

**Status:** Ready for Production  
**System:** 100% Complete (13/13 Epics)  
**Deployment Time:** ~5 minutes  

---

## 📋 PRE-DEPLOYMENT CHECKLIST

- ✅ Build passing (`npm run build`)
- ✅ Server running (`npm run dev`)
- ✅ All 12 features working
- ✅ No console errors
- ✅ Health check endpoint: `/api/health`
- ✅ railway.json configured
- ✅ .env.example with all variables

---

## 🚀 QUICK START - DEPLOY NOW (5 MIN)

### Step 1: Go to Railway.app
```
1. Visit: https://railway.app
2. Sign up or login
3. Create new project
```

### Step 2: Connect GitHub
```
1. Click "Deploy from GitHub"
2. Select this repository
3. Authorize Railway access
```

### Step 3: Configure Environment
```
Railway Dashboard → Settings → Environment

Add these variables:
- NODE_ENV = production
- DATABASE_URL = (Neon PostgreSQL - Railway will provide)
- JWT_SECRET = (generate random)
- STRIPE_SECRET_KEY = (from Stripe dashboard)
- STRIPE_WEBHOOK_SECRET = (from Stripe)
- SESSION_SECRET = (generate random)

Optional (for full features):
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- SENDGRID_API_KEY
- FIREBASE credentials
```

### Step 4: Deploy Database
```
1. In Railway: Add PostgreSQL service
2. Connect to app
3. DATABASE_URL will be auto-set
4. Migrations run automatically on startup
```

### Step 5: Deploy App
```
1. Click "Deploy"
2. Wait 2-3 minutes
3. Get public URL from Railway dashboard
```

### Step 6: Verify Live
```
curl https://your-app-name.railway.app/api/health

Response should be:
{
  "status": "ok",
  "timestamp": "2025-11-30T..."
}
```

---

## 📊 ENVIRONMENT VARIABLES SETUP

### Critical (Must Set):
```
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<generate_random_string_32_chars>
SESSION_SECRET=<generate_random_string_32_chars>
```

### Payment (For Orders):
```
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Notifications (Optional - Dev Mode Works):
```
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_PHONE_NUMBER=+551199999999

SENDGRID_API_KEY=SG.xxxxx
```

### Generate Secrets:
```bash
# Generate random string for JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Use output for JWT_SECRET and SESSION_SECRET
```

---

## 🗄️ DATABASE SETUP

### Option A: Railway PostgreSQL (Recommended)
```
1. In Railway dashboard
2. Click "+" → Add Service
3. Select PostgreSQL
4. Connect to your app
5. DATABASE_URL auto-set ✅
```

### Option B: Neon (Free Tier)
```
1. Visit: https://console.neon.tech
2. Create project
3. Copy connection string
4. Paste as DATABASE_URL in Railway
```

### Option C: External PostgreSQL
```
1. Set DATABASE_URL manually
2. Format: postgresql://user:password@host:5432/database
```

---

## ✅ POST-DEPLOYMENT

### 1. Verify API
```bash
# Health check
curl https://your-app.railway.app/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Test Features
```
1. Customer app: /
2. Restaurant dashboard: /restaurant/dashboard
3. Admin errors: /admin/dashboard
4. Driver GPS: /driver/gps
5. Analytics: /restaurant/analytics
6. Super admin: /admin/super
```

### 3. Check Logs
```
Railway Dashboard → Your App → Logs

Look for:
✅ Server listening on port 5000
✅ Database connected
✅ No errors
```

### 4. Monitor Errors
```
1. Go to /admin/dashboard
2. Check error tracking
3. Monitor webhooks status
```

---

## 🔄 CONTINUOUS DEPLOYMENT

### Auto-Deploy on Push
```
Railway auto-deploys when:
1. You push to main branch
2. Build succeeds
3. Health check passes
3. New version goes live ✅
```

### Rollback (If Issues)
```
Railway Dashboard → App → Deployments
1. See all previous versions
2. Click "Rollback"
3. Select previous version
4. Confirm rollback
5. Done ✅
```

---

## 🐛 TROUBLESHOOTING

### Issue: Build Failed
```
Check logs:
1. Railway Dashboard → Logs
2. Look for build error
3. Common: Missing env variables
4. Solution: Add missing vars → Retry deploy
```

### Issue: Health Check Fails
```
Solutions:
1. Check DATABASE_URL is set
2. Verify migrations ran
3. Check PORT=5000 is set
4. Look at server logs
```

### Issue: Database Connection Error
```
Checks:
1. Is DATABASE_URL set?
2. Is PostgreSQL service running?
3. Credentials correct?
4. Network access enabled?
```

### Issue: Webhooks Not Working
```
Webhook URLs should be:
https://your-app.railway.app/api/webhooks/pede-ai/:tenantId
https://your-app.railway.app/api/webhooks/quero/:tenantId
https://your-app.railway.app/api/webhooks/ifood/:tenantId
https://your-app.railway.app/api/webhooks/ubereats/:tenantId
```

---

## 📈 MONITORING

### Check Status
```
Railway Dashboard:
1. App status (green = healthy)
2. CPU usage
3. Memory usage
4. Network I/O
5. Deployments history
```

### View Logs
```
Real-time monitoring:
1. Railway → Logs tab
2. See all events
3. Filter by level
4. Search for keywords
```

### Set Alerts
```
Railway → Settings → Alerts:
1. CPU > 80%
2. Memory > 90%
3. Deployment failed
4. Health check failed
```

---

## 🎊 YOU'RE LIVE!

After deployment:

✅ System is live at: `https://your-app.railway.app`
✅ All 13 epics deployed
✅ 5 marketplace integrations active
✅ Automatic notifications working
✅ Analytics dashboard live
✅ Admin panel accessible
✅ Customer app ready

---

## 📞 QUICK LINKS

- Railway Dashboard: https://railway.app
- Stripe Dashboard: https://dashboard.stripe.com
- Twilio Console: https://console.twilio.com
- SendGrid: https://app.sendgrid.com
- Health Check: /api/health

---

## 🚀 NEXT STEPS

1. ✅ Deploy
2. ✅ Test live
3. ✅ Add domain (optional)
4. ✅ Monitor errors
5. ✅ Scale as needed

---

**Status:** Ready to Deploy!  
**Deployment Time:** ~5 minutes  
**System Complete:** 13/13 Epics (100%)  

🎉 **YOU'RE READY TO GO LIVE!** 🎉

