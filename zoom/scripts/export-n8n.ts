import { N8NClient } from '../server/n8n-api';
import * as fs from 'fs';

async function exportWorkflow() {
  const hostUrl = process.env.N8N_HOST;
  const apiKey = process.env.N8N_API_KEY;

  if (!hostUrl || !apiKey) {
    console.error('[ERROR] N8N_HOST or N8N_API_KEY not set');
    process.exit(1);
  }

  const client = new N8NClient(hostUrl, apiKey);

  try {
    // Find and export pizzaria workflow
    const workflows = await client.getWorkflows();
    const pizzariaWorkflow = workflows.find((w: any) => 
      w.name.toLowerCase().includes('pizzaria')
    );

    if (!pizzariaWorkflow) {
      console.error('❌ Workflow pizzaria não encontrado');
      process.exit(1);
    }

    console.log(`✅ Exportando: ${pizzariaWorkflow.name}`);
    
    // Get full workflow
    const fullWorkflow = await client.getWorkflow(pizzariaWorkflow.id);
    
    // Save to file
    const filePath = '/tmp/workflow-pizzaria.json';
    fs.writeFileSync(filePath, JSON.stringify(fullWorkflow, null, 2));
    
    console.log(`✅ Salvo em: ${filePath}`);
    console.log(`\n📊 Resumo:`);
    console.log(`   - Nodes: ${fullWorkflow.nodes?.length || 0}`);
    console.log(`   - Connections: ${Object.keys(fullWorkflow.connections || {}).length}`);
    
    if (fullWorkflow.nodes) {
      console.log(`\n📦 Nodes encontrados:`);
      fullWorkflow.nodes.forEach((node: any) => {
        console.log(`   - ${node.name} (${node.type})`);
      });
    }

  } catch (error) {
    console.error('[ERROR]', error);
    process.exit(1);
  }
}

exportWorkflow();
