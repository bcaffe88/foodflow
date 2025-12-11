/**
 * Mock Payment Service - Substitui Stripe sem custos
 * Implementa sistema de pagamento local para desenvolvimento
 * 
 * Em produção, pode ser facilmente integrado com Stripe real
 */

import crypto from 'crypto';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  description?: string;
  metadata?: Record<string, any>;
  created: Date;
  clientSecret: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'pix' | 'boleto';
  status: 'valid' | 'expired' | 'invalid';
  cardLast4?: string;
  cardBrand?: string;
}

class MockPaymentService {
  private paymentIntents: Map<string, PaymentIntent> = new Map();
  private paymentMethods: Map<string, PaymentMethod> = new Map();

  /**
   * Cria um intent de pagamento (substitui stripe.paymentIntents.create)
   * Para testes, qualquer valor vai passar
   * Para simulação de falha, use amount negativo
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntent> {
    const id = `pi_mock_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecret = `${id}_secret_${crypto.randomBytes(16).toString('hex')}`;

    const intent: PaymentIntent = {
      id,
      amount: params.amount,
      currency: params.currency,
      status: 'pending',
      description: params.description,
      metadata: params.metadata,
      created: new Date(),
      clientSecret,
    };

    this.paymentIntents.set(id, intent);

    console.log(`[MockPayment] Created payment intent: ${id} - Amount: ${params.amount / 100} ${params.currency}`);

    return intent;
  }

  /**
   * Recupera um payment intent
   */
  async getPaymentIntent(id: string): Promise<PaymentIntent | null> {
    return this.paymentIntents.get(id) || null;
  }

  /**
   * Confirma o pagamento (simula confirmação do cliente)
   * Em produção real, seria feito via webhook do Stripe
   */
  async confirmPayment(params: {
    paymentIntentId: string;
    paymentMethodId: string;
  }): Promise<{ success: boolean; status: string; message?: string }> {
    const intent = this.paymentIntents.get(params.paymentIntentId);
    const method = this.paymentMethods.get(params.paymentMethodId);

    if (!intent) {
      return { success: false, status: 'error', message: 'Payment intent not found' };
    }

    if (!method) {
      return { success: false, status: 'error', message: 'Payment method not found' };
    }

    // 99% de chance de sucesso em desenvolvimento
    const isSuccess = Math.random() < 0.99 || intent.amount < 0; // Falha se amount negativo

    if (isSuccess) {
      intent.status = 'succeeded';
      console.log(`[MockPayment] Payment SUCCEEDED: ${params.paymentIntentId}`);
      return { success: true, status: 'succeeded' };
    } else {
      intent.status = 'failed';
      console.log(`[MockPayment] Payment FAILED: ${params.paymentIntentId}`);
      return { success: false, status: 'failed', message: 'Card declined' };
    }
  }

  /**
   * Cria um payment method mock
   */
  async createPaymentMethod(params: {
    type: 'card' | 'pix' | 'boleto';
    cardNumber?: string;
    cardExpiry?: string;
    cardCvc?: string;
  }): Promise<PaymentMethod> {
    const id = `pm_mock_${crypto.randomBytes(8).toString('hex')}`;

    const method: PaymentMethod = {
      id,
      type: params.type,
      status: 'valid',
      cardLast4: params.cardNumber?.slice(-4),
      cardBrand: this.detectCardBrand(params.cardNumber),
    };

    this.paymentMethods.set(id, method);

    console.log(`[MockPayment] Created payment method: ${id} - Type: ${params.type}`);

    return method;
  }

  /**
   * Reembolsa um pagamento
   */
  async refundPayment(params: {
    paymentIntentId: string;
    amount?: number;
  }): Promise<{ success: boolean; refundId: string }> {
    const intent = this.paymentIntents.get(params.paymentIntentId);

    if (!intent || intent.status !== 'succeeded') {
      return { success: false, refundId: '' };
    }

    const refundId = `rf_mock_${crypto.randomBytes(8).toString('hex')}`;

    console.log(`[MockPayment] Refund issued: ${refundId} - Amount: ${(params.amount || intent.amount) / 100}`);

    intent.status = 'canceled';

    return { success: true, refundId };
  }

  /**
   * Detecta marca do cartão
   */
  private detectCardBrand(cardNumber?: string): string {
    if (!cardNumber) return 'unknown';
    const number = cardNumber.replace(/\s/g, '');

    if (/^4/.test(number)) return 'visa';
    if (/^5[1-5]/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    if (/^6(?:011|5)/.test(number)) return 'discover';

    return 'unknown';
  }

  /**
   * Gera estatísticas para debugging
   */
  getStats() {
    return {
      totalIntents: this.paymentIntents.size,
      totalMethods: this.paymentMethods.size,
      successfulPayments: Array.from(this.paymentIntents.values()).filter((p) => p.status === 'succeeded')
        .length,
      failedPayments: Array.from(this.paymentIntents.values()).filter((p) => p.status === 'failed').length,
      pendingPayments: Array.from(this.paymentIntents.values()).filter((p) => p.status === 'pending').length,
    };
  }
}

// Singleton instance
const mockPaymentService = new MockPaymentService();

/**
 * Wrapper para compatibilidade com código que usa Stripe
 * Se STRIPE_SECRET_KEY não estiver definida, usa mock
 */
export class StripeCompatible {
  paymentIntents = {
    create: (params: any) => mockPaymentService.createPaymentIntent({
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      metadata: params.metadata,
    }),
    retrieve: (id: string) => mockPaymentService.getPaymentIntent(id),
  };

  paymentMethods = {
    create: (params: any) => mockPaymentService.createPaymentMethod({
      type: params.type,
      cardNumber: params.card?.number,
      cardExpiry: params.card?.exp_month + '/' + params.card?.exp_year,
      cardCvc: params.card?.cvc,
    }),
  };

  charges = {
    create: async (params: any) => {
      const result = await mockPaymentService.confirmPayment({
        paymentIntentId: params.payment_method,
        paymentMethodId: params.payment_method,
      });
      return {
        id: `ch_mock_${crypto.randomBytes(8).toString('hex')}`,
        amount: params.amount,
        currency: params.currency,
        status: result.status,
        succeeded: result.success,
      };
    },
  };

  refunds = {
    create: (params: any) => mockPaymentService.refundPayment({
      paymentIntentId: params.charge || params.payment_intent,
      amount: params.amount,
    }),
  };

  webhookEndpoints = {
    list: async () => ({
      data: [
        {
          id: 'we_mock_local',
          url: 'http://localhost:5000/api/webhooks/stripe',
          enabled_events: ['payment_intent.succeeded', 'payment_intent.failed'],
          status: 'enabled',
        },
      ],
    }),
  };
}

export const stripe = new StripeCompatible();
export default mockPaymentService;
