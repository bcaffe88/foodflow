# 🔐 Guia de Acesso ao Sistema de Delivery

## 📍 URLs de Acesso

### Interface do Cliente (Cardápio Online)
- **URL**: `https://3000-iyw4628dioq2imb7mb8hy-c0d7a61e.manusvm.computer/`
- **Descrição**: Página pública onde clientes fazem pedidos
- **Acesso**: Não requer login

### Dashboard do Restaurante
- **URL**: `https://3000-iyw4628dioq2imb7mb8hy-c0d7a61e.manusvm.computer/restaurant`
- **Descrição**: Painel administrativo do dono do restaurante
- **Acesso**: Requer login via Manus OAuth
- **Funcionalidades**:
  - Visualizar e gerenciar pedidos em tempo real
  - Atualizar status dos pedidos
  - Gerenciar produtos (adicionar, editar, remover)
  - Configurar Stripe, taxas de entrega e opções de motoboy
  - Ver estatísticas de vendas

### Dashboard do Desenvolvedor
- **URL**: `https://3000-iyw4628dioq2imb7mb8hy-c0d7a61e.manusvm.computer/developer`
- **Descrição**: Painel para você gerenciar múltiplos restaurantes clientes
- **Acesso**: Requer login via Manus OAuth com role "admin"
- **Funcionalidades**:
  - Cadastrar novos restaurantes clientes
  - Definir porcentagem de comissão por cliente
  - Visualizar faturamento total e comissões
  - Gerar credenciais de acesso para clientes

### Dashboard de Motoboys
- **URL**: `https://3000-iyw4628dioq2imb7mb8hy-c0d7a61e.manusvm.computer/delivery`
- **Descrição**: Painel para entregadores
- **Acesso**: Requer login via Manus OAuth
- **Funcionalidades**:
  - Cadastro de motoboy (nome, CPF, veículo, placa)
  - Ver pedidos disponíveis
  - Aceitar pedidos
  - Gerenciar entregas ativas
  - Notificações de novos pedidos (polling a cada 10s)

### Página de Configurações do Restaurante
- **URL**: `https://3000-iyw4628dioq2imb7mb8hy-c0d7a61e.manusvm.computer/restaurant/settings`
- **Descrição**: Configurações avançadas do restaurante
- **Acesso**: Requer login via Manus OAuth
- **Funcionalidades**:
  - Configurar chaves Stripe (com guia passo a passo)
  - Definir taxa de entrega
  - Definir pedido mínimo
  - Escolher entre motoboy próprio ou plataforma

### Gestão de Produtos
- **URL**: `https://3000-iyw4628dioq2imb7mb8hy-c0d7a61e.manusvm.computer/restaurant/products`
- **Descrição**: CRUD completo de produtos
- **Acesso**: Requer login via Manus OAuth
- **Funcionalidades**:
  - Adicionar novos produtos
  - Editar produtos existentes
  - Remover produtos
  - Upload de imagens via URL
  - Controlar disponibilidade (ativar/desativar)

## 🔑 Sistema de Autenticação

### Como Funciona
O sistema usa **Manus OAuth** para autenticação. Todos os usuários (restaurante, desenvolvedor, motoboys) fazem login através do mesmo sistema, mas têm permissões diferentes baseadas em:

1. **Role do usuário** (definido na tabela `users`):
   - `admin`: Desenvolvedor (você) - acesso total
   - `user`: Usuários comuns (restaurantes, motoboys)

2. **Perfil adicional** (tabelas específicas):
   - `restaurantClients`: Donos de restaurante
   - `deliveryDrivers`: Motoboys cadastrados

### Fluxo de Login

1. **Primeira vez**: Usuário clica em "Login" → Redireciona para portal Manus OAuth
2. **Autenticação**: Usuário faz login com conta Manus
3. **Callback**: Sistema recebe dados do usuário e cria registro na tabela `users`
4. **Redirecionamento**: Usuário é levado ao dashboard apropriado

### Como Criar Usuários de Teste

#### Opção 1: Usar Contas Manus Existentes
- Qualquer pessoa com conta Manus pode fazer login
- Na primeira vez, será criado automaticamente na tabela `users`
- Para tornar alguém admin, execute SQL:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'seu@email.com';
  ```

#### Opção 2: Criar Via Seed (Recomendado para Testes)
Já existem dados pré-cadastrados no sistema:
- **Restaurante**: "Sabor Express" (ID: 1) em Ouricuri-PE
- **Produtos**: 13 produtos com imagens (hambúrgueres, pizzas, bebidas, etc)
- **Categorias**: 5 categorias (Hambúrgueres, Pizzas, Bebidas, Acompanhamentos, Sobremesas)

## 📊 Estrutura de Roles e Permissões

### Admin (Desenvolvedor)
- **Quem**: Você (dono do sistema)
- **Como definir**: `UPDATE users SET role = 'admin' WHERE openId = 'SEU_OPEN_ID';`
- **Acesso**: `/developer`
- **Pode**:
  - Ver todos os restaurantes
  - Cadastrar novos restaurantes clientes
  - Definir comissões
  - Ver faturamento total

### Restaurant Owner (Dono do Restaurante)
- **Quem**: Seus clientes que usarão o cardápio
- **Como definir**: Cadastrar na tabela `restaurantClients` via dashboard do desenvolvedor
- **Acesso**: `/restaurant`, `/restaurant/settings`, `/restaurant/products`
- **Pode**:
  - Gerenciar pedidos do próprio restaurante
  - Adicionar/editar produtos
  - Configurar Stripe e taxas
  - Ver estatísticas

### Delivery Driver (Motoboy)
- **Quem**: Entregadores cadastrados
- **Como definir**: Auto-cadastro via `/delivery` (primeira vez)
- **Acesso**: `/delivery`
- **Pode**:
  - Ver pedidos disponíveis
  - Aceitar pedidos
  - Marcar como entregue

## 🚀 Próximas Implementações Necessárias

### 1. Webhook para iFood/Uber Eats
**Status**: Schema preparado, endpoint não implementado  
**O que falta**:
- Criar endpoint `/api/webhooks/ifood` e `/api/webhooks/ubereats`
- Normalizar pedidos externos para formato do sistema
- Salvar com `source` = "ifood" ou "ubereats"
- Notificar dashboard em tempo real

**Como fazer**:
```typescript
// server/routers.ts - adicionar router público
webhooks: router({
  ifood: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      // Normalizar pedido do iFood
      // Criar no banco com source="ifood"
      // Retornar sucesso
    }),
})
```

### 2. Fila de Cozinha
**Status**: Status "kitchen_accepted" e "preparing" já existem no schema  
**O que falta**:
- Criar página `/kitchen` específica para cozinheiros
- Mostrar apenas pedidos "confirmed" (aguardando cozinha)
- Botões: "Aceitar" (→ kitchen_accepted) e "Pronto" (→ ready)
- Som de notificação para novos pedidos

**Fluxo completo**:
1. Cliente faz pedido → `pending`
2. Restaurante aceita → `confirmed`
3. **Cozinha aceita** → `kitchen_accepted`
4. **Cozinha marca pronto** → `preparing` → `ready`
5. Motoboy pega → `out_for_delivery`
6. Entregue → `delivered`

### 3. Centralizador de Pedidos
**Status**: Campo `source` já existe  
**O que falta**:
- Modificar query de pedidos para mostrar todos (website + iFood + Uber Eats)
- Adicionar badge visual mostrando origem do pedido
- Filtro por origem (Todos, Site, iFood, Uber Eats)

### 4. Melhorar Sistema de Roles
**Status**: Role básico implementado  
**O que melhorar**:
- Adicionar middleware para verificar permissões
- Criar role "kitchen" para cozinheiros
- Proteger rotas sensíveis
- Implementar multi-tenancy (cada restaurante vê só seus dados)

## 📝 Comandos Úteis

### Acessar Banco de Dados
```bash
cd /home/ubuntu/delivery-system
pnpm db:studio  # Abre Drizzle Studio
```

### Aplicar Mudanças no Schema
```bash
cd /home/ubuntu/delivery-system
pnpm db:push
```

### Executar Seed Novamente
```bash
cd /home/ubuntu/delivery-system
pnpm exec tsx scripts/seed.mjs
```

### Ver Logs do Servidor
```bash
# Logs aparecem automaticamente no terminal onde o servidor está rodando
```

## 🎯 Testando o Sistema Completo

### Teste 1: Fluxo de Pedido do Cliente
1. Acesse `/` (página inicial)
2. Adicione produtos ao carrinho
3. Clique em "Finalizar Pedido"
4. Escolha "Entrega" ou "Retirar"
5. Preencha dados do cliente
6. Selecione endereço no mapa (opcional)
7. Escolha forma de pagamento
8. Clique em "Finalizar Pedido"
9. **Resultado**: Abre WhatsApp automaticamente com detalhes do pedido

### Teste 2: Dashboard do Restaurante
1. Acesse `/restaurant`
2. Faça login via Manus OAuth
3. Veja pedidos na aba "Pedidos"
4. Clique em "Confirmar" para aceitar pedido
5. Clique em "Preparar" → "Pronto" → "Enviar"
6. Veja estatísticas na aba "Dashboard"

### Teste 3: Gestão de Produtos
1. Acesse `/restaurant/products`
2. Clique em "Adicionar Produto"
3. Preencha nome, descrição, preço, categoria
4. Cole URL de imagem
5. Clique em "Salvar"
6. **Resultado**: Produto aparece no cardápio público

### Teste 4: Motoboy
1. Acesse `/delivery`
2. Faça login e cadastre-se como motoboy
3. Veja pedidos disponíveis (status "ready")
4. Clique em "Aceitar"
5. Marque como "Concluído" após entrega

## 🔧 Troubleshooting

### Problema: "Database not available"
**Solução**: Verificar se `DATABASE_URL` está configurada corretamente

### Problema: Não consigo fazer login
**Solução**: Verificar se `OAUTH_SERVER_URL` e `VITE_OAUTH_PORTAL_URL` estão corretos

### Problema: Imagens não aparecem
**Solução**: Verificar se URLs das imagens são válidas e acessíveis

### Problema: WhatsApp não abre automaticamente
**Solução**: Navegador pode bloquear popup. Permitir popups para o domínio.

## 📞 Contato para Suporte Automatizado

No rodapé do site há um botão "Falar Agora" que redireciona para WhatsApp: **87999480699**

---

**Última atualização**: 18 de Novembro de 2024  
**Versão do Sistema**: 9b4875a1
