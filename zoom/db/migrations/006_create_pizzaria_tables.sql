-- ============================================================
-- WILSON PIZZARIA - TABELAS PARA OTIMIZAÇÃO DE TOOLS
-- Migration: 006_create_pizzaria_tables.sql
-- Data: 23 Novembro 2025
-- ============================================================

-- 1. TABELA: promotions
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL DEFAULT 'percentual',
  valor_desconto DECIMAL(10, 2),
  minimo_compra DECIMAL(10, 2),
  dias_semana TEXT[],
  horario_inicio TIME,
  horario_fim TIME,
  data_inicio DATE,
  data_fim DATE,
  max_usos INTEGER,
  usos_atuais INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotions_ativo ON promotions(ativo);
CREATE INDEX IF NOT EXISTS idx_promotions_codigo ON promotions(codigo);

-- 2. TABELA: delivery_zones
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  bairros TEXT[],
  taxa_entrega DECIMAL(10, 2) NOT NULL,
  tempo_minimo_entrega INTEGER DEFAULT 20,
  tempo_maximo_entrega INTEGER DEFAULT 45,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_ativo ON delivery_zones(ativo);

-- 3. TABELA: customer_preferences
CREATE TABLE IF NOT EXISTS customer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  sem_cebola BOOLEAN DEFAULT false,
  extra_queijo BOOLEAN DEFAULT false,
  sem_glutem BOOLEAN DEFAULT false,
  preferencias_json JSONB,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer_id ON customer_preferences(customer_id);

-- 4. TABELA: order_status_log
CREATE TABLE IF NOT EXISTS order_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  mensagem TEXT,
  dados_adicionais JSONB,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_status_log_order_id ON order_status_log(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_log_status ON order_status_log(status);

-- 5. Alterar orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'recebido';
