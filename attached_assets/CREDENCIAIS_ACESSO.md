# 🔐 Credenciais e URLs de Acesso - Sistema de Delivery Online

## 🌐 URLs Principais

### Desenvolvimento Local
- **Site Principal:** http://localhost:3000
- **Login de Teste:** http://localhost:3000/test-login
- **Checkout:** http://localhost:3000/checkout

### Após Deploy na Railway
- **Site Principal:** `https://seu-dominio.up.railway.app`
- **Login de Teste:** `https://seu-dominio.up.railway.app/test-login`
- **Checkout:** `https://seu-dominio.up.railway.app/checkout`

---

## 👥 Credenciais de Teste

### 1️⃣ **Administrador do Sistema**
**Acesso:** Dashboard do Desenvolvedor (Gerenciar clientes, comissões, faturamento)

```
Email:    admin@test.com
Senha:    admin123
URL:      /developer
Função:   Gerenciar múltiplos restaurantes clientes
```

**Funcionalidades:**
- ✅ Criar novos clientes (restaurantes)
- ✅ Definir porcentagem de comissão por cliente
- ✅ Visualizar faturamento total e por cliente
- ✅ Gerar credenciais de acesso para clientes
- ✅ Acompanhar comissões geradas

---

### 2️⃣ **Dono do Restaurante**
**Acesso:** Dashboard do Restaurante (Gerenciar pedidos, produtos, configurações)

```
Email:    restaurant@test.com
Senha:    restaurant123
URL:      /restaurant
Função:   Gerenciar cardápio, pedidos e configurações
```

**Funcionalidades:**
- ✅ Visualizar fila de pedidos em tempo real
- ✅ Aceitar/rejeitar pedidos
- ✅ Gerenciar produtos (CRUD completo)
- ✅ Configurar Stripe/PIX
- ✅ Visualizar estatísticas de vendas
- ✅ Definir taxa de entrega
- ✅ Escolher entre motoboy próprio ou plataforma
- ✅ Acompanhar receitas e pedidos

**Acesso Rápido:**
- Gerenciar Produtos: `/restaurant/products`
- Configurações: `/restaurant/settings`

---

### 3️⃣ **Cozinha**
**Acesso:** Painel de Cozinha (Aceitar pedidos e marcar como prontos)

```
Email:    kitchen@test.com
Senha:    kitchen123
URL:      /kitchen (em desenvolvimento)
Função:   Gerenciar fila de preparação
```

**Funcionalidades (Planejadas):**
- 📋 Visualizar pedidos pendentes
- ✅ Aceitar pedido para preparação
- 🔔 Notificação sonora de novo pedido
- ✅ Marcar como "Pronto para entrega"
- 📊 Tempo médio de preparação

---

### 4️⃣ **Motoboy/Entregador**
**Acesso:** Dashboard de Entregas (Aceitar corridas e acompanhar status)

```
Email:    delivery@test.com
Senha:    delivery123
URL:      /delivery
Função:   Gerenciar entregas
```

**Funcionalidades:**
- 📍 Visualizar pedidos disponíveis para entrega
- ✅ Aceitar corrida (similar ao Uber Eats)
- 🗺️ Ver localização do cliente no mapa
- 🔔 Notificações em tempo real de novos pedidos
- 📊 Histórico de entregas realizadas
- ⭐ Avaliações e ganhos

---

## 🧪 Fluxo Completo de Teste

### Passo 1: Cliente Faz Pedido
1. Acesse http://localhost:3000
2. Navegue pelo cardápio
3. Adicione produtos ao carrinho
4. Clique em "Finalizar Pedido"
5. Preencha dados (nome, telefone, endereço)
6. Escolha tipo de entrega (Delivery ou Retirada)
7. Escolha método de pagamento
8. Clique em "Confirmar Pedido"
9. Será redirecionado para WhatsApp com resumo

### Passo 2: Restaurante Recebe Pedido
1. Faça login como **restaurant@test.com** / **restaurant123**
2. Acesse `/restaurant`
3. Veja o pedido na fila
4. Clique em "Aceitar Pedido"
5. Pedido muda para "Confirmado"

### Passo 3: Cozinha Prepara
1. Faça login como **kitchen@test.com** / **kitchen123**
2. Acesse `/kitchen`
3. Veja pedido pendente
4. Clique em "Aceitar para Preparação"
5. Quando pronto, clique em "Marcar como Pronto"

### Passo 4: Motoboy Entrega
1. Faça login como **delivery@test.com** / **delivery123**
2. Acesse `/delivery`
3. Veja pedidos prontos disponíveis
4. Clique em "Aceitar Corrida"
5. Acompanhe localização no mapa
6. Marque como "Entregue"

### Passo 5: Administrador Acompanha
1. Faça login como **admin@test.com** / **admin123**
2. Acesse `/developer`
3. Veja estatísticas de faturamento
4. Acompanhe comissões geradas

---

## 🔧 Configurações Importantes

### Stripe/PIX (Opcional)
No dashboard do restaurante, acesse **Configurações** para:
- Adicionar chave pública Stripe
- Adicionar chave secreta Stripe
- Configurar webhook (se necessário)

### WhatsApp
- Número padrão: **87999480699**
- Pode ser alterado em Configurações do Restaurante

### Endereço do Restaurante
- **Rua:** Rua João Pessoa, 123
- **Cidade:** Ouricuri - PE
- **Horário:** 11:00 - 23:00 (Seg-Dom)

---

## 📊 Dashboard do Desenvolvedor

Acesse `/developer` com credenciais de admin para:

| Campo | Descrição |
|-------|-----------|
| **Clientes Ativos** | Número de restaurantes cadastrados |
| **Comissão Média** | Porcentagem média de comissão |
| **Faturamento Total** | Receita de todos os clientes |
| **Pedidos Realizados** | Total de pedidos processados |

### Gerenciar Clientes
1. Clique em "Novo Cliente"
2. Preencha dados do restaurante
3. Defina porcentagem de comissão
4. Sistema gera login/senha automaticamente
5. Envie credenciais para o cliente

---

## 🚀 Próximos Passos

### Implementações Futuras
- [ ] Painel de Cozinha completo com notificações
- [ ] Integração com iFood/Uber Eats via webhooks
- [ ] Programa de fidelidade com pontos
- [ ] Cupons de desconto
- [ ] Relatórios avançados com gráficos
- [ ] Integração com Google Analytics
- [ ] App mobile para motoboys

---

## 🆘 Troubleshooting

### Erro: "Pedido não foi criado"
**Solução:** Verifique se:
- Há produtos no carrinho
- Todos os campos obrigatórios estão preenchidos
- O restaurante está ativo

### Erro: "Não consegue acessar dashboard"
**Solução:**
- Limpe cache do navegador (Ctrl+Shift+Delete)
- Faça logout e login novamente
- Verifique se está usando a URL correta

### Notificações não chegam
**Solução:**
- Verifique se o navegador tem permissão para notificações
- Recarregue a página (F5)
- Tente em outra aba/janela

---

## 📞 Suporte

**WhatsApp:** 87999480699  
**Email:** suporte@deliverysystem.com  
**Documentação:** `/GUIA_DEPLOY_GITHUB_RAILWAY.md`

---

**Última atualização:** 21 de Novembro de 2024  
**Versão do Sistema:** 9a434082
