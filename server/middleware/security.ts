import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

// Rate limiting - ATIVADO (apenas em produção)
export function rateLimit(req: Request, res: Response, next: NextFunction) {
  // Desabilitar em development
  if (process.env.NODE_ENV === "development") {
    return next();
  }

  const key = req.ip || "unknown";
  const now = Date.now();
  const limit = 100; // 100 requests
  const windowMs = 60 * 1000; // per 1 minute

  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { count: 0, resetTime: now + windowMs };
  }

  const store = rateLimitStore[key];

  if (now > store.resetTime) {
    store.count = 0;
    store.resetTime = now + windowMs;
  }

  store.count++;

  res.set("X-RateLimit-Limit", limit.toString());
  res.set("X-RateLimit-Remaining", Math.max(0, limit - store.count).toString());

  if (store.count > limit) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  next();
}

// CSRF Protection - DESABILITADO em desenvolvimento (será implementado com tokens em produção)
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  next();
}

// Request signing for webhook verification
export function verifyWebhookSignature(secret: string, body: string, signature: string): boolean {
  const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
}

// Error logging utility
export function logError(context: string, error: unknown): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : "";
  console.error(`[${timestamp}] ERROR [${context}]: ${errorMessage}`);
  if (errorStack) console.error(errorStack);
}
