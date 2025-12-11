# 🔗 Guia de Integração em Routes.ts

> Mostra exatamente onde integrar os 5 serviços open-source em `server/routes.ts`

---

## 📌 Importações Necessárias

Adicione no topo de `server/routes.ts`:

```typescript
// Serviços Open Source
import paymentService from './payment/mock-payment';
import emailService from './email/email-service';
import whatsappService from './whatsapp/mock-whatsapp';
import mapsService from './maps/openstreetmap-service';
import storageService from './storage/local-storage';
```

---

## 💳 1. PAGAMENTOS

### Endpoint: POST `/api/payments/intent`

```typescript
app.post('/api/payments/intent', async (req, res) => {
  try {
    const { amount, currency, description, orderId } = req.body;

    // Usar Mock Payment Service
    const intent = await paymentService.createPaymentIntent({
      amount,
      currency,
      description,
    });

    // Armazenar intent em storage
    await storageService.set(`payment_intent:${orderId}`, {
      intentId: intent.id,
      clientSecret: intent.clientSecret,
      amount,
      orderId,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      clientSecret: intent.clientSecret,
      intentId: intent.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});
```

### Endpoint: POST `/api/payments/confirm`

```typescript
app.post('/api/payments/confirm', async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId, orderId } = req.body;

    // Confirmar pagamento usando Mock Service
    const result = await paymentService.confirmPayment({
      paymentIntentId,
      paymentMethodId,
    });

    if (result.success) {
      // Armazenar resultado
      await storageService.update(`payment_intent:${orderId}`, {
        status: 'confirmed',
        confirmedAt: new Date(),
      });

      res.json({
        success: true,
        status: result.status,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment failed',
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
});
```

### Endpoint: POST `/api/payments/refund`

```typescript
app.post('/api/payments/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;

    // Processar reembolso
    const refund = await paymentService.refundPayment({
      paymentIntentId,
      amount,
    });

    res.json({
      success: refund.success,
      refundId: refund.refundId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Refund failed' });
  }
});
```

---

## 📧 2. EMAILS

### Endpoint: POST `/api/orders` (com confirmação por email)

```typescript
app.post('/api/orders', async (req, res) => {
  try {
    const { customerId, restaurantId, items, total, address } = req.body;

    // Recuperar cliente e restaurante do banco
    const customer = await db.query.customer.findOne(customerId);
    const restaurant = await db.query.restaurant.findOne(restaurantId);

    // Armazenar pedido
    const order = {
      id: `ORD-${Date.now()}`,
      customerId,
      restaurantId,
      items,
      total,
      address,
      createdAt: new Date(),
    };

    await storageService.set(`order:${order.id}`, order);

    // ✅ ENVIAR EMAIL DE CONFIRMAÇÃO
    await emailService.sendOrderConfirmation({
      customerEmail: customer.email,
      customerName: customer.name,
      orderId: order.id,
      restaurantName: restaurant.name,
      total: order.total,
      items: order.items,
      deliveryAddress: address,
    });

    // ✅ NOTIFICAR RESTAURANTE POR EMAIL
    await emailService.sendRestaurantNotification({
      restaurantEmail: restaurant.email,
      restaurantName: restaurant.name,
      orderId: order.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: order.items,
      deliveryAddress: address,
    });

    res.json({
      success: true,
      orderId: order.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});
```

### Endpoint: POST `/api/emails/send` (genérico)

```typescript
app.post('/api/emails/send', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      text,
    });

    res.json({
      success: result.success,
      messageId: result.messageId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});
```

---

## 📱 3. WHATSAPP

### Endpoint: POST `/api/orders` (com notificação WhatsApp)

```typescript
app.post('/api/orders', async (req, res) => {
  try {
    // ... código anterior ...

    // ✅ ENVIAR WHATSAPP DE CONFIRMAÇÃO
    await whatsappService.sendOrderConfirmation({
      phoneNumber: customer.phone,
      customerName: customer.name,
      orderId: order.id,
      restaurantName: restaurant.name,
      total: order.total,
      estimatedTime: 45, // minutos
    });

    // ✅ ALERTAR RESTAURANTE POR WHATSAPP
    await whatsappService.sendRestaurantAlert({
      phoneNumber: restaurant.whatsappPhone,
      restaurantName: restaurant.name,
      orderId: order.id,
      itemCount: order.items.length,
      total: order.total,
    });

    res.json({ success: true, orderId: order.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});
```

### Endpoint: PUT `/api/orders/:id/status` (saída para entrega)

```typescript
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, driverName, driverPhone, vehicleInfo } = req.body;

    // Recuperar pedido
    const order = await storageService.get(`order:${orderId}`);
    const customer = await db.query.customer.findOne(order.customerId);

    // Atualizar status
    await storageService.update(`order:${orderId}`, { status });

    // ✅ NOTIFICAR CLIENTE QUE SAIU PARA ENTREGA
    if (status === 'out_for_delivery') {
      await whatsappService.sendOutForDeliveryNotification({
        phoneNumber: customer.phone,
        customerName: customer.name,
        orderId,
        driverName,
        driverPhone,
        vehicleInfo,
      });
    }

    // ✅ NOTIFICAR CLIENTE QUE FOI ENTREGUE
    if (status === 'delivered') {
      await whatsappService.sendDeliveryCompleteNotification({
        phoneNumber: customer.phone,
        customerName: customer.name,
        orderId,
      });

      // ✅ ENVIAR EMAIL DE OBRIGADO
      await emailService.sendEmail({
        to: customer.email,
        subject: 'Pedido Entregue - Obrigado!',
        html: '<h1>Seu pedido foi entregue com sucesso!</h1><p>Obrigado por usar nosso serviço!</p>',
      });
    }

    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});
```

### Endpoint: POST `/api/whatsapp/send` (genérico)

```typescript
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { to, message, mediaUrl, mediaType } = req.body;

    const result = await whatsappService.sendMessage({
      to,
      message,
      mediaUrl,
      mediaType,
    });

    res.json({
      success: result.success,
      messageId: result.messageId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});
```

---

## 🗺️ 4. MAPAS

### Endpoint: GET `/api/restaurants/nearby`

```typescript
app.get('/api/restaurants/nearby', async (req, res) => {
  try {
    const { address, latitude, longitude } = req.query;

    let customerLocation;

    // Opção 1: Geocodificar endereço
    if (address) {
      const geo = await mapsService.geocodeAddress(address);
      customerLocation = { latitude: geo.latitude, longitude: geo.longitude };
    }
    // Opção 2: Usar coordenadas diretas
    else if (latitude && longitude) {
      customerLocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
    }

    if (!customerLocation) {
      return res.status(400).json({ error: 'Location required' });
    }

    // ✅ BUSCAR RESTAURANTES PRÓXIMOS
    const restaurants = await db.query.restaurant.findAll();
    const nearby = await mapsService.findNearestRestaurants(customerLocation, restaurants);

    res.json({
      success: true,
      restaurants: nearby,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to find nearby restaurants' });
  }
});
```

### Endpoint: POST `/api/orders` (calcular taxa de entrega)

```typescript
app.post('/api/orders', async (req, res) => {
  try {
    const { restaurantId, deliveryAddress } = req.body;

    // Recuperar restaurante
    const restaurant = await db.query.restaurant.findOne(restaurantId);

    // ✅ CALCULAR TAXA DE ENTREGA
    const fee = await mapsService.calculateDeliveryFee(
      restaurant.location || await mapsService.geocodeAddress(restaurant.address),
      deliveryAddress
    );

    // Usar taxa no pedido
    const order = {
      // ... dados do pedido ...
      deliveryFee: fee.fee,
      deliveryDistance: fee.distance,
      total: req.body.total + fee.fee,
    };

    res.json({
      success: true,
      orderId: order.id,
      deliveryFee: fee.fee,
      total: order.total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate delivery fee' });
  }
});
```

### Endpoint: GET `/api/delivery/:orderId/eta`

```typescript
app.get('/api/delivery/:orderId/eta', async (req, res) => {
  try {
    const { orderId } = req.params;

    // Recuperar pedido
    const order = await storageService.get(`order:${orderId}`);
    const restaurant = await db.query.restaurant.findOne(order.restaurantId);

    // ✅ CALCULAR TEMPO DE ENTREGA
    const eta = mapsService.calculateDeliveryTime(order.deliveryDistance || 5);

    res.json({
      success: true,
      orderId,
      etaMinutes: eta,
      etaTime: new Date(Date.now() + eta * 60000).toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate ETA' });
  }
});
```

---

## 💾 5. STORAGE

### Usando Storage em Qualquer Endpoint

```typescript
// ✅ ARMAZENAR DADOS TEMPORÁRIOS
app.post('/api/users/:id/preferences', async (req, res) => {
  try {
    const { id } = req.params;
    const { theme, language, notifications } = req.body;

    // Armazenar com TTL de 1 semana
    await storageService.set(`preferences:${id}`, {
      theme,
      language,
      notifications,
    }, {
      ttl: 7 * 24 * 60 * 60, // 7 dias
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// ✅ RECUPERAR DADOS
app.get('/api/users/:id/preferences', async (req, res) => {
  try {
    const { id } = req.params;
    const prefs = await storageService.get(`preferences:${id}`);
    res.json({ success: true, preferences: prefs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// ✅ USAR COMO FILA DE NOTIFICAÇÕES
app.post('/api/notifications/queue', async (req, res) => {
  try {
    const { type, data } = req.body;

    // Enfileirar notificação
    const queueSize = await storageService.pushToQueue('notifications', {
      type,
      data,
      timestamp: new Date(),
    });

    res.json({ success: true, queueSize });
  } catch (error) {
    res.status(500).json({ error: 'Failed to queue notification' });
  }
});

// ✅ PROCESSAR FILA DE NOTIFICAÇÕES (em background worker)
async function processNotificationQueue() {
  while (true) {
    const notification = await storageService.popFromQueue('notifications');
    if (!notification) {
      await sleep(1000);
      continue;
    }

    // Processar notificação
    console.log('Processing:', notification);
  }
}
```

---

## 🎯 Exemplo Completo: POST /api/orders

```typescript
app.post('/api/orders', async (req, res) => {
  try {
    const { customerId, restaurantId, items, deliveryAddress } = req.body;

    // Recuperar dados
    const customer = await db.query.customer.findOne(customerId);
    const restaurant = await db.query.restaurant.findOne(restaurantId);

    // Criar pedido
    const orderId = `ORD-${Date.now()}`;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // ✅ CALCULAR TAXA DE ENTREGA (Maps)
    const fee = await mapsService.calculateDeliveryFee(
      restaurant.location,
      deliveryAddress
    );
    const total = subtotal + fee.fee;

    // ✅ CRIAR INTENÇÃO DE PAGAMENTO (Payment)
    const payment = await paymentService.createPaymentIntent({
      amount: total,
      currency: 'brl',
      description: `Order ${orderId}`,
    });

    // ✅ ARMAZENAR PEDIDO (Storage)
    const order = {
      id: orderId,
      customerId,
      restaurantId,
      items,
      subtotal,
      deliveryFee: fee.fee,
      deliveryDistance: fee.distance,
      total,
      deliveryAddress,
      paymentIntentId: payment.id,
      status: 'pending',
      createdAt: new Date(),
    };
    await storageService.set(`order:${orderId}`, order);

    // ✅ ENVIAR EMAIL (Email)
    await emailService.sendOrderConfirmation({
      customerEmail: customer.email,
      customerName: customer.name,
      orderId,
      restaurantName: restaurant.name,
      total,
      items,
      deliveryAddress,
    });

    // ✅ NOTIFICAR RESTAURANTE (WhatsApp + Email)
    await whatsappService.sendRestaurantAlert({
      phoneNumber: restaurant.whatsappPhone,
      restaurantName: restaurant.name,
      orderId,
      itemCount: items.length,
      total,
    });

    await emailService.sendRestaurantNotification({
      restaurantEmail: restaurant.email,
      restaurantName: restaurant.name,
      orderId,
      customerName: customer.name,
      customerPhone: customer.phone,
      items,
      deliveryAddress,
    });

    // ✅ NOTIFICAR CLIENTE (WhatsApp)
    await whatsappService.sendOrderConfirmation({
      phoneNumber: customer.phone,
      customerName: customer.name,
      orderId,
      restaurantName: restaurant.name,
      total,
      estimatedTime: mapsService.calculateDeliveryTime(fee.distance),
    });

    // Resposta ao cliente
    res.json({
      success: true,
      orderId,
      paymentSecret: payment.clientSecret,
      total,
      deliveryFee: fee.fee,
      estimatedTime: mapsService.calculateDeliveryTime(fee.distance),
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});
```

---

## ✅ Checklist de Integração

- [ ] Importar todos os 5 serviços no topo de `routes.ts`
- [ ] Integrar payments (3 endpoints)
- [ ] Integrar emails (2 endpoints)
- [ ] Integrar WhatsApp (3 endpoints)
- [ ] Integrar maps (3 endpoints)
- [ ] Integrar storage (em todos os endpoints relevantes)
- [ ] Testar fluxo completo
- [ ] Validar que tudo funciona
- [ ] Deploy em staging
- [ ] Deploy em produção

---

## 📝 Resumo

### Antes da Integração
```
routes.ts: 1,500 linhas (sem serviços open source)
```

### Depois da Integração
```
routes.ts: 1,500 + ~500 linhas (com todos os 5 serviços)
```

### Serviços Disponíveis
```typescript
✅ paymentService   → Pagamentos
✅ emailService     → Emails
✅ whatsappService  → WhatsApp
✅ mapsService      → Mapas
✅ storageService   → Armazenamento
```

---

**Próximo Passo:** Integrar esses endpoints em `server/routes.ts` e testar! 🚀
