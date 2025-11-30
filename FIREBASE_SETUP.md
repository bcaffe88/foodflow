# 🔥 Firebase Setup para Push Notifications (FCM)

> **Completamente GRATUITO** - Sem cartão de crédito necessário

## ⚡ Quick Start

### 1️⃣ Criar Projeto Firebase
```
https://console.firebase.google.com/
→ "Create a project"
→ Nome: "Wilson-Pizzaria"
→ Enable Analytics (opcional)
```

### 2️⃣ Obter Service Account Credentials
```
⚙️ Project Settings
→ Service Accounts
→ "Generate New Private Key"
→ Download JSON
```

**Extrair do JSON:**
```json
{
  "project_id": "wilson-pizzaria-xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@wilson-pizzaria-xxxxx.iam.gserviceaccount.com"
}
```

### 3️⃣ Obter Web Configuration
```
Project Settings → General
→ Scroll até "Your apps"
→ Web (</> icon)
→ Copy Configuration
```

**Extrair valores:**
```json
{
  "apiKey": "AIzaSy...",
  "projectId": "wilson-pizzaria-xxxxx",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:xxxxx"
}
```

### 4️⃣ Obter VAPID Key
```
Cloud Messaging → Web configuration
→ Web Push certificates
→ Copy public key
```

## 🔐 Environment Variables (Replit Secrets)

### Backend (Server)
```
FIREBASE_PROJECT_ID=wilson-pizzaria-xxxxx
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@wilson-pizzaria-xxxxx.iam.gserviceaccount.com
```

### Frontend (Browser)
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_PROJECT_ID=wilson-pizzaria-xxxxx
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx
VITE_FIREBASE_VAPID_KEY=public_vapid_key_...
```

## 📝 Adicionar ao .env (se não usar Replit secrets)

```bash
# Server
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_email

# Frontend
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

## ✅ Test Push Notifications

1. **Usuário acessa app**
   - Vê prompt de notificações
   - Aceita permissão

2. **Registra device token**
   ```
   POST /api/drivers/register-device
   { userId, token, platform: "web" }
   ```

3. **Enviar notificação de novo pedido**
   ```
   POST /api/orders/notify-driver
   { deviceToken, orderId, customerName, deliveryAddress }
   ```

4. **Recebe push notification**
   - Se app aberto: mostra em foreground
   - Se app fechado: background notification

## 🆓 Pricing

| Feature | Cost | Notes |
|---------|------|-------|
| **Notifications** | Free | Unlimited on free tier |
| **Devices** | Free | Unlimited registrations |
| **Analytics** | Free | Basic tracking included |
| **A/B Testing** | Free | Available on free tier |

**Total Cost: $0** ✅

## 🔄 Graceful Degradation

Se Firebase credentials **não forem configuradas**:
- ✅ Sistema continua funcionando
- ❌ Push notifications desativadas apenas
- ✅ Resto da aplicação sem impacto

## 📚 API Endpoints

### Register Device for Push
```
POST /api/drivers/register-device
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "userId": "driver-123",
  "token": "fcm_device_token_here",
  "platform": "web"
}

Response:
{
  "success": true,
  "message": "Device registered for push notifications",
  "userId": "driver-123",
  "platform": "web"
}
```

### Send Push to Driver (New Order)
```
POST /api/orders/notify-driver
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "driverId": "driver-123",
  "deviceToken": "fcm_device_token_here",
  "orderId": "order-456",
  "customerName": "João Silva",
  "deliveryAddress": "Rua Principal, 123"
}

Response:
{
  "success": true,
  "message": "Notification sent to driver"
}
```

### Broadcast to All Drivers
```
POST /api/notifications/broadcast-drivers
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "deviceTokens": [
    "token1",
    "token2",
    "token3"
  ],
  "title": "📣 Sistema em manutenção",
  "body": "Volta online em 30 min",
  "data": {
    "type": "system_alert"
  }
}

Response:
{
  "success": true,
  "sent": 3,
  "failed": 0,
  "total": 3
}
```

## 🚀 Deployment (Railway)

1. Adicionar secrets no Railway:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`

2. Adicionar frontend env vars:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_VAPID_KEY`

3. Deploy normalmente - sistema ativa push quando credentials existem

## 📖 Documentação Oficial
- [Firebase Console](https://console.firebase.google.com/)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web SDK Guide](https://firebase.google.com/docs/cloud-messaging/js/client)

---

**Status**: ✅ Ready for configuration
**Cost**: FREE ($0/mês)
**Setup Time**: ~10 minutos
