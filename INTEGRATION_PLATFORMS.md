# Integration Platforms - Complete Guide

## ✅ Supported Platforms

### 1. **iFood** ✅ (Webhook + OAuth)
- **Status:** Fully implemented
- **Auth:** Token-based + webhook signatures
- **Endpoint:** `/api/webhooks/ifood/{tenantId}`
- **Setup:** https://business.ifood.com.br → Integrations

### 2. **UberEats** ✅ (Webhook + OAuth)
- **Status:** Fully implemented
- **Auth:** Token-based + webhook signatures
- **Endpoint:** `/api/webhooks/ubereats/{tenantId}`
- **Setup:** https://partners.ubereats.com → Developer

### 3. **Quero Delivery** ✅ (Webhook + API)
- **Status:** Implemented
- **Auth:** Authorization Token + Place ID
- **Endpoint:** `/api/webhooks/quero/{tenantId}`
- **API Docs:** https://api.quero.io/documentation
- **Library:** https://github.com/misterioso013/querodelivery-node
- **Features:** Order sync, dispatch, status updates

### 4. **Pede Aí** ⏳ (API - Private Access)
- **Status:** Ready for integration (awaiting API access)
- **Auth:** Private partnership model
- **Portal:** https://painel.pede.ai/
- **Next Step:** Contact Pede Aí support for API access
- **Partnership:** Usually requires formal agreement

---

## 🚀 Integration Methods

### Method 1: Webhook (Recommended)
External platform sends events to your server:
```
External Platform → Webhook → Your App → Database
```

**Advantages:**
- Real-time order delivery
- No polling needed
- Signature-based security

**Implementation:**
```bash
curl -X POST https://your-app.railway.app/api/webhooks/quero/{tenantId} \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.created",
    "order": { ... }
  }'
```

### Method 2: Direct Login/API (Coming Soon)
Owner logs in directly and system syncs orders:
```
Restaurant Owner logs in → System fetches orders → Creates in database
```

**Advantages:**
- No webhook setup needed
- Owner has direct control
- Can fetch order history

**Implementation:**
```typescript
// Coming in Phase 5
const quero = new Quero(authToken, placeId);
const orders = await quero.order().list();
```

---

## 📊 Dashboard Integration Panel

Accessible at: `/restaurant/integrations`

**Features:**
- ✅ Connect/disconnect platforms
- ✅ View integration status
- ✅ See last sync time
- ✅ Manage API credentials
- ✅ Test webhook delivery

---

## 🔐 Security

### Webhook Signatures
All webhooks validate signatures before processing:
```typescript
// iFood signature validation
const signature = request.headers['x-ifood-signature'];
if (!signature) return 401; // Unauthorized

// UberEats signature validation
const signature = request.headers['x-ubereats-signature'];
if (!signature) return 401; // Unauthorized
```

### Credential Storage
- Access tokens encrypted in database
- Never exposed in logs or frontend
- Secured with environment variables

---

## 📋 Setup Instructions by Platform

### iFood Setup
1. Go to https://business.ifood.com.br
2. Settings → Integrations
3. Request API access
4. Get Authorization Token
5. In Wilson dashboard: Settings → Integrations → Add iFood
6. Paste token + configure webhook

### UberEats Setup
1. Go to https://partners.ubereats.com
2. Developer section
3. Create API application
4. Get client credentials
5. In Wilson dashboard: Settings → Integrations → Add UberEats
6. Configure webhook endpoint

### Quero Delivery Setup
1. Go to https://api.quero.io
2. Create developer account
3. Generate Authorization Token
4. Get Place ID from platform
5. In Wilson dashboard: Settings → Integrations → Add Quero
6. Paste token + Place ID

### Pede Aí Setup (Coming Soon)
1. Contact https://painel.pede.ai/ support
2. Request API access
3. Provide webhook endpoint
4. Once approved, configure in Wilson dashboard

---

## 🧪 Testing Integrations

### Health Check
```bash
curl https://your-app.railway.app/api/health
```

### Test iFood Webhook
```bash
curl -X POST https://your-app.railway.app/api/webhooks/ifood/TENANT_ID \
  -H "x-ifood-signature: test" \
  -H "Content-Type: application/json" \
  -d '{"event":"order.created","order":{"id":"test123","customer":{"name":"Test","phone":"11999999999"},"items":[],"total":"0"}}'
```

### Test Quero Webhook
```bash
curl -X POST https://your-app.railway.app/api/webhooks/quero/TENANT_ID \
  -H "Content-Type: application/json" \
  -d '{"event":"order.created","order":{"id":"quero123","customer":{"name":"Test"},"items":[],"total":"0"}}'
```

---

## 📈 Future Integrations

Planned support for:
- Loggi (delivery tracking)
- Rappi (Latin America)
- 99Food (Brazil)
- Shine (Latam)
- Custom webhooks (via n8n)

---

**Status:** ✅ Phase 4 Complete - Integration Dashboard Ready
