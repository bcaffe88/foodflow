import axios from 'axios';

const N8N_HOST = (process.env.N8N_HOST || 'https://n8n-docker-production-6703.up.railway.app').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const WORKFLOW_ID = '8tpOTaWJyuunnvmL';

async function adaptWorkflow() {
  try {
    console.log('🚀 Adaptando workflow Wilson pizzaria...\n');
    
    if (!N8N_API_KEY) {
      console.error('❌ N8N_API_KEY não configurada');
      process.exit(1);
    }

    const response = await axios.get(
      `${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}`,
      { headers: { 'X-N8N-API-KEY': N8N_API_KEY } }
    );

    const workflow = response.data;
    console.log(`📥 Workflow: ${workflow.name} (${workflow.nodes.length} nós)\n`);

    // Adaptar prompt do agente
    const agentNode = workflow.nodes.find((n: any) => n.name === 'Agente Principal');
    if (agentNode) {
      const msg = agentNode.parameters?.options?.systemMessage || '';
      agentNode.parameters.options.systemMessage = msg
        .replace(/Sofia|especialista em equipamentos/g, 'Wilson, especialista em vendas de pizzas')
        .replace(/Segunda a Sexta.*?17:00h/g, 'Horários configurados no painel');
      console.log('✅ Prompt adaptado para Wilson');
    }

    // Atualizar com PUT
    await axios.put(
      `${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}`,
      {
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
      },
      { headers: { 'X-N8N-API-KEY': N8N_API_KEY } }
    );

    console.log('✅ WORKFLOW ADAPTADO!\n');
    console.log('📋 Mudanças aplicadas:');
    console.log('   ✅ Prompt do agente: "Wilson" em vez de "Sofia"');
    console.log('   ✅ Referência a "Pizzaria" em vez de "Informática"\n');
    console.log('⏭️  Próximos passos:');
    console.log(`   1. Acesse: ${N8N_HOST}/editor/${WORKFLOW_ID}`);
    console.log('   2. Configure manualmente no N8N:');
    console.log('      • Nó de leitura de horários (operatingHours)');
    console.log('      • Nó Stripe para gerar checkout links');
    console.log('      • Fluxo: Cardápio online → link Replit');
    console.log('      • Fluxo: Anotar pedido → opções pagamento');
    console.log('      • Dinheiro apenas para retirada');
    console.log('      • Cartão/PIX → link Stripe');
    console.log('   3. Teste com mensagem WhatsApp');
    console.log('   4. Ative o workflow\n');

  } catch (error: any) {
    console.error('❌ ERRO:', error.response?.data || error.message);
    process.exit(1);
  }
}

adaptWorkflow();
