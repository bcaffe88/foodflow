# Next Steps After Deployment

## 🎯 Immediate (Day 1)

### Production Health Checks
```bash
# 1. Health endpoint
curl https://your-app.railway.app/api/health

# 2. Login as owner
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wilson@wilsonpizza.com","password":"wilson123"}'

# 3. Create test order
# Navigate to https://your-app.railway.app/ and place test order

# 4. Monitor logs
# Go to Railway dashboard → Logs
```

### Webhook Configuration
1. Get your Railway app URL from Railway dashboard
2. Update iFood webhook URL in iFood Partner App
3. Update UberEats webhook URL in UberEats Partner Portal
4. Send test order from iFood/UberEats sandbox
5. Verify order appears in dashboard

---

## 📅 Week 1

### iFood Integration
- [ ] Request iFood API sandbox access
- [ ] Register webhook in iFood sandbox
- [ ] Test order.created flow
- [ ] Implement real signature validation
- [ ] Test order.confirmed event
- [ ] Configure menu sync (optional)
- [ ] Set up automated order acceptance (optional)

### UberEats Integration
- [ ] Request UberEats API sandbox access
- [ ] Register webhook in UberEats sandbox
- [ ] Test order.placed flow
- [ ] Implement real signature validation
- [ ] Test driver assignment flow
- [ ] Configure restaurant availability

### Kitchen Printer
- [ ] If using TCP printer:
  1. Connect printer to network
  2. Get printer IP address
  3. Configure in Settings → Printer
  4. Test print ESC-POS commands
  5. Enable auto-print on order

---

## 📅 Week 2-3

### Real Orders Go Live
- [ ] Enable production mode in iFood
- [ ] Enable production mode in UberEats
- [ ] Activate driver notifications
- [ ] Send preview customers first test orders
- [ ] Monitor webhook failures
- [ ] Track order success rate

### Customer Communication
- [ ] Update website with production URL
- [ ] Configure WhatsApp notifications
- [ ] Set up customer support process
- [ ] Create FAQ for common issues

### Performance Optimization
- [ ] Monitor API response times
- [ ] Check database query performance
- [ ] Review error logs for patterns
- [ ] Optimize slow queries
- [ ] Scale if needed (upgrade Railway plan)

---

## 🔄 Ongoing Maintenance

### Daily
- Check production logs for errors
- Monitor failed webhooks
- Verify orders are being created
- Check system uptime

### Weekly
- Review performance metrics
- Check database growth
- Test webhooks with manual requests
- Review error patterns

### Monthly
- Database maintenance/cleanup
- Security audit
- Backup verification
- Performance optimization
- Cost review

---

## 🆘 Common Issues & Solutions

### Webhooks not received
```
1. Verify webhook URL in integration admin
2. Check if app is running: curl /api/health
3. Review logs for 400/401 errors
4. Verify signature headers
5. Re-register webhook
```

### Orders not creating
```
1. Check webhook logs
2. Verify tenant exists
3. Check order payload format
4. Review database migration status
5. Check for duplicate order IDs
```

### Driver notifications not sent
```
1. Verify WebSocket connection: ws://your-app/ws/driver
2. Check FCM configuration
3. Review notification logs
4. Test with direct WebSocket connection
```

### Kitchen printer not printing
```
1. Verify printer IP/port correct
2. Test TCP connection: telnet printer-ip 9100
3. Check ESC-POS command format
4. Review printer logs in Railway
5. Test with curl -X POST with raw bytes
```

---

## 📊 Success Metrics

Track these to measure success:

```
Performance:
- API response time < 200ms
- Order creation < 1s
- Webhook processing < 500ms

Reliability:
- Webhook success rate > 99%
- Order creation success > 99%
- System uptime > 99.9%

Volume:
- Orders per minute
- Concurrent drivers
- WebSocket connections
- Database connections
```

---

**Status:** ✅ Production roadmap complete
