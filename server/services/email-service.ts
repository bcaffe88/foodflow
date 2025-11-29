// Email Notifications Service (SendGrid)
// Transactional emails: order confirmations, driver alerts, etc.
// FREE tier: 100 emails/day

import sgMail from '@sendgrid/mail';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

let emailInitialized = false;

/**
 * Initialize SendGrid
 * Requires: SENDGRID_API_KEY environment variable
 */
export function initializeEmail(): boolean {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.warn('SendGrid API key not configured. Email notifications disabled.');
      return false;
    }

    sgMail.setApiKey(apiKey);
    emailInitialized = true;
    console.log('SendGrid initialized successfully');
    return true;
  } catch (error) {
    console.error('SendGrid initialization error:', error);
    return false;
  }
}

/**
 * Send transactional email
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    if (!emailInitialized) {
      console.warn('SendGrid not initialized, email skipped');
      return false;
    }

    const msg = {
      to: payload.to,
      from: payload.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@wilsonpizzaria.com',
      subject: payload.subject,
      html: payload.html
    };

    const response = await sgMail.send(msg as any);
    console.log('Email sent:', response[0].statusCode);
    return true;
  } catch (error) {
    console.error('Send email error:', error);
    return false;
  }
}

/**
 * Send order confirmation to customer
 */
export async function sendOrderConfirmation(
  customerEmail: string,
  customerName: string,
  orderId: string,
  total: number,
  restaurantName: string
): Promise<boolean> {
  const html = `
    <h2>Pedido Confirmado! ✅</h2>
    <p>Olá <strong>${customerName}</strong>,</p>
    <p>Seu pedido de <strong>${restaurantName}</strong> foi confirmado!</p>
    
    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>ID do Pedido:</strong> ${orderId}</p>
      <p><strong>Total:</strong> R$ ${(total).toFixed(2)}</p>
    </div>
    
    <p>Você receberá atualizações em tempo real sobre seu pedido.</p>
    <p>Obrigado pela sua compra!</p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Pedido Confirmado #${orderId.slice(0, 8)}`,
    html
  });
}

/**
 * Send driver assignment notification
 */
export async function sendDriverAssignment(
  driverEmail: string,
  driverName: string,
  orderId: string,
  customerName: string,
  deliveryAddress: string
): Promise<boolean> {
  const html = `
    <h2>Novo Pedido! 🚗</h2>
    <p>Olá <strong>${driverName}</strong>,</p>
    <p>Você foi atribuído a um novo pedido!</p>
    
    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Pedido:</strong> ${orderId.slice(0, 8)}</p>
      <p><strong>Cliente:</strong> ${customerName}</p>
      <p><strong>Endereço:</strong> ${deliveryAddress}</p>
    </div>
    
    <p>Acesse o aplicativo para aceitar o pedido.</p>
  `;

  return sendEmail({
    to: driverEmail,
    subject: `Novo Pedido #${orderId.slice(0, 8)}`,
    html
  });
}

/**
 * Send delivery completion email to customer
 */
export async function sendDeliveryComplete(
  customerEmail: string,
  customerName: string,
  orderId: string,
  restaurantName: string
): Promise<boolean> {
  const html = `
    <h2>Pedido Entregue! 🎉</h2>
    <p>Olá <strong>${customerName}</strong>,</p>
    <p>Seu pedido de <strong>${restaurantName}</strong> foi entregue com sucesso!</p>
    
    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Pedido:</strong> ${orderId.slice(0, 8)}</p>
    </div>
    
    <p>Por favor, avalie seu pedido no aplicativo para nos ajudar a melhorar.</p>
    <p>Obrigado e bom apetite!</p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Pedido Entregue #${orderId.slice(0, 8)}`,
    html
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(
  email: string,
  name: string,
  resetLink: string
): Promise<boolean> {
  const html = `
    <h2>Redefinir Senha</h2>
    <p>Olá <strong>${name}</strong>,</p>
    <p>Você solicitou a redefinição de sua senha. Clique no link abaixo:</p>
    
    <p style="margin: 30px 0;">
      <a href="${resetLink}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Redefinir Senha
      </a>
    </p>
    
    <p style="color: #666; font-size: 12px;">
      Este link expira em 24 horas. Se você não solicitou isso, ignore este email.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Redefinir Sua Senha',
    html
  });
}

/**
 * Health check
 */
export async function emailHealthCheck(): Promise<boolean> {
  return emailInitialized;
}
