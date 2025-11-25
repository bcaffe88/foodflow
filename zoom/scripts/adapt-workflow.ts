import { N8NClient } from '../server/n8n-api';
import * as fs from 'fs';

async function adaptWorkflow() {
  const hostUrl = process.env.N8N_HOST;
  const apiKey = process.env.N8N_API_KEY;

  if (!hostUrl || !apiKey) {
    console.error('[ERROR] N8N_HOST or N8N_API_KEY not set');
    process.exit(1);
  }

  const client = new N8NClient(hostUrl, apiKey);

  try {
    console.log('[STEP 1] Lendo workflow original...\n');
    
    const workflows = await client.getWorkflows();
    const original = workflows.find((w: any) => w.name.toLowerCase().includes('pizzaria'));

    if (!original) {
      console.error('❌ Workflow não encontrado');
      process.exit(1);
    }

    const originalData = await client.getWorkflow(original.id);
    console.log(`✅ Lido: ${originalData.name}`);

    // Clone workflow
    console.log('\n[STEP 2] Criando novo workflow FoodFlow...\n');
    
    // Modificar nome e desativar
    const newName = 'FoodFlow WhatsApp Agent - Pizzaria';
    
    // Criar cópia com mesmo conteúdo
    const clonedWorkflow = await client.createWorkflow(
      newName,
      originalData.nodes || [],
      originalData.connections || {}
    );

    console.log(`✅ Workflow criado: ${clonedWorkflow.name}`);
    console.log(`   ID: ${clonedWorkflow.id}`);
    console.log(`   Nodes: ${clonedWorkflow.nodes?.length || 0}`);
    
    // Adaptar Supabase tools
    console.log('\n[STEP 3] Analisando Supabase tools...\n');
    
    if (clonedWorkflow.nodes) {
      const supabaseTools = clonedWorkflow.nodes.filter((n: any) => 
        n.type === 'n8n-nodes-base.supabaseTool'
      );

      console.log(`Encontrados: ${supabaseTools.length} Supabase tools`);
      console.log('\nMapeamento necessário:');
      
      // Define mapping
      const mapping: Record<string, string> = {
        'obterClientes': 'SELECT * FROM users WHERE role = "customer"',
        'obterProdutos': 'SELECT * FROM products WHERE tenant_id = ?',
        'obterAgendamentos': 'SELECT * FROM orders WHERE user_id = ?',
        'adicionarAgendamento': 'INSERT INTO orders (...)',
        'obterLeads': 'SELECT * FROM customers WHERE is_new = true',
        'adicionarLead': 'INSERT INTO customers (...)',
        'atualizarLead': 'UPDATE customers SET ...'
      };

      Object.entries(mapping).forEach(([old, sql]) => {
        console.log(`   ${old} → ${sql.substring(0, 40)}...`);
      });
    }

    console.log('\n[STEP 4] Próximas ações:\n');
    console.log('1. Editar workflow no N8N');
    console.log('2. Adaptar Supabase tools para tabelas FoodFlow');
    console.log('3. Ativar webhook');
    console.log('4. Testar com cURL');
    
    console.log('\n✅ Workflow clonado com sucesso!');
    console.log(`\n📝 Salvar ID para próximas etapas: ${clonedWorkflow.id}`);

  } catch (error) {
    console.error('[ERROR]', error);
    process.exit(1);
  }
}

adaptWorkflow();
