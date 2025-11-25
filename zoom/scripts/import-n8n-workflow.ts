import * as fs from 'fs';
import axios from 'axios';

const N8N_HOST = (process.env.N8N_HOST || 'https://n8n-docker-production-6703.up.railway.app').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const WORKFLOW_NAME = 'Wilson pizzaria';
const WORKFLOW_FILE = './foodflow-whatsapp-workflow.json';

async function importWorkflow() {
  try {
    console.log('🚀 Iniciando importação do workflow N8N...\n');
    
    if (!N8N_API_KEY) {
      console.error('❌ ERRO: N8N_API_KEY não configurada!');
      process.exit(1);
    }

    console.log(`📍 N8N Host: ${N8N_HOST}`);
    
    if (!fs.existsSync(WORKFLOW_FILE)) {
      console.error(`❌ Arquivo não encontrado: ${WORKFLOW_FILE}`);
      process.exit(1);
    }

    const workflowContent = fs.readFileSync(WORKFLOW_FILE, 'utf-8');
    const workflowFull = JSON.parse(workflowContent);
    
    console.log(`📦 Workflow: ${workflowFull.name}`);
    console.log(`📊 Nodes: ${workflowFull.nodes?.length || 0}`);

    // Payload com apenas campos aceitos pela API
    const workflowPayload = {
      name: WORKFLOW_NAME,
      nodes: workflowFull.nodes,
      connections: workflowFull.connections,
      nodeTypes: workflowFull.nodeTypes,
      settings: workflowFull.settings,
    };

    console.log(`✏️  Renomeado: ${WORKFLOW_NAME}`);
    console.log(`📤 Enviando para N8N...\n`);
    
    const apiUrl = `${N8N_HOST}/api/v1/workflows`;
    
    const response = await axios.post(
      apiUrl,
      workflowPayload,
      {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 20000
      }
    );

    const newWorkflow = response.data;
    
    console.log(`✅ SUCESSO!\n`);
    console.log(`📋 Detalhes:`);
    console.log(`   ID: ${newWorkflow.id}`);
    console.log(`   Nome: ${newWorkflow.name}`);
    console.log(`   Nodes: ${newWorkflow.nodes?.length || 0}`);
    
    console.log(`\n🔗 Abra agora:`);
    console.log(`   ${N8N_HOST}/editor/${newWorkflow.id}`);
    
    console.log(`\n📋 Configure:`);
    console.log(`   1. Meta WhatsApp (Access Token + ID)`);
    console.log(`   2. Google Gemini API Key`);
    console.log(`   3. Teste com WhatsApp`);
    console.log(`   4. Ative o workflow`);
    
    console.log(`\n🎉 "Wilson pizzaria" criado!`);

  } catch (error: any) {
    console.error('\n❌ ERRO:\n');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      const data = error.response.data;
      if (typeof data === 'string') {
        console.error(data);
      } else {
        console.error(JSON.stringify(data, null, 2));
      }
    } else {
      console.error(error.message);
    }
    
    process.exit(1);
  }
}

importWorkflow();
