# Production Monitoring Guide

## 🔍 Railway Monitoring

### Logs
```
Railway Dashboard → Logs
- Real-time application logs
- Error stack traces
- Database query logs
- WebSocket connection logs
```

### Metrics
```
Railway Dashboard → Metrics
- CPU usage
- Memory usage
- Network I/O
- Request count & latency
```

### Database
```
Railway Dashboard → PostgreSQL Service → Metrics
- Active connections
- Query performance
- Cache hit ratio
- Slow queries
```

## 🚨 Alert Setup

### Email Alerts (Configure in Railway)
- App crash/restart
- High CPU (>80%)
- High memory (>90%)
- Database connection pool exhausted
- API error rate > 1%

## 📊 Key Metrics to Monitor

```
Performance:
- API response time (target: <200ms)
- Database query time (target: <100ms)
- WebSocket connection count
- Active orders per minute

Reliability:
- Error rate (target: <0.1%)
- Uptime (target: >99.9%)
- Failed webhook deliveries
- Database connection pool usage

Scale:
- Concurrent users
- Orders per minute
- Active driver connections
- Storage growth rate
```

## 🔧 Common Issues & Solutions

### App keeps restarting
```bash
# Check logs in Railway dashboard
# Verify DATABASE_URL is set
# Check for memory leaks
# Review recent code changes
```

### WebSocket connections failing
```bash
# Check WebSocket endpoint URL
# Verify CORS headers
# Check connection timeout settings
# Monitor for too many open connections
```

### Slow database queries
```bash
# Run: SELECT * FROM pg_stat_statements ORDER BY mean_time DESC
# Add indexes on frequently queried columns
# Review N+1 query patterns
# Check connection pool saturation
```

### Memory usage growing
```bash
# Check for memory leaks in services
# Monitor cache size
# Review WebSocket connection lifecycle
# Check for unbounded arrays/objects
```

## 📈 Capacity Planning

```
Current capacity (1 Railway standard plan):
- 512MB RAM
- 1 shared CPU
- ~100 concurrent users
- ~50 orders/minute
- ~1000 WebSocket connections

Scale up when:
- Memory usage > 400MB
- CPU usage > 70% sustained
- API response time > 500ms
- Database connections > 80
```

---

**Last Updated:** Production deployment Phase 2
