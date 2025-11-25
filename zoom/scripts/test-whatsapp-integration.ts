import axios from 'axios';

async function testIntegration() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('\n🧪 TESTE DE INTEGRAÇÃO WHATSAPP + N8N + SUPABASE\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Health check
    console.log('\n[TEST 1] Health Check do Servidor\n');
    const healthRes = await axios.get(`${baseUrl}/api/whatsapp/health`);
    console.log(`✅ Servidor rodando: ${JSON.stringify(healthRes.data)}`);

    // Test 2: Webhook da pizzaria
    console.log('\n[TEST 2] Simular mensagem WhatsApp de cliente\n');
    
    const testMessage = {
      phoneNumber: '11987654321',
      tenantId: '550e8400-e29b-41d4-a716-446655440000', // Use tenant ID válido
      message: 'Olá! Eu gostaria de pedir uma pizza margherita para entregar em São Paulo'
    };

    console.log(`Enviando: ${JSON.stringify(testMessage, null, 2)}`);
    
    const webhookRes = await axios.post(
      `${baseUrl}/api/whatsapp/webhook`,
      testMessage,
      { timeout: 10000 }
    );
    
    console.log(`\n✅ Webhook processado:`);
    console.log(JSON.stringify(webhookRes.data, null, 2));

    // Test 3: Criar pedido
    console.log('\n[TEST 3] Criar Pedido via WhatsApp\n');
    
    const orderData = {
      phone_number: '11987654321',
      tenant_id: '550e8400-e29b-41d4-a716-446655440000',
      items: [
        { name: 'Pizza Margherita', quantity: 2, price: 45.00 },
        { name: 'Refrigerante 2L', quantity: 1, price: 15.00 }
      ],
      address: 'Rua das Flores, 123, São Paulo, SP'
    };

    console.log(`Criando pedido:`, JSON.stringify(orderData, null, 2));
    
    const orderRes = await axios.post(
      `${baseUrl}/api/whatsapp/orders`,
      orderData,
      { timeout: 10000 }
    );
    
    console.log(`\n✅ Pedido criado:`);
    console.log(JSON.stringify(orderRes.data, null, 2));

    // Test 4: Verificar status
    if (orderRes.data.orderId) {
      console.log('\n[TEST 4] Verificar Status do Pedido\n');
      
      const statusRes = await axios.get(
        `${baseUrl}/api/whatsapp/orders/status/11987654321/550e8400-e29b-41d4-a716-446655440000`
      );
      
      console.log(`✅ Status obtido:`);
      console.log(JSON.stringify(statusRes.data, null, 2));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TODOS OS TESTES PASSARAM!\n');

  } catch (error: any) {
    console.error(`\n❌ ERRO:`, error.response?.data || error.message);
    console.log('\n' + '='.repeat(60));
  }
}

testIntegration();
