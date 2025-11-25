-- 📋 SUPABASE TABLE AUDIT SCRIPT
-- Execute em: Supabase → SQL Editor
-- Objetivo: Verificar estrutura das tabelas WhatsApp Integration

-- 1. VERIFICAR SE AS TABELAS EXISTEM
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name IN (
  'whatsapp_sessions',
  'whatsapp_messages',
  'whatsapp_orders'
)
ORDER BY table_name;

-- 2. VERIFICAR COLUNAS DA TABELA: whatsapp_sessions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'whatsapp_sessions'
ORDER BY ordinal_position;

-- 3. VERIFICAR COLUNAS DA TABELA: whatsapp_messages
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'whatsapp_messages'
ORDER BY ordinal_position;

-- 4. VERIFICAR COLUNAS DA TABELA: whatsapp_orders
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'whatsapp_orders'
ORDER BY ordinal_position;

-- 5. VERIFICAR ÍNDICES
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename IN (
  'whatsapp_sessions',
  'whatsapp_messages', 
  'whatsapp_orders'
)
ORDER BY tablename, indexname;

-- 6. VERIFICAR FOREIGN KEYS
SELECT 
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu 
  ON rc.constraint_name = kcu.constraint_name
WHERE table_name IN (
  'whatsapp_sessions',
  'whatsapp_messages',
  'whatsapp_orders'
)
ORDER BY table_name;

-- 7. VERIFICAR DADOS: quantos registros existem
SELECT 
  'whatsapp_sessions' as table_name,
  COUNT(*) as record_count
FROM whatsapp_sessions
UNION ALL
SELECT 
  'whatsapp_messages' as table_name,
  COUNT(*) as record_count
FROM whatsapp_messages
UNION ALL
SELECT 
  'whatsapp_orders' as table_name,
  COUNT(*) as record_count
FROM whatsapp_orders;

-- 8. VERIFICAR COLUNAS FALTANTES (esperadas vs atuais)
WITH expected_columns AS (
  SELECT 
    'whatsapp_sessions' as table_name,
    ARRAY[
      'id', 'phone_number', 'tenant_id', 'active_order_id', 
      'session_context', 'conversation_status', 'last_activity',
      'created_at', 'updated_at'
    ] as expected
  UNION ALL
  SELECT 
    'whatsapp_messages' as table_name,
    ARRAY[
      'id', 'session_id', 'role', 'content', 'message_type',
      'tokens_used', 'confidence_score', 'timestamp', 'metadata'
    ] as expected
  UNION ALL
  SELECT 
    'whatsapp_orders' as table_name,
    ARRAY[
      'id', 'session_id', 'tenant_id', 'phone_number', 'order_json',
      'foodflow_order_id', 'n8n_workflow_execution_id', 'status',
      'parsing_confidence', 'error_message', 'created_at', 'updated_at',
      'confirmed_at', 'sent_to_foodflow_at'
    ] as expected
)
SELECT 
  ec.table_name,
  col.column_name,
  col.data_type,
  CASE 
    WHEN col.column_name IS NULL THEN '❌ FALTA'
    ELSE '✅ EXISTE'
  END as status
FROM expected_columns ec
CROSS JOIN LATERAL UNNEST(ec.expected) WITH ORDINALITY AS expected(col, ord)
LEFT JOIN information_schema.columns col
  ON col.table_name = ec.table_name
  AND col.column_name = expected.col
ORDER BY ec.table_name, expected.ord;

-- 9. SAMPLE DATA: Últimas 5 sessões
SELECT * FROM whatsapp_sessions
ORDER BY created_at DESC
LIMIT 5;

-- 10. SAMPLE DATA: Últimas 10 mensagens
SELECT 
  m.id,
  m.session_id,
  m.role,
  LEFT(m.content, 50) as content_preview,
  m.message_type,
  m.timestamp
FROM whatsapp_messages m
ORDER BY m.timestamp DESC
LIMIT 10;

-- 11. DIAGNÓSTICO: Problemas encontrados
SELECT 
  'Schema Validation Report' as report,
  CASE 
    WHEN COUNT(DISTINCT table_name) < 3 THEN '❌ TABELAS FALTAM'
    ELSE '✅ TODAS AS TABELAS EXISTEM'
  END as tables_status,
  CURRENT_TIMESTAMP as checked_at
FROM information_schema.tables
WHERE table_name IN (
  'whatsapp_sessions',
  'whatsapp_messages',
  'whatsapp_orders'
);
