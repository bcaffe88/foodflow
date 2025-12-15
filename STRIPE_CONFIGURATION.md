# Stripe Configuration Guide - FoodFlow

## Overview

FoodFlow supports multiple payment methods:
- **Cash** (Dinheiro) - No Stripe needed
- **Card** (Cartão) - Requires Stripe
- **PIX** (Direct) - Mock/direct payment, no Stripe needed

## Current Implementation

### Payment Methods in Order Placement
The application has 3 payment options in `order-placement.tsx`:
1. `cash` - Direct payment, no Stripe integration
2. `card` - Goes to Stripe checkout
3. `pix` - Mock payment (NOT Stripe PIX)

### Stripe Configuration Levels

**1. Global Stripe (Optional)**
- Environment variable: `STRIPE_SECRET_KEY`
- Environment variable: `STRIPE_PUBLIC_KEY`
- Used as fallback when tenant doesn't have own Stripe keys
- Set in Railway environment variables

**2. Per-Tenant Stripe (Recommended)**
Each restaurant can configure its own Stripe account:
- Stored in `tenants` table: `stripePublicKey`, `stripeSecretKey`
- Configured via admin dashboard
- Allows each restaurant to receive payments directly

## Railway Environment Variables

Set these in Railway dashboard:

```bash
# Database
DATABASE_URL=postgresql://...

# Server
NODE_ENV=production
PORT=5000

# Stripe (Optional - Global)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Session
SESSION_SECRET=your-session-secret
```

## Stripe PIX Configuration (Brazil Only)

### Important Notes About PIX

1. **Stripe PIX requires Brazil-based Stripe account**
   - Standard Stripe accounts don't support PIX
   - Must be registered with Brazilian business details
   - Requires CPF/CNPJ

2. **Current Implementation**
   - The app's "pix" payment option is a MOCK payment
   - It does NOT use Stripe PIX
   - It's for cash-equivalent/direct payments

3. **To Enable Real Stripe PIX:**
   ```typescript
   // In payment/routes.ts line 132
   // Change from:
   const paymentMethodTypes = data.paymentMethods || ["card"];
   
   // To:
   const paymentMethodTypes = data.paymentMethods || ["card", "pix"];
   ```
   
   **But only if:**
   - You have a Brazil-based Stripe account
   - PIX is activated in your Stripe dashboard
   - You've completed Stripe's PIX onboarding

### Error: "PIX payment method not activated"

This error occurs when:
- Code tries to create payment intent with `paymentMethods: ["pix"]`
- But the Stripe account doesn't have PIX enabled

**Solution:**
- Keep PIX as mock/direct payment (current implementation)
- OR activate PIX in Stripe dashboard (Brazil accounts only)
- OR remove PIX option from frontend

## Wilson Pizza Configuration

For Wilson Pizza in Ouricuri, PE:

### Recommended Setup

**Option 1: Cash Only (Simplest)**
```bash
# No Stripe variables needed
# Only use "cash" payment method
```

**Option 2: Card Payments via Stripe**
```bash
# Set Railway environment variables:
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_PUBLIC_KEY=pk_live_your_key

# Or configure per-tenant in admin dashboard
```

**Option 3: Mock PIX (Current)**
```bash
# No Stripe needed
# "pix" option works as direct/manual payment
# Staff confirms payment manually
```

## Testing Stripe Integration

### Test Mode
Use test keys for development:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
```

### Production
Use live keys:
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
```

## Troubleshooting

### Error: "Payment service not configured"
- Check if `STRIPE_SECRET_KEY` is set in Railway
- Or configure tenant's Stripe keys in admin dashboard

### Error: "PIX payment method not activated"
- This is normal - PIX requires Brazil Stripe account
- Keep using mock PIX (current implementation)
- Or disable PIX option entirely

### Error: "Customer ID foreign key violation"
- This is unrelated to Stripe
- Backend already handles null customer_id correctly
- Issue is likely in test data

## Admin Dashboard Configuration

Restaurant owners can configure Stripe via:
1. Login to admin dashboard
2. Navigate to Settings/Payments
3. Enter Stripe keys:
   - **Publishable Key**: `pk_live_...`
   - **Secret Key**: `sk_live_...`

## Code References

- Stripe client: `server/payment/stripe.ts`
- Payment routes: `server/payment/routes.ts`
- Order placement: `client/src/pages/order-placement.tsx`
- Mock payments: `server/payment/mock-payment.ts`

## Summary

For Wilson Pizza:
- ✅ **Cash payments**: Works out of the box
- ⚠️ **Card payments**: Needs Stripe account + keys
- ⚠️ **PIX via Stripe**: Requires Brazil Stripe account
- ✅ **Mock PIX**: Works as direct payment (current)

**Current Status:**
- Deployment: ✅ Working on Railway
- Payment methods: ✅ Cash/Mock PIX work without Stripe
- Stripe integration: ⚠️ Optional, requires configuration
