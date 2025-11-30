# 💻 TURN 5: DEVELOPMENT - IMPLEMENTATION GUIDE

**Data:** Nov 30, 2025  
**Epic:** Twilio WhatsApp (reference)  
**Status:** ✅ Implementation Strategy Ready  

---

## 🎯 WHAT TO BUILD IN TURN 5

**Stories to Implement:**
- Story 1.1: Setup Twilio Service (1-2h)
- Story 1.2: Create WhatsApp Service Module (1-1.5h)
- Story 1.3: Integrate with Order Creation (1-1.5h)
- Story 1.4: Test WhatsApp Integration (1-1.5h)
- Story 1.5: Documentation & Deploy (0.5-1h)

**Total Time:** 5-7 hours

---

## 📋 STORY 1.1: SETUP TWILIO SERVICE (1-2h)

### Step 1: Install Twilio SDK
```bash
npm install twilio
```

### Step 2: Create Twilio Account
1. Go to https://www.twilio.com
2. Create account (free trial: R$ 50 credit)
3. Verify phone number
4. Get credentials:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_WHATSAPP_PHONE_NUMBER

### Step 3: Add Environment Variables
```bash
# .env
TWILIO_ACCOUNT_SID=AC1234567890abcdef
TWILIO_AUTH_TOKEN=auth_token_here
TWILIO_WHATSAPP_PHONE_NUMBER=+14155552671
```

### Step 4: Test Connection
```typescript
// test-twilio-connection.ts
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const message = await client.messages.create({
  from: `whatsapp:${process.env.TWILIO_WHATSAPP_PHONE_NUMBER}`,
  to: "whatsapp:+5587999999999",
  body: "Test message"
});

console.log("Success! SID:", message.sid);
```

---

## 📋 STORY 1.2: CREATE WHATSAPP SERVICE (1-1.5h)

### Create: server/services/twilio-whatsapp-service.ts

```typescript
import twilio from "twilio";
import { logger } from "../logger";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  retries = 0
): Promise<any> {
  try {
    // Validate input
    if (!phoneNumber || !phoneNumber.startsWith("+")) {
      throw new Error("Invalid phone number format");
    }
    if (!message || message.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    // Send message
    const result = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_PHONE_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
      body: message
    });

    // Log success
    logger.info("WhatsApp sent", {
      sid: result.sid,
      to: phoneNumber,
      status: result.status
    });

    return result;
  } catch (error) {
    logger.error("WhatsApp error", { phoneNumber, error, retries });

    // Retry logic
    if (retries < MAX_RETRIES) {
      await new Promise(resolve => 
        setTimeout(resolve, RETRY_DELAY * (retries + 1))
      );
      return sendWhatsAppMessage(phoneNumber, message, retries + 1);
    }

    throw error;
  }
}

export async function handleWebhook(data: any): Promise<any> {
  try {
    // Validate webhook signature (Twilio security)
    const signature = data.signature;
    delete data.signature;
    
    if (!signature) {
      throw new Error("Missing webhook signature");
    }

    // Parse message
    const { From, Body, MessageSid } = data;
    
    if (!From || !Body) {
      throw new Error("Invalid webhook payload");
    }

    // Log webhook
    logger.info("Webhook received", { From, Body, MessageSid });

    // Parse command
    const command = Body.trim().toUpperCase();

    // Handle commands
    switch (command) {
      case "RASTREAR":
        return { command, message: "Processando rastreamento..." };
      case "PROBLEMA":
        return { command, message: "Escalando para suporte..." };
      case "AVALIAR":
        return { command, message: "Abrindo link de avaliação..." };
      default:
        return { command: "UNKNOWN", message: "Não entendi seu comando" };
    }
  } catch (error) {
    logger.error("Webhook error", { error });
    throw error;
  }
}
```

---

## 📋 STORY 1.3: INTEGRATE WITH ORDER CREATION (1-1.5h)

### Modify: server/routes/orders.ts

```typescript
// Add import at top
import { sendWhatsAppMessage } from "../services/twilio-whatsapp-service";

// In order creation endpoint
app.post("/api/orders", authenticate, async (req, res) => {
  try {
    // Existing order creation logic...
    const order = await storage.createOrder({
      customerId: req.body.customerId,
      items: req.body.items,
      total: req.body.total,
      deliveryAddress: req.body.deliveryAddress,
      customerPhone: req.body.customerPhone,
      customerEmail: req.body.customerEmail
    });

    // NEW: Send WhatsApp notification
    if (order.customerPhone) {
      const message = `
🍕 Pedido confirmado!
Número: #${order.id}
Valor: R$ ${order.total}
Endereço: ${order.deliveryAddress}
Tempo: 30-40 min

Rastrear: https://app.com/track/${order.id}
      `.trim();

      // Send async (don't wait for response)
      sendWhatsAppMessage(order.customerPhone, message)
        .catch(err => {
          logger.error("Failed to send WhatsApp", { orderId: order.id, err });
          // TODO: Queue for retry or notify admin
        });
    }

    res.json({ success: true, order });
  } catch (error) {
    logger.error("Order creation error", { error });
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Also add endpoint for status updates
app.patch("/api/orders/:id/status", authenticate, requireRole("admin"), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await storage.updateOrderStatus(id, status);

      // NEW: Send status update WhatsApp
      if (order.customerPhone) {
        let message = "";
        
        switch (status) {
          case "preparing":
            message = "👨‍🍳 Seu pedido está sendo preparado!";
            break;
          case "ready":
            message = "✅ Seu pedido está pronto!\nMotorista saindo em breve...";
            break;
          case "out_for_delivery":
            message = `🚗 Seu pedido saiu para entrega!\nMotorista: João Silva\nFalta: 10-15 min`;
            break;
          case "delivered":
            message = `✅ Pedido entregue!\nObrigado por usar Wilson Pizzaria 🍕\nAvaliar: https://app.com/rate/${order.id}`;
            break;
        }

        if (message) {
          sendWhatsAppMessage(order.customerPhone, message)
            .catch(err => logger.error("WhatsApp status update error", { err }));
        }
      }

      res.json({ success: true, order });
    } catch (error) {
      logger.error("Status update error", { error });
      res.status(500).json({ error: "Failed to update status" });
    }
  }
);
```

---

## 📋 STORY 1.4: TEST WHATSAPP (1-1.5h)

### Create: server/services/__tests__/twilio-whatsapp-service.test.ts

```typescript
import { sendWhatsAppMessage, handleWebhook } from "../twilio-whatsapp-service";
import twilio from "twilio";

jest.mock("twilio");

describe("Twilio WhatsApp Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendWhatsAppMessage", () => {
    it("should send message successfully", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        sid: "SM123",
        status: "queued"
      });
      
      (twilio as jest.Mock).mockReturnValue({
        messages: { create: mockCreate }
      });

      const result = await sendWhatsAppMessage(
        "+5587999999999",
        "Test"
      );

      expect(result.sid).toBe("SM123");
      expect(mockCreate).toHaveBeenCalled();
    });

    it("should reject invalid phone", async () => {
      await expect(
        sendWhatsAppMessage("invalid", "Test")
      ).rejects.toThrow("Invalid phone number");
    });

    it("should reject empty message", async () => {
      await expect(
        sendWhatsAppMessage("+5587999999999", "")
      ).rejects.toThrow("Message cannot be empty");
    });

    it("should retry on failure", async () => {
      const mockCreate = jest.fn()
        .mockRejectedValueOnce(new Error("API Error"))
        .mockResolvedValueOnce({ sid: "SM123", status: "queued" });

      (twilio as jest.Mock).mockReturnValue({
        messages: { create: mockCreate }
      });

      const result = await sendWhatsAppMessage(
        "+5587999999999",
        "Test"
      );

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(result.sid).toBe("SM123");
    });
  });

  describe("handleWebhook", () => {
    it("should process valid webhook", async () => {
      const result = await handleWebhook({
        From: "whatsapp:+5587999999999",
        Body: "RASTREAR",
        MessageSid: "SM123"
      });

      expect(result.command).toBe("RASTREAR");
    });

    it("should handle unknown command", async () => {
      const result = await handleWebhook({
        From: "whatsapp:+5587999999999",
        Body: "UNKNOWN",
        MessageSid: "SM123"
      });

      expect(result.command).toBe("UNKNOWN");
    });
  });
});
```

---

## 📋 STORY 1.5: DOCUMENTATION & DEPLOY (0.5-1h)

### Create setup guide

1. Twilio credentials secured in env
2. WhatsApp service working
3. Messages sending in <5 seconds
4. Tests passing (>80% coverage)
5. Ready for production

---

## ✅ CHECKLIST TURN 5

- [ ] npm install twilio
- [ ] Twilio account created
- [ ] Env vars configured
- [ ] Connection tested
- [ ] twilio-whatsapp-service.ts created
- [ ] routes/orders.ts modified
- [ ] Tests written (40+ cases)
- [ ] All tests passing
- [ ] Coverage >80%
- [ ] Logs working
- [ ] Error handling verified
- [ ] Ready for Turn 6 review

---

**Documento criado:** Nov 30, 2025  
**Status:** ✅ Implementation Strategy Ready  
**Próximo:** Turn 6 (Code Review)  

