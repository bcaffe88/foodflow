import axios from 'axios';

const N8N_HOST = (process.env.N8N_HOST || '').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY || '';

async function listWorkflows() {
  try {
    const url = `${N8N_HOST}/api/v1/workflows`;
    const response = await axios.get(url, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
      timeout: 15000
    });

    console.log('📋 Workflows no N8N:\n');
    
    const workflows = response.data.data || response.data;
    Array.isArray(workflows) ? workflows : [workflows];
    
    if (Array.isArray(workflows)) {
      workflows.forEach((w: any, i: number) => {
        console.log(`${i + 1}. ${w.name}`);
        console.log(`   ID: ${w.id}`);
        console.log(`   Ativo: ${w.active ? 'Sim ✅' : 'Não'}`);
        console.log(`   Nodes: ${w.nodes?.length || 'N/A'}`);
        console.log();
      });
    } else {
      console.log(JSON.stringify(workflows, null, 2));
    }

  } catch (error: any) {
    console.error('Erro:', error.message);
  }
}

listWorkflows();
