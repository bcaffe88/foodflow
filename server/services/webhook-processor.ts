import { log } from "../logger";

interface WebhookEvent {
  type: string;
  externalId: string;
  orderId?: string;
  tenantId: string;
  data: any;
  timestamp: string;
}

class WebhookRetryQueue {
  private queue: Map<string, WebhookEvent & { retries: number; nextRetry: number }> = new Map();
  private maxRetries = 3;
  private retryDelays = [5000, 15000, 60000]; // 5s, 15s, 60s

  enqueue(webhook: WebhookEvent): void {
    const id = `${webhook.tenantId}-${webhook.externalId}`;
    this.queue.set(id, {
      ...webhook,
      retries: 0,
      nextRetry: Date.now(),
    });
    log(`[WebhookQueue] Enqueued: ${id}`);
  }

  getRetryable(): WebhookEvent[] {
    const now = Date.now();
    const retryable: WebhookEvent[] = [];

    this.queue.forEach((webhook, id) => {
      if (webhook.retries < this.maxRetries && webhook.nextRetry <= now) {
        retryable.push({
          type: webhook.type,
          externalId: webhook.externalId,
          orderId: webhook.orderId,
          tenantId: webhook.tenantId,
          data: webhook.data,
          timestamp: webhook.timestamp,
        });
      }
    });

    return retryable;
  }

  markProcessed(tenantId: string, externalId: string): void {
    const id = `${tenantId}-${externalId}`;
    this.queue.delete(id);
    log(`[WebhookQueue] Processed: ${id}`);
  }

  markRetry(tenantId: string, externalId: string): void {
    const id = `${tenantId}-${externalId}`;
    const webhook = this.queue.get(id);
    if (webhook) {
      webhook.retries++;
      if (webhook.retries < this.maxRetries) {
        webhook.nextRetry = Date.now() + this.retryDelays[webhook.retries - 1];
        log(`[WebhookQueue] Retry scheduled: ${id} (attempt ${webhook.retries}/${this.maxRetries})`);
      } else {
        this.queue.delete(id);
        log(`[WebhookQueue] Max retries reached: ${id}`);
      }
    }
  }
}

class WebhookProcessor {
  private queue = new WebhookRetryQueue();
  private processing = false;

  async processIFoodWebhook(payload: any, tenantId: string): Promise<{ orderId?: string; externalId: string }> {
    try {
      const externalId = payload.externalId || payload.id;
      log(`[Webhook] Processing iFood: ${externalId}`);

      // Parse iFood payload
      const orderId = `ifood-${externalId}-${Date.now()}`;
      
      return {
        orderId,
        externalId,
      };
    } catch (error) {
      log(`[Webhook] iFood processing error: ${error}`);
      throw error;
    }
  }

  async processUberEatsWebhook(payload: any, tenantId: string): Promise<{ orderId?: string; externalId: string }> {
    try {
      const externalId = payload.eaterID || payload.id;
      log(`[Webhook] Processing UberEats: ${externalId}`);

      // Parse UberEats payload
      const orderId = `ubereats-${externalId}-${Date.now()}`;

      return {
        orderId,
        externalId,
      };
    } catch (error) {
      log(`[Webhook] UberEats processing error: ${error}`);
      throw error;
    }
  }

  async processLoggiWebhook(payload: any, tenantId: string): Promise<{ orderId?: string; externalId: string }> {
    try {
      const externalId = payload.id || payload.tracking_id;
      log(`[Webhook] Processing Loggi: ${externalId}`);

      const orderId = `loggi-${externalId}-${Date.now()}`;

      return {
        orderId,
        externalId,
      };
    } catch (error) {
      log(`[Webhook] Loggi processing error: ${error}`);
      throw error;
    }
  }

  startRetryProcessor(): void {
    if (this.processing) return;
    this.processing = true;

    setInterval(() => {
      const retryable = this.queue.getRetryable();
      retryable.forEach(webhook => {
        log(`[WebhookQueue] Retrying webhook: ${webhook.tenantId}/${webhook.externalId}`);
        // Aqui entraria lógica de retry - por enquanto só log
      });
    }, 5000);
  }
}

export const webhookProcessor = new WebhookProcessor();
