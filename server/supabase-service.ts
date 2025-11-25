import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface WhatsAppSession {
  id: string;
  phone_number: string;
  tenant_id: string;
  active_order_id?: string;
  session_context?: any;
  conversation_status: 'active' | 'paused' | 'closed' | 'error';
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  message_type?: 'order_request' | 'status_check' | 'support' | 'unclear';
  tokens_used: number;
  confidence_score: number;
  timestamp: string;
  metadata?: any;
}

export interface WhatsAppOrder {
  id: string;
  session_id: string;
  tenant_id: string;
  phone_number: string;
  order_json: any;
  foodflow_order_id?: string;
  n8n_workflow_execution_id?: string;
  status: 'parsed' | 'confirmed' | 'sent_to_foodflow' | 'failed';
  parsing_confidence: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  sent_to_foodflow_at?: string;
}

/**
 * Supabase Service for WhatsApp integration
 */
export class SupabaseService {
  private client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
    console.log(`[Supabase] Client initialized for: ${url}`);
  }

  /**
   * Initialize database tables
   */
  async initializeTables(): Promise<void> {
    try {
      console.log(`[Supabase] Initializing tables...`);

      // Create tables if they don't exist
      const { error: sessionError } = await this.client.rpc('create_whatsapp_sessions_table');
      if (sessionError) console.warn(`[Supabase] Sessions table already exists or error:`, sessionError);

      const { error: messageError } = await this.client.rpc('create_whatsapp_messages_table');
      if (messageError) console.warn(`[Supabase] Messages table already exists or error:`, messageError);

      const { error: orderError } = await this.client.rpc('create_whatsapp_orders_table');
      if (orderError) console.warn(`[Supabase] Orders table already exists or error:`, orderError);

      console.log(`[Supabase] Tables ready ✅`);
    } catch (error) {
      console.error(`[Supabase] Error initializing tables:`, error);
    }
  }

  /**
   * Get or create WhatsApp session (with fallback to in-memory if table doesn't exist)
   */
  async getOrCreateSession(phoneNumber: string, tenantId: string): Promise<WhatsAppSession> {
    try {
      // Try to get existing session
      const { data: existing } = await this.client
        .from('whatsapp_sessions')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('tenant_id', tenantId)
        .single();

      if (existing) {
        console.log(`[Supabase] Session found: ${phoneNumber}`);
        return existing as WhatsAppSession;
      }

      // Create new session
      console.log(`[Supabase] Creating new session for: ${phoneNumber}`);
      const now = new Date().toISOString();
      const { data: created, error } = await this.client
        .from('whatsapp_sessions')
        .insert({
          phone_number: phoneNumber,
          tenant_id: tenantId,
          session_context: {},
          conversation_status: 'active',
          last_activity: now,
          updated_at: now
        })
        .select()
        .single();

      if (error) throw error;
      console.log(`[Supabase] Session created: ${created.id}`);
      return created as WhatsAppSession;
    } catch (error) {
      // Fallback: Create in-memory session if table doesn't exist
      console.warn(`[Supabase] Fallback: Using in-memory session for ${phoneNumber}`);
      const now = new Date().toISOString();
      const inMemorySession: WhatsAppSession = {
        id: `mem-${Date.now()}`,
        phone_number: phoneNumber,
        tenant_id: tenantId,
        session_context: {},
        conversation_status: 'active',
        last_activity: now,
        created_at: now,
        updated_at: now
      };
      return inMemorySession;
    }
  }

  /**
   * Save WhatsApp message (with fallback if table doesn't exist)
   */
  async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    messageType?: string,
    tokensUsed: number = 0,
    confidenceScore: number = 1.0,
    metadata?: any
  ): Promise<WhatsAppMessage> {
    try {
      console.log(`[Supabase] Saving message for session: ${sessionId}`);
      
      const { data, error } = await this.client
        .from('whatsapp_messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          message_type: messageType,
          tokens_used: tokensUsed,
          confidence_score: confidenceScore,
          timestamp: new Date().toISOString(),
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      console.log(`[Supabase] Message saved: ${data.id}`);
      return data as WhatsAppMessage;
    } catch (error) {
      // Fallback: Create in-memory message
      console.warn(`[Supabase] Fallback: Using in-memory message storage`);
      const inMemoryMessage: WhatsAppMessage = {
        id: `mem-${Date.now()}`,
        session_id: sessionId,
        role,
        content,
        message_type: messageType,
        tokens_used: tokensUsed,
        confidence_score: confidenceScore,
        timestamp: new Date().toISOString(),
        metadata: metadata || {}
      };
      return inMemoryMessage;
    }
  }

  /**
   * Get session messages (chat history)
   */
  async getSessionMessages(sessionId: string, limit: number = 50): Promise<WhatsAppMessage[]> {
    try {
      console.log(`[Supabase] Fetching messages for session: ${sessionId}`);
      
      const { data, error } = await this.client
        .from('whatsapp_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as WhatsAppMessage[];
    } catch (error) {
      console.error(`[Supabase] Error fetching messages:`, error);
      throw error;
    }
  }

  /**
   * Save WhatsApp order
   */
  async saveOrder(
    sessionId: string,
    tenantId: string,
    phoneNumber: string,
    orderJson: any,
    parsingConfidence: number = 0.0,
    n8nExecutionId?: string
  ): Promise<WhatsAppOrder> {
    try {
      console.log(`[Supabase] Saving order for session: ${sessionId}`);
      
      const now = new Date().toISOString();
      const { data, error } = await this.client
        .from('whatsapp_orders')
        .insert({
          session_id: sessionId,
          tenant_id: tenantId,
          phone_number: phoneNumber,
          order_json: orderJson,
          status: 'parsed',
          parsing_confidence: parsingConfidence,
          n8n_workflow_execution_id: n8nExecutionId,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (error) throw error;
      console.log(`[Supabase] Order saved: ${data.id}`);
      return data as WhatsAppOrder;
    } catch (error) {
      console.error(`[Supabase] Error saving order:`, error);
      throw error;
    }
  }

  /**
   * Get active order for session
   */
  async getActiveOrder(sessionId: string): Promise<WhatsAppOrder | null> {
    try {
      console.log(`[Supabase] Fetching active order for session: ${sessionId}`);
      
      const { data, error } = await this.client
        .from('whatsapp_orders')
        .select('*')
        .eq('session_id', sessionId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      
      if (data) {
        console.log(`[Supabase] Active order found: ${data.id}`);
      } else {
        console.log(`[Supabase] No active order for session: ${sessionId}`);
      }
      
      return (data || null) as WhatsAppOrder | null;
    } catch (error) {
      console.error(`[Supabase] Error fetching active order:`, error);
      return null;
    }
  }

  /**
   * Update order with FoodFlow order ID
   */
  async linkFoodFlowOrder(whatsappOrderId: string, foodflowOrderId: string): Promise<WhatsAppOrder> {
    try {
      console.log(`[Supabase] Linking FoodFlow order: ${foodflowOrderId}`);
      
      const { data, error } = await this.client
        .from('whatsapp_orders')
        .update({
          foodflow_order_id: foodflowOrderId,
          status: 'sent_to_foodflow',
          sent_to_foodflow_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', whatsappOrderId)
        .select()
        .single();

      if (error) throw error;
      console.log(`[Supabase] Order linked: ${data.id}`);
      return data as WhatsAppOrder;
    } catch (error) {
      console.error(`[Supabase] Error linking order:`, error);
      throw error;
    }
  }

  /**
   * Confirm order from customer
   */
  async confirmOrder(whatsappOrderId: string): Promise<WhatsAppOrder> {
    try {
      console.log(`[Supabase] Confirming order: ${whatsappOrderId}`);
      
      const { data, error } = await this.client
        .from('whatsapp_orders')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', whatsappOrderId)
        .select()
        .single();

      if (error) throw error;
      console.log(`[Supabase] Order confirmed: ${data.id}`);
      return data as WhatsAppOrder;
    } catch (error) {
      console.error(`[Supabase] Error confirming order:`, error);
      throw error;
    }
  }

  /**
   * Get orders by phone number
   */
  async getOrdersByPhone(phoneNumber: string, tenantId: string): Promise<WhatsAppOrder[]> {
    try {
      console.log(`[Supabase] Fetching orders for phone: ${phoneNumber}`);
      
      const { data, error } = await this.client
        .from('whatsapp_orders')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as WhatsAppOrder[];
    } catch (error) {
      console.error(`[Supabase] Error fetching orders:`, error);
      return [];
    }
  }

  /**
   * Update session context
   */
  async updateSessionContext(sessionId: string, context: any, status?: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      const update: any = {
        session_context: context,
        last_activity: now,
        updated_at: now
      };
      
      if (status) {
        update.conversation_status = status;
      }
      
      const { error } = await this.client
        .from('whatsapp_sessions')
        .update(update)
        .eq('id', sessionId);

      if (error) throw error;
      console.log(`[Supabase] Session context updated`);
    } catch (error) {
      console.error(`[Supabase] Error updating session context:`, error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log(`[Supabase] Performing health check...`);
      const { error } = await this.client.from('whatsapp_sessions').select('count()', { count: 'exact' }).limit(1);
      const isHealthy = !error;
      console.log(`[Supabase] Health check: ${isHealthy ? '✅ OK' : '❌ FAILED'}`);
      return isHealthy;
    } catch (error) {
      console.error(`[Supabase] Health check failed:`, error);
      return false;
    }
  }
}

/**
 * Initialize Supabase Service from environment
 */
export function initializeSupabaseService(): SupabaseService | null {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn(`[Supabase] Missing credentials. SUPABASE_URL or SUPABASE_ANON_KEY not set.`);
    return null;
  }

  return new SupabaseService(url, anonKey);
}
