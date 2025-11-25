import { N8NClient } from '../server/n8n-api';

async function createFoodFlowWorkflow() {
  const hostUrl = process.env.N8N_HOST;
  const apiKey = process.env.N8N_API_KEY;

  if (!hostUrl || !apiKey) {
    console.error('[ERROR] N8N_HOST or N8N_API_KEY not set');
    process.exit(1);
  }

  const client = new N8NClient(hostUrl, apiKey);

  try {
    console.log('[STEP 1] Lendo workflow original da pizzaria...\n');
    
    const workflows = await client.getWorkflows();
    const pizzariaWorkflow = workflows.find((w: any) => 
      w.name.toLowerCase().includes('pizzaria')
    );

    if (!pizzariaWorkflow) {
      console.error('❌ Workflow pizzaria não encontrado');
      process.exit(1);
    }

    const original = await client.getWorkflow(pizzariaWorkflow.id);
    
    console.log(`✅ Workflow lido: ${original.name}`);
    console.log(`   Nodes: ${original.nodes?.length || 0}`);
    console.log(`   Connections: ${Object.keys(original.connections || {}).length}`);
    
    // Extract Supabase tools
    const supabaseTools = original.nodes?.filter((n: any) => 
      n.type === 'n8n-nodes-base.supabaseTool'
    ) || [];
    
    console.log(`\n[STEP 2] Supabase Tools encontrados: ${supabaseTools.length}`);
    supabaseTools.forEach((tool: any) => {
      const resource = tool.parameters?.operation?.split('_')[0] || 'unknown';
      console.log(`   - ${tool.name} (${resource})`);
    });

    // Extract agents and models
    const agents = original.nodes?.filter((n: any) => 
      n.type === '@n8n/n8n-nodes-langchain.agent'
    ) || [];
    
    const models = original.nodes?.filter((n: any) => 
      n.type?.includes('ChatModel') || n.type?.includes('lmChat')
    ) || [];
    
    console.log(`\n[STEP 3] LLM Models encontrados: ${models.length}`);
    models.forEach((model: any) => {
      console.log(`   - ${model.name}`);
    });

    console.log(`\n[STEP 4] Resumo da arquitetura:`);
    console.log(`   - WhatsApp Trigger: ${original.nodes?.find((n: any) => n.type === 'n8n-nodes-base.whatsAppTrigger') ? '✅' : '❌'}`);
    console.log(`   - Agentes: ${agents.length}`);
    console.log(`   - Memory Buffers: ${original.nodes?.filter((n: any) => n.type?.includes('memory')).length || 0}`);
    console.log(`   - Supabase Tools: ${supabaseTools.length}`);
    console.log(`   - HTTP Requests: ${original.nodes?.filter((n: any) => n.type === 'n8n-nodes-base.httpRequest').length || 0}`);
    console.log(`   - Webhooks: ${original.nodes?.filter((n: any) => n.type === 'n8n-nodes-base.webhook').length || 0}`);

    console.log('\n✅ Análise concluída! Agora vou adaptar para FoodFlow...\n');

  } catch (error) {
    console.error('[ERROR]', error);
    process.exit(1);
  }
}

createFoodFlowWorkflow();
