-- 🚀 SUPABASE MIGRATION: ADICIONAR 9 COLUNAS FALTANTES
-- Execute isto no Supabase SQL Editor: https://app.supabase.com/
-- Path: SQL Editor → Copie este arquivo inteiro e execute

-- ═══════════════════════════════════════════════════════════════
-- FASE 1: ADICIONAR COLUNAS EM whatsapp_sessions
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS whatsapp_sessions
ADD COLUMN IF NOT EXISTS conversation_status VARCHAR(50) DEFAULT 'active' CHECK (conversation_status IN ('active', 'paused', 'closed', 'error')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ═══════════════════════════════════════════════════════════════
-- FASE 2: ADICIONAR COLUNAS EM whatsapp_messages
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS whatsapp_messages
ADD COLUMN IF NOT EXISTS tokens_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ═══════════════════════════════════════════════════════════════
-- FASE 3: ADICIONAR COLUNAS EM whatsapp_orders
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE IF EXISTS whatsapp_orders
ADD COLUMN IF NOT EXISTS n8n_workflow_execution_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS parsing_confidence FLOAT DEFAULT 0 CHECK (parsing_confidence >= 0 AND parsing_confidence <= 1),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sent_to_foodflow_at TIMESTAMP WITH TIME ZONE;

-- ═══════════════════════════════════════════════════════════════
-- FASE 4: CRIAR ÍNDICES PARA PERFORMANCE
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_sessions_active ON whatsapp_sessions(conversation_status);
CREATE INDEX IF NOT EXISTS idx_sessions_updated ON whatsapp_sessions(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_type ON whatsapp_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_confidence ON whatsapp_messages(confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status ON whatsapp_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_foodflow ON whatsapp_orders(foodflow_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_n8n ON whatsapp_orders(n8n_workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_orders_updated ON whatsapp_orders(updated_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- VERIFICAÇÃO: Confirmar que as colunas foram criadas
-- ═══════════════════════════════════════════════════════════════

-- Execute isto para verificar (retorna true se OK):
SELECT 
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_sessions' AND column_name='conversation_status') AND
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_sessions' AND column_name='updated_at') AND
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_messages' AND column_name='tokens_used') AND
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_messages' AND column_name='confidence_score') AND
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_messages' AND column_name='metadata') AND
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_orders' AND column_name='n8n_workflow_execution_id') AND
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_orders' AND column_name='parsing_confidence') AND
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_orders' AND column_name='confirmed_at') AND
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_orders' AND column_name='sent_to_foodflow_at')
AS all_columns_created;

