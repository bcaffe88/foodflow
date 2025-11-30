# 🎯 TURN-BY-TURN IMPLEMENTATION CHECKLIST

## TURN 1: ✅ ARCHITECTURE COMPLETE
- [x] Map alternatives research (Leaflet + OpenStreetMap)
- [x] ETA alternatives research (OSRM)
- [x] Push notifications research (FCM Free Tier)
- [x] Code architecture documented
- [x] Implementation strategy defined
- **Status:** Ready for TURN 2

---

## TURN 2: REAL-TIME MAPS (Leaflet + OpenStreetMap)
**Estimate:** 20-30 min | **Files:** 3 new/modified

### Tasks
- [ ] Install leaflet package
- [ ] Create `client/src/pages/driver-map-leaflet.tsx`
- [ ] Add CSS for Leaflet styling
- [ ] Update `client/src/App.tsx` routes
- [ ] Test with existing GPS data endpoint
- [ ] Verify 10-second refresh updates markers

### Files to Create/Modify
```
client/src/pages/driver-map-leaflet.tsx (NEW - 80 lines)
client/src/pages/driver-map-leaflet.css (NEW - 20 lines)
client/src/App.tsx (MODIFY - add route)
package.json (MODIFY - add @types/leaflet)
```

### Endpoint Used
```
GET /api/driver/active-locations/:tenantId (EXISTING)
```

---

## TURN 3: ETA CALCULATION (OSRM)
**Estimate:** 30-40 min | **Files:** 5 new/modified

### Tasks
- [ ] Create `server/services/osrm-service.ts` (calculateETA, calculateDeliveryMatrix)
- [ ] Add 2 API routes to `server/routes.ts`
- [ ] Create `Dockerfile.osrm` for OSRM server
- [ ] Update `docker-compose.yml` with OSRM service
- [ ] Add `OSRM_URL` to `.env`
- [ ] Add `estimatedDeliveryTime` to Order schema
- [ ] Test ETA calculation with sample coordinates

### Files to Create/Modify
```
server/services/osrm-service.ts (NEW - 60 lines)
server/routes.ts (MODIFY - add 2 endpoints, 50 lines)
Dockerfile.osrm (NEW - 15 lines)
docker-compose.yml (MODIFY - add OSRM service)
.env (MODIFY - add OSRM_URL)
shared/schema.ts (MODIFY - add estimatedDeliveryTime)
```

### New Endpoints
```
POST /api/orders/:id/calculate-eta
POST /api/orders/batch-eta
```

---

## TURN 4: PUSH NOTIFICATIONS (FCM)
**Estimate:** 40-50 min | **Files:** 6 new/modified

### Tasks
- [ ] Create `server/services/fcm-service.ts`
- [ ] Add 3 API routes to `server/routes.ts`
- [ ] Create `client/src/services/fcm-service.ts`
- [ ] Add Firebase environment variables
- [ ] Create Service Worker for web push (`public/firebase-messaging-sw.js`)
- [ ] Add `deviceToken` field to driver profile schema
- [ ] Update driver dashboard to register for notifications
- [ ] Test notification sending via API

### Files to Create/Modify
```
server/services/fcm-service.ts (NEW - 70 lines)
server/routes.ts (MODIFY - add 3 endpoints, 60 lines)
client/src/services/fcm-service.ts (NEW - 50 lines)
public/firebase-messaging-sw.js (NEW - 30 lines)
.env (MODIFY - add 4 FIREBASE_* vars)
shared/schema.ts (MODIFY - add deviceToken)
package.json (MODIFY - add firebase-admin, firebase)
client/src/pages/driver-dashboard.tsx (MODIFY - register notifications)
```

### New Endpoints
```
POST /api/drivers/register-device
POST /api/orders/notify-driver
POST /api/notifications/broadcast-drivers
```

---

## DEPLOYMENT TIMELINE

| Turn | Feature | Files | Time | Total |
|------|---------|-------|------|-------|
| 1 | Architecture ✅ | Doc | 15m | 15m ✅ |
| 2 | Maps | 3 | 30m | 45m |
| 3 | ETA | 5 | 40m | 85m |
| 4 | Push | 6 | 50m | 135m |

**Total:** ~2.25 hours for all 3 features (vs weeks if paid)

---

## TESTING SEQUENCE

### TURN 2 Testing
```bash
# 1. Visit http://localhost:5000/restaurant/driver-map-leaflet
# 2. Verify map loads with OpenStreetMap tiles
# 3. Check that driver markers appear from GPS data
# 4. Confirm markers update every 10 seconds
```

### TURN 3 Testing
```bash
# 1. Start OSRM container: docker-compose up osrm
# 2. Call POST /api/orders/123/calculate-eta with coordinates
# 3. Verify ETA returns <100ms
# 4. Test batch endpoint with multiple addresses
```

### TURN 4 Testing
```bash
# 1. Visit driver dashboard
# 2. Click "Enable Notifications"
# 3. Grant permission
# 4. Call POST /api/orders/notify-driver from backend
# 5. Verify push notification appears on device
```

---

## INTEGRATION POINTS

### Turn 2 → Existing Systems
- Uses existing `/api/driver/active-locations/:tenantId` endpoint
- Updates to existing driver-dashboard.tsx navigation

### Turn 3 → Order Management
- Integrates with order creation workflow
- Updates order.estimatedDeliveryTime field
- Called during auto-assignment algorithm

### Turn 4 → WebSocket Driver Events
- Complements existing WebSocket /ws/driver
- Sends push when order assigned
- Allows offline driver notifications

---

## SUCCESS CRITERIA

### TURN 2 ✅
- [ ] Map displays without errors
- [ ] All drivers visible on map
- [ ] Markers update in real-time
- [ ] Zooming/panning works smoothly
- [ ] Mobile responsive

### TURN 3 ✅
- [ ] OSRM container starts
- [ ] ETA endpoint returns valid duration
- [ ] Accuracy ±2-5 minutes
- [ ] Batch endpoint handles multiple stops
- [ ] Fallback if OSRM unavailable

### TURN 4 ✅
- [ ] Device token registered on driver login
- [ ] Push notification received on new order
- [ ] Broadcast notifications reach all drivers
- [ ] Works on Android, iOS, Web
- [ ] Graceful degradation if FCM unavailable

---

## Next Steps

**Ready to proceed with TURN 2?**

Just ask: "Continue TURN 2" or "Start Leaflet implementation"
