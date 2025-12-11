/**
 * WhatsApp Service - Mock Implementation (sem dependências externas)
 * Substitui Twilio completamente sem custos
 * 
 * Estratégias:
 * 1. Console log (desenvolvimento local) - padrão
 * 2. In-memory storage (salva em memória para debug)
 * 3. Webhook para sistemas externos (Twilio, ClickSend, etc - opcional)
 * 4. Simulação de respostas
 */

export interface WhatsAppMessage {
  to: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  sid?: string;
  error?: string;
  timestamp: Date;
}

class WhatsAppService {
  private messages: Array<{
    id: string;
    timestamp: Date;
    message: WhatsAppMessage;
    status: 'sent' | 'delivered' | 'read' | 'failed';
  }> = [];
  private webhookUrl: string | null = null;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.webhookUrl = process.env.WHATSAPP_WEBHOOK_URL || null;
    this.initialize();
  }

  /**
   * Inicializa o serviço de WhatsApp
   */
  private initialize() {
    console.log('[WhatsAppService] ✅ Serviço de WhatsApp inicializado (mock)');
    console.log('[WhatsAppService] Modo: Console Log + In-Memory Storage');
    if (this.webhookUrl) {
      console.log(`[WhatsAppService] Webhook configurado: ${this.webhookUrl}`);
    }
  }

  /**
   * Envia mensagem de WhatsApp
   */
  async sendMessage(options: WhatsAppMessage): Promise<WhatsAppResponse> {
    // Gera ID similar ao Twilio
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sid = `SM${Date.now()}${Math.random().toString(36).substr(2, 20).toUpperCase()}`;

    // Simula envio com 95% de sucesso
    const success = Math.random() < 0.95;
    const status = success ? 'sent' : 'failed';

    // Armazena
    this.messages.push({
      id: messageId,
      timestamp: new Date(),
      message: options,
      status,
    });

    // Log
    this.logToConsole(messageId, options);

    // Webhook (opcional)
    if (this.webhookUrl) {
      this.sendToWebhook(messageId, options, status).catch(() => {
        // Continua mesmo se webhook falhar
      });
    }

    return {
      success,
      messageId,
      sid,
      timestamp: new Date(),
      error: success ? undefined : 'Simulated failure',
    };
  }

  /**
   * Envia confirmação de pedido por WhatsApp
   */
  async sendOrderConfirmation(params: {
    phoneNumber: string;
    customerName: string;
    orderId: string;
    restaurantName: string;
    total: number;
    estimatedTime: number;
  }): Promise<WhatsAppResponse> {
    const message = `
*${params.restaurantName}*

Olá ${params.customerName}! 👋

Seu pedido foi confirmado! 🎉

📋 Pedido: ${params.orderId}
💰 Total: R$ ${(params.total / 100).toFixed(2)}
⏱️ Tempo estimado: ${params.estimatedTime} min

Acompanhe seu pedido em tempo real no app!
    `.trim();

    return this.sendMessage({
      to: params.phoneNumber,
      message,
    });
  }

  /**
   * Envia notificação de saída para entrega
   */
  async sendOutForDeliveryNotification(params: {
    phoneNumber: string;
    customerName: string;
    orderId: string;
    driverName: string;
    driverPhone: string;
    vehicleInfo: string;
  }): Promise<WhatsAppResponse> {
    const message = `
Olá ${params.customerName}! 📦

Seu pedido está a caminho!

🚗 Motorista: ${params.driverName}
📞 Contato: ${params.driverPhone}
🚙 Veículo: ${params.vehicleInfo}

Pedido: ${params.orderId}
    `.trim();

    return this.sendMessage({
      to: params.phoneNumber,
      message,
    });
  }

  /**
   * Envia notificação de entrega concluída
   */
  async sendDeliveryCompleteNotification(params: {
    phoneNumber: string;
    customerName: string;
    orderId: string;
  }): Promise<WhatsAppResponse> {
    const message = `
Olá ${params.customerName}! 🎉

Seu pedido foi entregue com sucesso!

Obrigado por usar nosso serviço! 😊
Pedido: ${params.orderId}

Qualquer dúvida, estamos aqui para ajudar! 📱
    `.trim();

    return this.sendMessage({
      to: params.phoneNumber,
      message,
    });
  }

  /**
   * Envia aviso ao restaurante sobre novo pedido
   */
  async sendRestaurantAlert(params: {
    phoneNumber: string;
    restaurantName: string;
    orderId: string;
    itemCount: number;
    total: number;
  }): Promise<WhatsAppResponse> {
    const message = `
🚨 *NOVO PEDIDO* - ${params.restaurantName}

Pedido: ${params.orderId}
Itens: ${params.itemCount}
Total: R$ ${(params.total / 100).toFixed(2)}

⚡ Responda rapidamente no app!
    `.trim();

    return this.sendMessage({
      to: params.phoneNumber,
      message,
    });
  }

  /**
   * Log da mensagem no console
   */
  private logToConsole(messageId: string, options: WhatsAppMessage): void {
    console.log('\n' + '='.repeat(80));
    console.log('📱 WHATSAPP MESSAGE');
    console.log('='.repeat(80));
    console.log(`ID: ${messageId}`);
    console.log(`To: ${options.to}`);
    console.log(`Message: ${options.message}`);
    if (options.mediaUrl) {
      console.log(`Media: ${options.mediaType || 'unknown'} - ${options.mediaUrl}`);
    }
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Envia para webhook externo
   */
  private async sendToWebhook(
    messageId: string,
    options: WhatsAppMessage,
    status: string
  ): Promise<void> {
    if (!this.webhookUrl) return;

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          timestamp: new Date(),
          status,
          ...options,
        }),
      }).catch(() => {
        // Silenciosamente ignora erro
      });
    } catch {
      // Continua mesmo se webhook falhar
    }
  }

  /**
   * Recupera mensagens enviadas (para debug)
   */
  getSentMessages() {
    return this.messages;
  }

  /**
   * Limpa histórico
   */
  clearMessages() {
    this.messages = [];
  }

  /**
   * Simula resposta de webhook do WhatsApp
   */
  simulateIncomingMessage(params: {
    from: string;
    message: string;
    messageId?: string;
  }): void {
    console.log('\n' + '='.repeat(80));
    console.log('📨 INCOMING WHATSAPP MESSAGE (Simulated)');
    console.log('='.repeat(80));
    console.log(`From: ${params.from}`);
    console.log(`Message: ${params.message}`);
    console.log(`ID: ${params.messageId || 'incoming_' + Date.now()}`);
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Testa a conexão
   */
  async testConnection(): Promise<boolean> {
    console.log('[WhatsAppService] ✅ WhatsApp service está operacional');
    console.log(`[WhatsAppService] Total de mensagens: ${this.messages.length}`);

    if (this.webhookUrl) {
      console.log(`[WhatsAppService] Webhook: ${this.webhookUrl}`);
    }

    return true;
  }

  /**
   * Obtem estatísticas
   */
  getStats() {
    const sent = this.messages.filter((m) => m.status === 'sent').length;
    const delivered = this.messages.filter((m) => m.status === 'delivered').length;
    const failed = this.messages.filter((m) => m.status === 'failed').length;

    return {
      total: this.messages.length,
      sent,
      delivered,
      failed,
      successRate: this.messages.length > 0 ? ((sent + delivered) / this.messages.length) * 100 : 0,
    };
  }
}

const whatsappService = new WhatsAppService();
export default whatsappService;
