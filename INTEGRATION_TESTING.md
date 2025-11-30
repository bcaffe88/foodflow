# Integration Testing Guide

## iFood Webhook Testing

### 1. Test Endpoint
```bash
curl -X POST http://localhost:5000/api/webhooks/ifood/9ff08749-cfe8-47e5-8964-3284a9e8a901 \
  -H "Content-Type: application/json" \
  -H "x-ifood-signature: test-signature" \
  -d '{
    "event": "order.created",
    "order": {
      "id": "ifood-123",
      "customer": {
        "name": "João Silva",
        "phone": "11999999999"
      },
      "items": [
        {
          "id": "pizza-1",
          "name": "Pizza Margherita",
          "quantity": 2,
          "price": "45.00"
        }
      ],
      "total": "90.00",
      "deliveryAddress": "Rua X, 123"
    }
  }'
```

### 2. Expected Response
```json
{
  "success": true,
  "orderId": "generated-order-uuid"
}
```

### 3. Verify Order Created
```bash
curl http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## UberEats Webhook Testing

### 1. Test Endpoint
```bash
curl -X POST http://localhost:5000/api/webhooks/ubereats/9ff08749-cfe8-47e5-8964-3284a9e8a901 \
  -H "Content-Type: application/json" \
  -H "x-ubereats-signature: test-signature" \
  -d '{
    "event": "order.placed",
    "order": {
      "id": "ubereats-456",
      "customer": {
        "id": "customer-789",
        "name": "Maria Santos",
        "phone": "11988888888"
      },
      "items": [
        {
          "id": "burger-1",
          "name": "Burger Premium",
          "quantity": 1,
          "price": "32.00"
        },
        {
          "id": "drink-1",
          "name": "Refrigerante",
          "quantity": 2,
          "price": "8.00"
        }
      ],
      "total": "48.00",
      "deliveryAddress": "Avenida Y, 456"
    }
  }'
```

### 2. Expected Response
```json
{
  "success": true,
  "orderId": "generated-order-uuid"
}
```

---

## Production Integration Flow

### Step 1: Register Webhooks in iFood Admin
```
1. Log in to iFood Partner App
2. Go to Settings → Webhooks
3. Add webhook URL: https://your-app.railway.app/api/webhooks/ifood/{tenantId}
4. Subscribe to events:
   - order.created
   - order.confirmed
   - order.cancelled
5. Save and test webhook
```

### Step 2: Register Webhooks in UberEats Admin
```
1. Log in to UberEats Partner Portal
2. Go to Integration → Webhooks
3. Add webhook URL: https://your-app.railway.app/api/webhooks/ubereats/{tenantId}
4. Subscribe to events:
   - order.placed
   - order.accepted
   - order.cancelled
5. Save and test webhook
```

### Step 3: Monitor Webhook Deliveries
```
Railway Dashboard → Logs
Filter by: "Webhook" OR "handleIFoodWebhook" OR "handleUberEatsWebhook"
```

### Step 4: Handle Webhook Failures
```
If webhook fails (401, 500, timeout):
1. Check signature header validity
2. Verify tenant exists in database
3. Review error logs in Railway
4. Re-register webhook in integration admin
5. Test with manual curl request
```

---

## Testing Checklist

- [ ] iFood webhook creates orders
- [ ] UberEats webhook creates orders
- [ ] Order status updated correctly
- [ ] WhatsApp notifications sent
- [ ] Webhook signatures validated
- [ ] Error handling works (invalid signatures return 401)
- [ ] Order items mapped correctly
- [ ] Customer info extracted properly
- [ ] Multi-tenant isolation working
- [ ] Database transaction committed

---

**Status:** ✅ Integration testing ready
