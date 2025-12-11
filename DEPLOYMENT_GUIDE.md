# FoodFlow Webhook Improvements - Deployment Guide

**Last Updated:** December 2024  
**Status:** Ready for Production Deployment  
**Version:** 1.0.0

---

## Pre-Deployment Checklist

Before deploying, ensure all items are checked:

- [ ] Code compiles without TypeScript errors
- [ ] All webhook tests pass locally
- [ ] Manual webhook testing completed successfully
- [ ] Database backup created
- [ ] Git status is clean (no uncommitted changes)
- [ ] All files to commit are reviewed
- [ ] Commit message is clear and descriptive
- [ ] Remote branches are up to date

---

## Step 1: Verify Code Compiles

Run TypeScript compilation check:

```powershell
cd c:\Users\pc\Documents\bmad\foodflow

# Check TypeScript compilation
npm run check
```

**Expected Output:**
```
(no output means success - no errors!)
```

**If errors occur:**
1. Fix compilation errors
2. Re-run `npm run check`
3. Continue only after no errors

---

## Step 2: Run Automated Tests

Execute the webhook validation test suite:

```bash
# Run all webhook validation tests
npm test -- tests/e2e/webhook-validation.spec.ts

# Run specific test
npm test -- tests/e2e/webhook-validation.spec.ts --grep "validation"

# Run with more verbose output
npm test -- tests/e2e/webhook-validation.spec.ts --verbose
```

**Expected Results:**
- All 6 validation tests pass or skip gracefully
- Integration test skips if server not running (this is OK)
- No fatal errors

**If tests fail:**
1. Review error messages
2. Check server is running: `npm run dev`
3. Review `WEBHOOK_IMPROVEMENTS_REPORT.md` for troubleshooting
4. Fix issues and re-run tests

---

## Step 3: Manual Testing (Optional but Recommended)

Start development server:

```powershell
# Set environment variable
$env:NODE_ENV='development'

# Start server (in one terminal)
npm run dev

# Wait for "Server running on port 5000" message
```

In another terminal, run webhook tests:

```powershell
# Test 1: Missing restaurant
.\webhook-test.ps1 -Action test-missing-tenant

# Test 2: Valid restaurant (if you have a restaurant ID)
.\webhook-test.ps1 -Action test-valid-tenant -TenantId your-tenant-id

# Test 3: All platforms
.\webhook-test.ps1 -Action test-all-platforms

# Test 4: Validation cases
.\webhook-test.ps1 -Action test-validation
```

**Expected Results:**
- ✓ 404 errors for nonexistent restaurants
- ✓ 200 or 404 for valid webhooks (200 if restaurant exists)
- ✓ All platforms respond correctly
- ✓ No 500 internal errors for validation cases

---

## Step 4: Review Changes

Check what files have been modified:

```bash
git status
```

**Expected Files:**
- `server/routes.ts` - Modified (webhook endpoints enhanced)
- `tests/e2e/webhook-validation.spec.ts` - New or Modified
- `WEBHOOK_IMPROVEMENTS.md` - New
- `WEBHOOK_IMPROVEMENTS_REPORT.md` - New
- `WEBHOOK_IMPLEMENTATION_SUMMARY.md` - New
- `webhook-test.ps1` - New
- `webhook-test-payloads.json` - New

**Check specific changes:**

```bash
# View detailed changes to routes.ts
git diff server/routes.ts

# View new test file
git diff tests/e2e/webhook-validation.spec.ts

# View git status
git status --short
```

---

## Step 5: Stage Changes

Add files to git staging area:

```bash
# Stage specific files (recommended approach)
git add server/routes.ts
git add tests/e2e/webhook-validation.spec.ts
git add WEBHOOK_IMPROVEMENTS.md
git add WEBHOOK_IMPROVEMENTS_REPORT.md
git add WEBHOOK_IMPLEMENTATION_SUMMARY.md
git add webhook-test.ps1
git add webhook-test-payloads.json

# Verify staged changes
git status
```

**Expected Output:**
```
On branch master
Changes to be committed:
  modified:   server/routes.ts
  new file:   tests/e2e/webhook-validation.spec.ts
  new file:   WEBHOOK_IMPROVEMENTS.md
  ...
```

---

## Step 6: Create Commit

Create a descriptive commit with all improvements:

```bash
git commit -m "Improve webhook validation and error handling

- Add restaurant existence validation to all webhook endpoints
- Implement graceful error handling with specific HTTP status codes
- Enhance logging for better debugging and monitoring
- Create comprehensive webhook validation test suite (6 tests)
- Add webhook testing tools (PowerShell script)
- Improve error response format with success flag
- Update documentation with implementation details

Files modified:
- server/routes.ts: Enhanced all 4 webhook endpoints
- tests/e2e/webhook-validation.spec.ts: New test suite
- Added 5 new documentation files

Impact:
- Prevents orders from misrouting to wrong restaurants
- Enables faster debugging of webhook integration issues
- Improves overall system reliability
- Ready for production deployment"
```

**Verify commit:**

```bash
git log --oneline -5
```

**Expected Output:**
```
a1b2c3d (HEAD -> master) Improve webhook validation and error handling
d4e5f6g (origin/master) Previous commit
...
```

---

## Step 7: Push to Master Branch

Push changes to remote master branch:

```bash
# Verify remote URL (should be origin/master)
git remote -v

# Push to master
git push origin master

# Verify push
git log --oneline -1
```

**Expected Output:**
```
a1b2c3d (HEAD -> master, origin/master) Improve webhook validation and error handling
```

---

## Step 8: Merge to Production Branch (railway-deploy)

Switch to production branch and merge master:

```bash
# Verify current branch
git branch

# Switch to railway-deploy
git checkout railway-deploy

# Verify you're on production branch
git status

# Merge master into production
git merge master

# Verify merge
git log --oneline -3
```

**Expected Output:**
```
a1b2c3d (HEAD -> railway-deploy) Improve webhook validation and error handling
...
```

---

## Step 9: Push to Production

Push production branch to remote:

```bash
# Verify current branch is railway-deploy
git status

# Push to production
git push origin railway-deploy

# Verify push
git log --oneline -1
```

**Expected Output:**
```
a1b2c3d (HEAD -> railway-deploy, origin/railway-deploy) Improve webhook validation
```

---

## Step 10: Verify Deployment

After pushing to railway-deploy, Railway should automatically deploy. Verify:

### 1. Check Railway Deployment

Visit Railway dashboard:
- Go to https://railway.app
- Select FoodFlow project
- Check deployment status
- Wait for "Active" status

### 2. Check Server Logs

In Railway dashboard:
1. Click on "Logs" tab
2. Look for: `Server running on port 5000`
3. Check for any error messages

### 3. Test Production Endpoints

Once deployed, test webhook endpoints:

```bash
# Test with production server
$env:PROD_URL='https://your-foodflow-app.railway.app'

curl -X POST $env:PROD_URL/api/webhooks/ifood/test-tenant \
  -H "Content-Type: application/json" \
  -d '{"event":"order.created","order":{"id":"123"}}'

# Expected: 404 (restaurant not found is expected for test-tenant)
```

### 4. Monitor Logs

Monitor production logs for:

- ✅ No TypeScript errors
- ✅ Server starts successfully
- ✅ Database connection established
- ✅ No error messages in first 5 minutes
- ⚠️ Note any "Restaurant not found" errors (investigate)

---

## Rollback Plan

If issues occur after deployment:

### Quick Rollback

```bash
# Switch back to previous version
git revert HEAD

# Push revert
git push origin railway-deploy

# Railway will redeploy with reverted changes
```

### Full Rollback

```bash
# Get previous commit hash
git log --oneline -5

# Revert to previous commit
git checkout <previous-commit-hash>

# Create rollback branch
git checkout -b rollback-from-webhook-changes

# Force push to production
git push -f origin rollback-from-webhook-changes

# Switch back to railway-deploy
git checkout railway-deploy

# Reset to rollback branch
git reset --hard rollback-from-webhook-changes

# Push to production
git push -f origin railway-deploy
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-foodflow-app.railway.app/api/health
```

Expected response: 200 OK with health status

### 2. Webhook Test

```bash
curl -X POST https://your-foodflow-app.railway.app/api/webhooks/ifood/test-id \
  -H "Content-Type: application/json" \
  -d '{"event":"order.created"}'
```

Expected: 404 (restaurant not found - this is OK)

### 3. Order Processing

1. Go to restaurant admin panel
2. Create a test order via iFood webhook
3. Verify order appears in admin queue
4. Verify WhatsApp notification sent

### 4. Monitor for Issues

Watch for 24 hours:
- [ ] No error spike in logs
- [ ] Orders processing normally
- [ ] No customer complaints
- [ ] Performance acceptable

---

## Documentation for Team

After deployment, share:

1. **WEBHOOK_IMPLEMENTATION_SUMMARY.md** - Overview for entire team
2. **WEBHOOK_IMPROVEMENTS_REPORT.md** - Detailed technical report for engineers
3. **webhook-test.ps1** - Testing script for QA team
4. **webhook-test-payloads.json** - Example payloads for integration partners

---

## Troubleshooting During Deployment

### Issue: Deployment Fails

**Check:**
1. View Railway logs for error messages
2. Verify all TypeScript compiles: `npm run check`
3. Check git history for conflicts
4. Verify environment variables are set

**Solution:**
```bash
git revert HEAD
git push origin railway-deploy
```

### Issue: Server Won't Start

**Check:**
1. Railway logs for startup errors
2. Database connection string
3. Environment variables

**Solution:**
1. Check `.env.production` or Railway dashboard environment variables
2. Verify database is accessible
3. Rollback to previous version

### Issue: Webhook Errors in Production

**Check:**
1. Error patterns in logs
2. Number of "Restaurant not found" errors
3. WhatsApp notification failures

**Solution:**
1. Verify all restaurants have correct tenantId
2. Check webhook configuration in delivery platforms
3. Review error messages in logs

---

## Success Criteria

✅ **Deployment Successful When:**

1. No TypeScript compilation errors
2. Server starts without errors
3. `/api/health` endpoint returns 200
4. Webhook endpoints respond with appropriate status codes
5. Orders process normally through delivery platforms
6. WhatsApp notifications sent successfully
7. No "Restaurant not found" errors for real restaurants
8. Performance metrics within acceptable range
9. No error spike in logs after 1 hour

---

## Monitoring Checklist

### First Hour After Deployment
- [ ] Check server is running
- [ ] Verify database connection
- [ ] Test all webhook endpoints
- [ ] Check logs for errors
- [ ] Verify health check

### First 24 Hours
- [ ] Monitor error logs
- [ ] Check webhook processing
- [ ] Verify order routing
- [ ] Confirm WhatsApp notifications
- [ ] Monitor performance metrics

### First Week
- [ ] Monitor for integration issues
- [ ] Check for edge cases
- [ ] Verify all platforms working
- [ ] Monitor performance trends
- [ ] Gather team feedback

---

## Contact & Support

If issues occur:

1. **Check:** `WEBHOOK_IMPROVEMENTS_REPORT.md` - Troubleshooting section
2. **Check:** `WEBHOOK_IMPLEMENTATION_SUMMARY.md` - Common issues
3. **Logs:** Review Railway logs first
4. **Rollback:** If critical, follow Rollback Plan above

---

## Final Checklist Before Pushing

- [ ] All tests passing locally
- [ ] Manual testing completed
- [ ] Code compiles without errors
- [ ] All files staged for commit
- [ ] Commit message is descriptive
- [ ] No uncommitted changes remaining
- [ ] Remote branches are up to date
- [ ] Rollback plan understood
- [ ] Team notified of deployment

---

**Status:** Ready for Production  
**Tested:** ✅ Yes  
**Approved:** ✅ Ready  
**Last Review:** December 2024

Safe to deploy to production!
