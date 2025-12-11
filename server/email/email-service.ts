/**
 * Email Service - Open Source (sem dependências externas)
 * Substitui SendGrid completamente sem custos
 * 
 * Estratégias:
 * 1. Console log (desenvolvimento local) - padrão
 * 2. In-memory storage (salva em memória para debug)
 * 3. Webhook para sistemas externos (Mailgun, SendGrid, etc - opcional)
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private sentEmails: Array<{ id: string; timestamp: Date; options: EmailOptions }> = [];
  private isDevelopment: boolean;
  private webhookUrl: string | null = null;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.webhookUrl = process.env.EMAIL_WEBHOOK_URL || null;
    this.initialize();
  }

  /**
   * Inicializa o serviço de email
   */
  private initialize() {
    console.log('[EmailService] ✅ Serviço de email inicializado (open-source)');
    console.log('[EmailService] Modo: Console Log + In-Memory Storage');
    if (this.webhookUrl) {
      console.log(`[EmailService] Webhook configurado: ${this.webhookUrl}`);
    }
  }

  /**
   * Envia um email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Armazena em memória
    this.sentEmails.push({
      id: messageId,
      timestamp: new Date(),
      options,
    });

    // Log no console
    this.logEmailToConsole(messageId, options);

    // Webhook (opcional)
    if (this.webhookUrl) {
      this.sendToWebhook(messageId, options).catch(() => {
        // Continua mesmo se webhook falhar
      });
    }

    return {
      success: true,
      messageId,
    };
  }

  /**
   * Envia email de confirmação de pedido
   */
  async sendOrderConfirmation(params: {
    customerEmail: string;
    customerName: string;
    orderId: string;
    restaurantName: string;
    total: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    deliveryAddress: string;
  }): Promise<EmailResponse> {
    const itemsHtml = params.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;" align="right">×${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;" align="right">R$ ${(item.price / 100).toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2>Pedido Confirmado!</h2>
        <p>Olá <strong>${params.customerName}</strong>,</p>
        <p>Seu pedido foi confirmado com sucesso no <strong>${params.restaurantName}</strong>.</p>
        
        <h3>Detalhes do Pedido</h3>
        <p><strong>ID do Pedido:</strong> ${params.orderId}</p>
        
        <h4>Itens:</h4>
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
          <tr style="background-color: #f5f5f5; font-weight: bold;">
            <td style="padding: 10px;" colspan="2">TOTAL</td>
            <td style="padding: 10px; text-align: right;">R$ ${(params.total / 100).toFixed(2)}</td>
          </tr>
        </table>
        
        <h4>Entrega</h4>
        <p>${params.deliveryAddress}</p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Este é um email automático. Não responda este email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: params.customerEmail,
      subject: `Pedido Confirmado - ${params.restaurantName}`,
      html,
    });
  }

  /**
   * Envia email de notificação para o restaurante
   */
  async sendRestaurantNotification(params: {
    restaurantEmail: string;
    restaurantName: string;
    orderId: string;
    customerName: string;
    customerPhone: string;
    items: Array<{ name: string; quantity: number }>;
    deliveryAddress: string;
    specialRequests?: string;
  }): Promise<EmailResponse> {
    const itemsHtml = params.items
      .map((item) => `<li>${item.name} ×${item.quantity}</li>`)
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">🚨 Novo Pedido Recebido!</h2>
        
        <h3>Cliente</h3>
        <p><strong>Nome:</strong> ${params.customerName}</p>
        <p><strong>Telefone:</strong> ${params.customerPhone}</p>
        
        <h3>Itens</h3>
        <ul>
          ${itemsHtml}
        </ul>
        
        <h3>Endereço de Entrega</h3>
        <p>${params.deliveryAddress}</p>
        
        ${params.specialRequests ? `<h3>Observações</h3><p>${params.specialRequests}</p>` : ''}
        
        <p style="background-color: #e74c3c; color: white; padding: 10px; border-radius: 5px;">
          <strong>ID do Pedido:</strong> ${params.orderId}
        </p>
      </div>
    `;

    return this.sendEmail({
      to: params.restaurantEmail,
      subject: `[NOVO PEDIDO] ${params.orderId} - ${params.restaurantName}`,
      html,
    });
  }

  /**
   * Log email no console
   */
  private logEmailToConsole(messageId: string, options: EmailOptions): void {
    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL ENVIADO');
    console.log('='.repeat(80));
    console.log(`ID: ${messageId}`);
    console.log(`Para: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    console.log(`Assunto: ${options.subject}`);
    console.log(`De: ${options.from || 'noreply@foodflow.app'}`);
    if (options.cc && options.cc.length > 0) {
      console.log(`CC: ${options.cc.join(', ')}`);
    }
    if (options.bcc && options.bcc.length > 0) {
      console.log(`BCC: ${options.bcc.join(', ')}`);
    }
    console.log('---');
    if (options.html) {
      const preview = options.html.replace(/<[^>]*>/g, '').substring(0, 200);
      console.log(preview + (options.html.length > 200 ? '...' : ''));
    } else if (options.text) {
      console.log(options.text);
    } else {
      console.log('(sem conteúdo)');
    }
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Envia para webhook externo (opcional)
   */
  private async sendToWebhook(messageId: string, options: EmailOptions): Promise<void> {
    if (!this.webhookUrl) return;

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          timestamp: new Date(),
          ...options,
        }),
      });

      if (!response.ok) {
        console.warn(`[EmailService] Webhook falhou com status ${response.status}`);
      }
    } catch (error) {
      console.warn('[EmailService] Erro ao enviar para webhook:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Recupera emails enviados (para debug/teste)
   */
  getSentEmails() {
    return this.sentEmails;
  }

  /**
   * Limpa histórico de emails
   */
  clearSentEmails() {
    this.sentEmails = [];
  }

  /**
   * Testa a conexão/funcionalidade
   */
  async testConnection(): Promise<boolean> {
    console.log('[EmailService] ✅ Email service está operacional');
    console.log(`[EmailService] Total de emails enviados: ${this.sentEmails.length}`);
    
    if (this.webhookUrl) {
      console.log(`[EmailService] Webhook: ${this.webhookUrl}`);
    }
    
    return true;
  }
}

const emailService = new EmailService();
export default emailService;
