// Rate Limiting Middleware
// Protege APIs contra abuse e DDoS

import rateLimit from 'express-rate-limit';

/**
 * General API rate limit: 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req: any) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip;
  }
});

/**
 * Stricter limit for login/auth: 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.body?.email || req.ip
});

/**
 * Order creation limit: 30 requests per hour (per user)
 */
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: 'Too many orders created, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id || req.ip
});

/**
 * Webhook limit: 1000 requests per minute (per tenant)
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: 'Webhook rate limit exceeded.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.params.tenantId || req.ip
});

/**
 * Payment processing limit: 10 requests per hour (per user)
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many payment attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id || req.ip
});
