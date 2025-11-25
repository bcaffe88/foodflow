import { N8NClient } from '../server/n8n-api';

async function analyzeWorkflow() {
  const hostUrl = process.env.N8N_HOST;
  const apiKey = process.env.N8N_API_KEY;

  if (!hostUrl || !apiKey) {
    console.error('[ERROR] N8N_HOST or N8N_API_KEY not set');
    process.exit(1);
  }

  const client = new N8NClient(hostUrl, apiKey);

  try {
    console.log('\n[STEP 1] Buscando todos os workflows...\n');
    const workflows = await client.getWorkflows();
    
    console.log(`✅ Total de workflows: ${workflows.length}\n`);
    console.log('Workflows disponíveis:');
    workflows.forEach((w: any) => {
      console.log(`  📋 ${w.name} (ID: ${w.id}) - Ativo: ${w.active}`);
    });

    // Find pizzaria workflow
    console.log('\n[STEP 2] Procurando workflow "replit pizzaria"...\n');
    
    const pizzariaWorkflow = workflows.find((w: any) => 
      w.name.toLowerCase().includes('pizzaria') || 
      w.name.toLowerCase().includes('replit')
    );

    if (!pizzariaWorkflow) {
      console.log('❌ Workflow "pizzaria" não encontrado');
      console.log('\n💡 Disponíveis:', workflows.map((w: any) => w.name).join(', '));
      process.exit(0);
    }

    console.log(`✅ Encontrado: ${pizzariaWorkflow.name}`);
    console.log(`📍 ID: ${pizzariaWorkflow.id}`);
    console.log(`⚡ Ativo: ${pizzariaWorkflow.active}\n`);

    // Get full workflow
    const fullWorkflow = await client.getWorkflow(pizzariaWorkflow.id);
    
    console.log('[STEP 3] Estrutura do Workflow:\n');
    console.log(JSON.stringify(fullWorkflow, null, 2));
    
    // Analyze nodes
    if (fullWorkflow.nodes && fullWorkflow.nodes.length > 0) {
      console.log('\n\n[STEP 4] NODES DO WORKFLOW:\n');
      fullWorkflow.nodes.forEach((node: any) => {
        console.log(`\n📦 Node: ${node.name}`);
        console.log(`   Type: ${node.type}`);
        console.log(`   Position: [${node.position}]`);
        console.log(`   Parameters:`, JSON.stringify(node.parameters, null, 2));
      });
    }

  } catch (error) {
    console.error('[ERROR]', error);
    process.exit(1);
  }
}

analyzeWorkflow();
