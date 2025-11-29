// Rate Limiting Middleware - Simplified for stability
import rateLimit from 'express-rate-limit';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limit
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Order rate limit
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many orders, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook rate limit
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: 'Webhook rate limit exceeded.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment rate limit
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many payment attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
