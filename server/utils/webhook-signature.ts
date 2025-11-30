import crypto from "crypto";

/**
 * Verify HMAC signature for iFood webhooks
 */
export function verifyIFoodSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Verify HMAC signature for UberEats webhooks
 */
export function verifyUberEatsSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Verify signature for Pede Aí webhooks
 */
export function verifyPedeAiSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hash = crypto.createHmac("sha256", secret).update(payload).digest("base64");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Verify signature for Quero Delivery webhooks
 */
export function verifyQueroDeliverySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}
