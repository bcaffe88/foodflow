import twilio from "twilio";
import { log } from "../logger";

/**
 * Twilio WhatsApp Service - Real implementation with fallback to logging
 * Sends WhatsApp messages via Twilio API when credentials are available
 * Falls back to logging for development/testing
 */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromPhone: string;
}

let twilioClient: any = null;
let config: TwilioConfig | null = null;
let isConfigured = false;

/**
 * Initialize Twilio client if credentials are available
 */
export function initializeTwilio(): boolean {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_WHATSAPP_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      log(
        `[Twilio] Credentials not fully configured. Using logging fallback. hasAccountSid=${!!accountSid}, hasAuthToken=${!!authToken}, hasFromPhone=${!!fromPhone}`
      );
      isConfigured = false;
      return false;
    }

    twilioClient = twilio(accountSid, authToken);
    config = { accountSid, authToken, fromPhone };
    isConfigured = true;

    log("[Twilio] WhatsApp service initialized successfully");
    return true;
  } catch (error) {
    log("[Twilio] Failed to initialize:", error);
    isConfigured = false;
    return false;
  }
}

/**
 * Validate phone number format
 */
function validatePhoneNumber(phone: string): boolean {
  // Basic validation: should start with + and have at least 10 digits
  return /^\+\d{10,}$/.test(phone);
}

/**
 * Format phone for WhatsApp (ensure +55xx format for Brazil)
 */
function formatPhoneForWhatsApp(phone: string): string {
  let formatted = phone.trim();

  // If starts with 55 without +, add it
  if (formatted.startsWith("55") && !formatted.startsWith("+55")) {
    formatted = "+" + formatted;
  }
  // If doesn't start with +, assume Brazil and prepend
  else if (!formatted.startsWith("+")) {
    formatted = "+55" + formatted;
  }

  return formatted;
}

/**
 * Send WhatsApp message with retry logic
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  retries = 0
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    // Validate input
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      throw new Error("Invalid phone number");
    }
    if (!message || message.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    const formattedPhone = formatPhoneForWhatsApp(phoneNumber);

    if (!validatePhoneNumber(formattedPhone)) {
      throw new Error(`Invalid phone format: ${formattedPhone}`);
    }

    // If Twilio is configured, send via API
    if (isConfigured && twilioClient && config) {
      try {
        const result = await twilioClient.messages.create({
          from: `whatsapp:${config.fromPhone}`,
          to: `whatsapp:${formattedPhone}`,
          body: message,
        });

        log(`[Twilio] Message sent successfully - sid=${result.sid}, to=${formattedPhone}, status=${result.status}`);

        return {
          success: true,
          sid: result.sid,
        };
      } catch (twilioError: any) {
        // If it's a rate limit or temporary error, retry
        if (retries < MAX_RETRIES && twilioError.status >= 500) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY * (retries + 1))
          );
          return sendWhatsAppMessage(phoneNumber, message, retries + 1);
        }

        throw twilioError;
      }
    } else {
      // Fallback: log message (development/testing mode)
      log(`[Twilio Fallback] Message logged (Twilio not configured) - to=${formattedPhone}, message=${message.substring(0, 100)}`);

      console.log(`[WhatsApp Message - FALLBACK MODE]`, {
        to: formattedPhone,
        message,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        sid: `mock-${Date.now()}`,
      };
    }
  } catch (error: any) {
    log(`[Twilio] Error sending message - error=${error.message}, retries=${retries}`);

    // If we haven't exhausted retries, try again
    if (retries < MAX_RETRIES) {
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY * (retries + 1))
      );
      return sendWhatsAppMessage(phoneNumber, message, retries + 1);
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send formatted order notification
 */
export async function sendOrderNotification(
  customerPhone: string,
  orderId: string,
  restaurantName: string,
  items: string[],
  total: string
): Promise<{ success: boolean; error?: string }> {
  const message = `🍕 *Pedido Confirmado!*\n\n*${restaurantName}*\n\n${items.join(
    "\n"
  )}\n\n💰 Total: R$ ${total}\nPedido: #${orderId.substring(0, 8).toUpperCase()}\n\nAcompanhe seu pedido: https://seu-app.com/track/${orderId}`;

  const result = await sendWhatsAppMessage(customerPhone, message);
  return {
    success: result.success,
    error: result.error,
  };
}

/**
 * Send status update notification
 */
export async function sendStatusUpdate(
  customerPhone: string,
  orderId: string,
  previousStatus: string,
  newStatus: string,
  restaurantName: string
): Promise<{ success: boolean; error?: string }> {
  const statusMessages: Record<string, string> = {
    pending: "Seu pedido foi recebido! ✅",
    confirmed: "Seu pedido foi confirmado! 🎉",
    preparing: "Estamos preparando seu pedido! 👨‍🍳",
    ready: "Seu pedido está pronto! ✅",
    out_for_delivery: "Seu pedido saiu para entrega! 🚗",
    delivered: "Pedido entregue! Obrigado! 🎉",
    cancelled: "Pedido cancelado 😞",
  };

  const message = `📦 *Atualização de Pedido*\n\n${
    statusMessages[newStatus] || newStatus
  }\n\nRestaurante: ${restaurantName}\nPedido: #${orderId
    .substring(0, 8)
    .toUpperCase()}`;

  const result = await sendWhatsAppMessage(customerPhone, message);
  return {
    success: result.success,
    error: result.error,
  };
}

/**
 * Send kitchen order notification
 */
export async function sendKitchenOrder(
  restaurantPhone: string,
  orderId: string,
  items: Array<{ name: string; quantity: number; notes?: string }>,
  total: string,
  customerPhone: string,
  deliveryAddress: string
): Promise<{ success: boolean; error?: string }> {
  const itemsList = items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.name}${item.notes ? ` (${item.notes})` : ""}`
    )
    .join("\n");

  const message = `🔔 *NOVO PEDIDO* - ${orderId.substring(0, 8).toUpperCase()}\n\n${itemsList}\n\n💰 Total: R$ ${total}\n📍 Endereço: ${deliveryAddress}\n📱 Cliente: ${customerPhone}`;

  const result = await sendWhatsAppMessage(restaurantPhone, message);
  return {
    success: result.success,
    error: result.error,
  };
}

/**
 * Handle incoming WhatsApp message webhook
 */
export async function handleIncomingMessage(
  phoneNumber: string,
  message: string
): Promise<string> {
  log(`[Twilio Webhook] Incoming message from=${phoneNumber}, message=${message}`);

  const lowerMessage = message.toLowerCase().trim();

  // Detect commands
  if (lowerMessage.includes("rastrear") || lowerMessage.includes("track")) {
    return "Seu pedido está a caminho! 🚗\n\nEndereço: Rua Principal, 123\nTempo: 10-15 min";
  }

  if (
    lowerMessage.includes("problema") ||
    lowerMessage.includes("issue") ||
    lowerMessage.includes("help")
  ) {
    return "Desculpe pelos problemas! 😞\n\nEm breve um atendente entrará em contato. Obrigado!";
  }

  if (lowerMessage.includes("avaliar") || lowerMessage.includes("rate")) {
    return "Obrigado por pedir conosco! 🙏\n\nAvalie sua experiência: https://seu-app.com/rate";
  }

  // Default response
  return "Olá! 👋\n\nOlá! Como posso ajudar?\n\nDigite:\n- RASTREAR: acompanhar pedido\n- PROBLEMA: reportar problema\n- AVALIAR: avaliar pedido";
}

// Initialize on import
initializeTwilio();
