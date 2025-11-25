import axios from 'axios';

const N8N_HOST = (process.env.N8N_HOST || '').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const WORKFLOW_ID = 'h3QII65DzHMR7p2w';

async function getWebhookUrl() {
  try {
    console.log('🚀 FASE 2: Configurar Webhook para Status Updates\n');
    
    if (!N8N_API_KEY || !N8N_HOST) {
      console.error('❌ Credenciais não configuradas!');
      process.exit(1);
    }

    // Fetch workflow
    console.log(`📥 Buscando workflow...`);
    const getUrl = `${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}`;
    const getResponse = await axios.get(getUrl, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
      timeout: 15000
    });

    const workflow = getResponse.data;
    console.log(`✅ Workflow: "${workflow.name}"\n`);

    // Check if webhook trigger exists
    let webhookNode = workflow.nodes.find((n: any) => 
      n.type === 'n8n-nodes-base.webhook' && 
      n.parameters.path === '/foodflow-orders'
    );

    if (webhookNode) {
      console.log(`✅ Webhook Trigger já existe!`);
      console.log(`   Node ID: ${webhookNode.id}`);
      console.log(`   Path: ${webhookNode.parameters.path}`);
    } else {
      console.log(`📝 Webhook Trigger não encontrado`);
      console.log(`   Precisa ser criado manualmente no N8N UI`);
      console.log(`   OU via outro script que cria nós`);
    }

    // Generate webhook URL that will be created
    const webhookPath = '/foodflow-orders';
    const webhookUrl = `${N8N_HOST}/webhook/${webhookPath}`;
    
    console.log(`\n🔗 URL do Webhook (quando criado):`);
    console.log(`   ${webhookUrl}`);
    
    console.log(`\n📋 INSTRUÇÕES MANUAIS (enquanto automatizo):`);
    console.log(`   1. Abra: ${N8N_HOST}/editor/${WORKFLOW_ID}`);
    console.log(`   2. Clique em "+" para adicionar nó`);
    console.log(`   3. Busque "Webhook"`);
    console.log(`   4. Selecione "Webhook" (trigger)`);
    console.log(`   5. Configure:`);
    console.log(`      - HTTP Method: POST`);
    console.log(`      - Path: /foodflow-orders`);
    console.log(`      - Authentication: None`);
    console.log(`   6. Copie a URL gerada`);
    console.log(`   7. Salve em FoodFlow → /restaurant/settings → N8N Webhook URL`);
    
    console.log(`\n✅ FASE 2: Próximo - Adicionar Stripe Payment`);

  } catch (error: any) {
    console.error('\n❌ ERRO:\n');
    console.error(error.message);
  }
}

getWebhookUrl();
