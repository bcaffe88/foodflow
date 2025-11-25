import type { N8NClient } from "./n8n-api";
import type { SupabaseService } from "./supabase-service";
import { storage } from "./storage";
import { initializeN8NClient } from "./n8n-api";
import { initializeSupabaseService } from "./supabase-service";

export interface WhatsAppOrderRequest {
  phone_number: string;
  tenant_id: string;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
  address?: string;
  reference?: string;
}

export interface ParsedWhatsAppMessage {
  action: 'order_request' | 'status_check' | 'support' | 'unknown';
  phone_number: string;
  content: string;
  parsed_order?: WhatsAppOrderRequest;
  confidence: number;
}

/**
 * WhatsApp Integration Service
 * Connects N8N, Supabase, and FoodFlow
 */
export class WhatsAppIntegrationService {
  constructor(
    private n8nClient: N8NClient | null,
    private supabaseService: SupabaseService | null
  ) {
    console.log(`[WhatsApp Integration] Service initialized`);
  }

  /**
   * Process incoming WhatsApp message
   */
  async processIncomingMessage(phoneNumber: string, tenantId: string, message: string): Promise<void> {
    try {
      console.log(`[WhatsApp] Processing message from ${phoneNumber}: "${message}"`);

      if (!this.supabaseService) {
        console.error(`[WhatsApp] Supabase service not initialized`);
        return;
      }

      // Get or create session
      const session = await this.supabaseService.getOrCreateSession(phoneNumber, tenantId);
      console.log(`[WhatsApp] Session: ${session.id}`);

      // Save user message
      await this.supabaseService.saveMessage(session.id, 'user', message);

      // Get conversation history
      const messages = await this.supabaseService.getSessionMessages(session.id, 20);
      const conversationHistory = messages
        .reverse()
        .map(m => ({ role: m.role, content: m.content }));

      console.log(`[WhatsApp] Conversation history: ${conversationHistory.length} messages`);

      // Dispatch to N8N for LLM processing
      if (this.n8nClient) {
        await this.dispatchToN8NAgent(session.id, phoneNumber, tenantId, message, conversationHistory);
      } else {
        console.warn(`[WhatsApp] N8N not configured, skipping agent processing`);
      }
    } catch (error) {
      console.error(`[WhatsApp] Error processing message:`, error);
      throw error;
    }
  }

  /**
   * Dispatch to N8N Agent for LLM processing
   */
  private async dispatchToN8NAgent(
    sessionId: string,
    phoneNumber: string,
    tenantId: string,
    message: string,
    conversationHistory: any[]
  ): Promise<void> {
    try {
      console.log(`[N8N Agent] Dispatching message for processing...`);

      if (!this.n8nClient) return;

      // Try to find or create workflow
      const workflow = await this.n8nClient.getWorkflowByName('FoodFlow WhatsApp Agent');
      
      if (!workflow) {
        console.warn(`[N8N Agent] Workflow not found, will be created on first order`);
        return;
      }

      // Execute workflow
      const result = await this.n8nClient.executeWorkflow(workflow.id, {
        sessionId,
        phoneNumber,
        tenantId,
        message,
        conversationHistory
      });

      console.log(`[N8N Agent] Execution dispatched: ${result.id || 'async'}`);
    } catch (error) {
      console.error(`[N8N Agent] Error dispatching:`, error);
      // Don't throw - continue processing
    }
  }

  /**
   * Save assistant response
   */
  async saveAssistantResponse(sessionId: string, response: string, messageType?: string): Promise<void> {
    try {
      if (!this.supabaseService) {
        console.error(`[WhatsApp] Supabase service not initialized`);
        return;
      }

      await this.supabaseService.saveMessage(sessionId, 'assistant', response, messageType);
      console.log(`[WhatsApp] Response saved to session`);
    } catch (error) {
      console.error(`[WhatsApp] Error saving response:`, error);
      throw error;
    }
  }

  /**
   * Create FoodFlow order from WhatsApp order request
   */
  async createFoodFlowOrder(whatsappOrderRequest: WhatsAppOrderRequest): Promise<{ orderId: string; status: string }> {
    try {
      console.log(`[WhatsApp Order] Creating FoodFlow order...`);

      const tenant = await storage.getTenant(whatsappOrderRequest.tenant_id);
      if (!tenant) {
        throw new Error(`Tenant not found: ${whatsappOrderRequest.tenant_id}`);
      }

      // Get all products to map names to IDs
      const allProducts = await storage.getProductsByTenant(whatsappOrderRequest.tenant_id);
      
      // Calculate totals
      const subtotal = whatsappOrderRequest.items.reduce((sum, item) => {
        return sum + ((item.price || 0) * item.quantity);
      }, 0);

      const deliveryFee = parseFloat((tenant.deliveryFeeCustomer || '0').toString());
      const total = subtotal + deliveryFee;

      // Create order
      const orderData = {
        tenantId: whatsappOrderRequest.tenant_id,
        customerId: undefined,
        customerName: 'WhatsApp Customer',
        customerPhone: whatsappOrderRequest.phone_number,
        customerEmail: undefined,
        deliveryAddress: whatsappOrderRequest.address || 'WhatsApp',
        addressReference: whatsappOrderRequest.reference,
        status: 'pending' as const,
        subtotal: subtotal.toString(),
        deliveryFee: deliveryFee.toString(),
        total: total.toString(),
        paymentMethod: 'cash',
        deliveryType: 'delivery'
      };

      // Map items to products with valid IDs
      const itemsData = whatsappOrderRequest.items.map(item => {
        // Find product by name (case-insensitive)
        const product = allProducts.find(p => 
          p.name.toLowerCase() === item.name.toLowerCase()
        );
        
        return {
          orderId: '', // Will be set after order creation
          productId: product?.id || '', // Use real product ID
          name: item.name, // Product name for order_items.name
          quantity: item.quantity,
          price: (item.price || 0).toString(),
          notes: ''
        };
      });

      // Save order to FoodFlow
      const result = await storage.createOrderWithTransaction(
        orderData as any,
        undefined,
        itemsData as any
      );

      console.log(`[WhatsApp Order] Order created: ${result.order.id}`);
      return {
        orderId: result.order.id,
        status: result.order.status
      };
    } catch (error) {
      console.error(`[WhatsApp Order] Error creating order:`, error);
      throw error;
    }
  }

  /**
   * Get order status for customer
   */
  async getCustomerOrderStatus(phoneNumber: string, tenantId: string): Promise<any> {
    try {
      console.log(`[WhatsApp Status] Fetching order status for ${phoneNumber}...`);

      if (!this.supabaseService) {
        console.error(`[WhatsApp Status] Supabase service not initialized`);
        return null;
      }

      const orders = await this.supabaseService.getOrdersByPhone(phoneNumber, tenantId);

      if (orders.length === 0) {
        return null;
      }

      // Get most recent order
      const latestOrder = orders[0];

      if (latestOrder.foodflow_order_id) {
        // Get full order details from FoodFlow
        const fullOrder = await storage.getOrder(latestOrder.foodflow_order_id);
        return {
          id: fullOrder?.id,
          status: fullOrder?.status,
          total: fullOrder?.total,
          items: latestOrder.order_json.items,
          estimatedDelivery: new Date(new Date().getTime() + 45 * 60000) // 45 mins estimate
        };
      }

      return {
        id: latestOrder.id,
        status: latestOrder.status,
        items: latestOrder.order_json.items
      };
    } catch (error) {
      console.error(`[WhatsApp Status] Error fetching status:`, error);
      return null;
    }
  }

  /**
   * Initialize N8N workflow for WhatsApp agent
   */
  /**
   * Send order status update notification
   */
  async sendOrderStatusUpdate(order: any, previousStatus: string, newStatus: string, customerPhone: string, tenantName: string): Promise<void> {
    try {
      const statusMessages: Record<string, string> = {
        pending: "Seu pedido foi recebido!",
        preparing: "Estamos preparando seu pedido!",
        ready: "Seu pedido está pronto!",
        delivering: "Saiu para entrega!",
        delivered: "Pedido entregue!",
        cancelled: "Pedido cancelado"
      };

      const message = `*${tenantName}*\n\n` +
        `Status do seu pedido #${order.id}:\n` +
        `${statusMessages[newStatus] || `Status: ${newStatus}`}\n\n` +
        `Total: R$ ${parseFloat(order.total || 0).toFixed(2)}\n` +
        `Endereço: ${order.deliveryAddress || 'Retirada'}`;

      console.log(`[WhatsApp Status Update] Enviando para ${customerPhone}: ${newStatus}`);
      console.log(`[WhatsApp Message]\n${message}`);
    } catch (error) {
      console.error(`[WhatsApp Status Update] Error:`, error);
    }
  }

  async initializeN8NWorkflow(): Promise<boolean> {
    try {
      if (!this.n8nClient) {
        console.warn(`[WhatsApp Init] N8N client not available`);
        return false;
      }

      console.log(`[WhatsApp Init] Initializing N8N workflow...`);

      // Check if workflow exists
      const existing = await this.n8nClient.getWorkflowByName('FoodFlow WhatsApp Agent');
      if (existing) {
        console.log(`[WhatsApp Init] Workflow already exists: ${existing.id}`);
        return true;
      }

      console.log(`[WhatsApp Init] Workflow will be created on first deployment`);
      return true;
    } catch (error) {
      console.error(`[WhatsApp Init] Error initializing workflow:`, error);
      return false;
    }
  }
}

/**
 * Initialize WhatsApp Integration Service
 */
export function initializeWhatsAppIntegrationService(): WhatsAppIntegrationService {
  const n8nClient = initializeN8NClient();
  const supabaseService = initializeSupabaseService();

  const service = new WhatsAppIntegrationService(n8nClient, supabaseService);

  // Async init
  service.initializeN8NWorkflow().catch(error => {
    console.error(`[WhatsApp Init] Error:`, error);
  });

  return service;
}
