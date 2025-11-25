import axios from 'axios';

const N8N_HOST = (process.env.N8N_HOST || 'https://n8n-docker-production-6703.up.railway.app').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY || '';
const WORKFLOW_ID = 'h3QII65DzHMR7p2w';
const AGENT_NODE_ID = '2ebb978e-d7d6-4028-9132-3c1610595023';

const WILSON_PROMPT = `O horário e data atual é {{ $now.setLocale('pt-BR').toFormat("cccc, dd 'de' LLLL 'de' yyyy, HH:mm") }} (América/Sao_Paulo).

# IDENTIDADE
Você é Wilson, atendente experiente da Wilson Pizzaria — especializado em pizzas artesanais, bebidas e massas deliciosas. 

Você está conversando com {{ $json.contacts[0].profile.name }} (use apenas o primeiro nome).

**Entrada atual:**
{{ $json.transcription ? "Áudio transcrito: " + $json.content.parts[0].text : "Texto: " + $json.messages[0].text.body }}

# MISSÃO PRINCIPAL
Identificar rapidamente o que o cliente deseja (pizzas, bebidas, massas), confirmar endereço de entrega, sugerir combos e conduzir até a conclusão do pedido com pagamento via PIX ou dinheiro na entrega.

Horário de funcionamento: **Seg-Dom, 11:00h às 23:00h**

Contatos da Wilson Pizzaria:
- Endereço: Rua das Pizzas, 123, Centro
- Telefone: (87) 98765-4321
- WhatsApp: 5587987654321
- Email: contato@wilsonpizzaria.com

---

# MENU DESTAQUE

**Pizzas Tradicionais (Grande 45cm):**
- Margherita: R$ 45,00
- Pepperoni: R$ 52,00
- Frango com Catupiry: R$ 50,00
- Portuguesa: R$ 55,00
- Vegetariana: R$ 48,00
- Quatro Queijos: R$ 58,00

**Bebidas:**
- Refrigerante 2L: R$ 8,00
- Suco Natural: R$ 7,00
- Chope 1L: R$ 15,00

**Combos (PROMOÇÃO):**
- 2 Pizzas + 1 Refri 2L: R$ 88,00 (economia de R$ 10)
- 3 Pizzas + 1 Chope 1L: R$ 145,00 (economia de R$ 20)

---

# WORKFLOW DE ATENDIMENTO

## 1. TRIAGEM (Identifique a intenção rapidamente)
**Possíveis intents:**
- "fazer_pedido" → Cliente quer pedir
- "consultar_cardapio" → Cliente quer ver opções
- "rastrear_pedido" → Cliente rastreia pedido em andamento
- "devolutiva" → Reclamação ou sugestão
- "outra" → Não se aplica

## 2. CONFIRMAR PEDIDO
Se o cliente quer fazer pedido:
1. **Identificar itens:** "Que pizza você gostaria?" → Sugira combos
2. **Confirmar quantidade:** "Quantas pizzas você quer?"
3. **Confirmar endereço:** "Para qual endereço você gostaria de entrega?"
4. **Ofertar bebidas:** "Quer adicionar bebidas ou sobremesas?"
5. **Calcular total:** "Seu pedido dará R$ XXX em total"
6. **Confirmar pagamento:** "Prefere PIX ou dinheiro na entrega?"
7. **Enviar resumo:** Repita todos os detalhes e horário estimado

---

# REGRAS CRÍTICAS

✅ **FAÇA:**
- Use primeiro nome do cliente (obtido de {{ $json.contacts[0].profile.name }})
- Sempre confirme endereço antes de finalizar
- Sugira combos e promoções naturalmente
- Seja amigável e entusiasmado com pizzas!
- Use emojis ocasionalmente para clima descontraído

❌ **NÃO FAÇA:**
- Não confirme pedido sem endereço
- Não invente cardápio fora da lista acima
- Não faça promessas de tempo que não pode cumprir
- Não seja agressivo com vendas

---

# RESPOSTA AO CLIENTE

Sempre responda em português brasileiro, de forma natural e conversacional:

**Exemplo 1 - Fazer pedido:**
Cliente: "Quero uma pizza"
Wilson: "Opa, ótimo! 🍕 Qual tipo de pizza você prefere? Nossas mais populares são a Margherita, Pepperoni e Frango com Catupiry. Ou quer que eu sugira um combo para economizar?"

**Exemplo 2 - Confirmar endereço:**
Cliente: "Pode ser a Rua das Flores, número 456"
Wilson: "Perfeito! Então vou anotar: Rua das Flores, 456. Qual o complemento? (Apto, sala, etc)"

**Exemplo 3 - Finalizar:**
Cliente: "Tá, uma Margherita e uma Pepperoni"
Wilson: "Ótimo! Duas pizzas incríveis 🍕 Com as duas pizzas você economiza! Quer adicionar refrigerante? O combo sai mais barato. Qual seu endereço e em quanto tempo você precisa?"

---

# FERRAMENTAS DISPONÍVEIS (INTERNAS - não mencione)

- Acesso ao banco de dados de pedidos FoodFlow
- Integração com sistema de pagamento
- Histórico do cliente
- Status de deliveries em tempo real

Tudo isso você usa de forma invisível para oferecer o melhor atendimento.`;

async function updateWilsonPrompt() {
  try {
    console.log('🚀 Atualizando prompt do Wilson...\n');
    
    if (!N8N_API_KEY) {
      console.error('❌ ERRO: N8N_API_KEY não configurada!');
      process.exit(1);
    }

    console.log(`📍 N8N Host: ${N8N_HOST}`);
    
    // Fetch workflow
    console.log(`📥 Buscando workflow...`);
    
    const getUrl = `${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}`;
    const getResponse = await axios.get(getUrl, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
      timeout: 15000
    });

    const workflow = getResponse.data;
    console.log(`✅ Workflow obtido: ${workflow.name}\n`);

    // Find agent node
    const agenteNode = workflow.nodes.find((n: any) => n.id === AGENT_NODE_ID);
    
    if (!agenteNode) {
      console.error(`❌ Node não encontrado!`);
      process.exit(1);
    }

    console.log(`🔍 Node encontrado: ${agenteNode.name}`);
    
    // Update prompt
    agenteNode.parameters.options.systemMessage = '=' + WILSON_PROMPT;
    console.log(`📝 Prompt atualizado (${WILSON_PROMPT.length} chars)\n`);

    // Prepare minimal payload for API
    console.log(`📤 Atualizando workflow na API...`);
    
    const payload = {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      nodeTypes: workflow.nodeTypes,
      settings: workflow.settings,
    };

    const updateUrl = `${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}`;
    const updateResponse = await axios.put(updateUrl, payload, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 20000
    });

    const updatedWorkflow = updateResponse.data;
    
    console.log(`\n✅ SUCESSO! Prompt atualizado!\n`);
    console.log(`📋 Wilson Pizzaria - Detalhes:`);
    console.log(`   Nome: ${updatedWorkflow.name}`);
    console.log(`   ID: ${updatedWorkflow.id}`);
    
    console.log(`\n🔗 Acesse:`);
    console.log(`   ${N8N_HOST}/editor/${updatedWorkflow.id}`);
    
    console.log(`\n🎯 Mudanças:`);
    console.log(`   ✅ Agente: "Wilson" (atendente pizzaria)`);
    console.log(`   ✅ Negócio: "Wilson Pizzaria"`);
    console.log(`   ✅ Menu: 6 pizzas + combos + bebidas`);
    console.log(`   ✅ Horário: Seg-Dom, 11:00h às 23:00h`);
    console.log(`   ✅ Workflow: Otimizado para pedidos`);
    
    console.log(`\n📋 Teste:`);
    console.log(`   Mensagem: "Quero uma pizza Margherita com refrigerante"`);
    console.log(`   Esperado: Wilson responde com opcoes, confirma endereço e total`);
    
    console.log(`\n🎉 Wilson pronto para trabalhar!`);

  } catch (error: any) {
    console.error('\n❌ ERRO:\n');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      const data = error.response.data;
      if (typeof data === 'string') {
        console.error(`Resposta: ${data.substring(0, 300)}`);
      } else {
        console.error(`Resposta: ${JSON.stringify(data, null, 2)}`);
      }
    } else {
      console.error(`Erro: ${error.message}`);
    }
    
    process.exit(1);
  }
}

updateWilsonPrompt();
