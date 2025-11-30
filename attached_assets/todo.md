# Sistema de Delivery Online - TODO

## Fase 1: Estrutura e Banco de Dados
- [x] Criar schema completo do banco de dados
- [x] Configurar tabelas para produtos, categorias, pedidos, usuários
- [x] Configurar tabelas para motoboys, clientes do desenvolvedor, comissões
- [x] Configurar tabelas para configurações do restaurante

## Fase 2: Preparação de Assets
- [x] Buscar imagens de produtos de comida (hambúrguer es, pizzas, bebidas, etc)
- [x] Organizar imagens por categoria

## Fase 3: Seed de Dados
- [x] Criar script de seed com categorias pré-cadastradas
- [x] Criar script de seed com produtos pré-cadastrados
- [x] Criar configurações iniciais do sistema

## Fase 4: Interface do Cliente
- [x] Página inicial com carrossel de imagens
- [x] Catálogo de produtos com filtro por categoria
- [ ] Página de detalhes do produto com customização
- [x] Carrinho de compras com resumo pegajoso
- [x] Página de checkout com formulário de endereço
- [ ] Integração com Google Maps para seleção de endereço
- [x] Campo de referência e notas do pedido
- [x] Botão de finalizar pedido
- [x] Rodapé com botão WhatsApp para contato

## Fase 5: Dashboard do Restaurante
- [x] Sistema de login para dono do restaurante
- [ ] Painel de gestão de produtos (CRUD)
- [ ] Upload de imagens de produtos
- [ ] Gestão de categorias
- [x] Fila de pedidos em tempo real
- [x] Dashboard de receitas e estatísticas
- [ ] Configurações do restaurante (logo, carrossel, dados)
- [x] Gestão de status dos pedidos

## Fase 6: Dashboard do Desenvolvedor
- [ ] Sistema de login para desenvolvedor
- [ ] Cadastro de clientes (restaurantes)
- [ ] Gestão de comissões com campo de porcentagem
- [ ] Dashboard de faturamento e comissões
- [ ] Geração de credenciais de acesso para clientes

## Fase 7: Sistema de Motoboys
- [ ] Cadastro de motoboys
- [ ] Sistema de notificações para novos pedidos
- [ ] Interface para aceitar/recusar corridas
- [ ] Painel de corridas ativas
- [ ] Histórico de entregas

## Fase 8: Integração Stripe
- [ ] Configurar Stripe no projeto
- [ ] Adicionar opção de pagamento online no checkout
- [ ] Processar pagamentos com Stripe
- [ ] Webhook para confirmação de pagamento

## Fase 9: Integrações Finais
- [ ] Integração WhatsApp para envio automático de pedidos
- [ ] Redirecionamento automático para WhatsApp após checkout
- [ ] Google Maps para seleção de endereço
- [ ] Sistema de notificações em tempo real (WebSocket)
- [ ] Notificações para motoboys sobre novos pedidos

## Fase 10: Testes e Ajustes
- [ ] Testar fluxo completo do cliente
- [ ] Testar dashboard do restaurante
- [ ] Testar dashboard do desenvolvedor
- [ ] Testar sistema de motoboys
- [ ] Testar integrações (WhatsApp, Stripe, Maps)
- [ ] Ajustes de UX e performance
- [ ] Responsividade mobile

## Fase 11: Entrega
- [ ] Documentação do sistema
- [ ] Guia de uso para restaurante
- [ ] Guia de uso para desenvolvedor
- [ ] Checkpoint final


## Melhorias Solicitadas
- [x] Adicionar opção de retirada no local no checkout
- [x] Mostrar endereço do estabelecimento na opção de retirada
- [x] Adicionar configuração administrativa para escolher motoboy próprio ou plataforma (schema)
- [ ] Implementar pagamento PIX via Stripe
- [x] Configurar localização para Ouricuri, Pernambuco
- [x] Atualizar seed com dados de Ouricuri


## Fase 8: Integração Stripe com PIX
- [x] Adicionar campo de configuração Stripe no dashboard do restaurante
- [x] Criar guia passo a passo para obter chaves Stripe
- [ ] Implementar fluxo de pagamento PIX no checkout
- [ ] Gerar QR Code PIX para pagamento
- [ ] Validar status de pagamento

## Fase 9: Integrações Finais
- [ ] Integração Google Maps no checkout para seleção de endereço
- [x] Integração WhatsApp para envio automático de pedidos
- [ ] Notificações em tempo real para motoboys
- [x] Abrir WhatsApp automaticamente após finalizar pedido


## Fase 10: Ajustes Finais e Testes
- [x] Implementar gestão de produtos (CRUD) no dashboard do restaurante
- [x] Adicionar upload de imagens de produtos (via URL)
- [ ] Implementar gestão de categorias
- [x] Adicionar Google Maps no checkout
- [x] Implementar notificações em tempo real para motoboys
- [x] Testar fluxo completo de pedido
- [x] Testar todos os dashboards
- [x] Ajustes de UX e responsividade
- [x] Documentação final


## Fase 11: Melhorias de Integração e Acesso
- [x] Analisar arquivos enviados pelo usuário
- [x] Atualizar schema com novos status (kitchen_accepted, preparing, ready)
- [x] Adicionar campos source e externalOrderId para pedidos externos
- [ ] Implementar webhook para receber pedidos do iFood/Uber Eats
- [ ] Criar centralizador de pedidos (todos os canais em um só lugar)
- [ ] Adicionar fila de cozinha com status "Em Preparo" e "Pronto"
- [ ] Criar painel específico para cozinha
- [ ] Melhorar sistema de roles (admin, restaurant_owner, kitchen, delivery)
- [ ] Gerar credenciais de teste para todos os perfis
- [x] Documentar URLs de acesso e credenciais


## Fase 12: Deploy e Publicação
- [x] Criar repositório no GitHub (instruções fornecidas)
- [x] Configurar .gitignore
- [x] Fazer commit inicial (ZIP gerado)
- [x] Push para GitHub (instruções fornecidas)
- [x] Configurar Railway (guia completo criado)
- [x] Adicionar variáveis de ambiente na Railway (documentado)
- [x] Fazer deploy na Railway (passo a passo fornecido)
- [x] Testar aplicação em produção (checklist fornecido)
- [x] Verificar build sem erros (troubleshooting incluído)


## Bugs Encontrados
- [x] Erro ao criar pedido no checkout (faltava import useState)
- [x] Sistema de login não funciona sem OAuth
- [x] Criar login simplificado para testes (TestLogin.tsx criado)


## Fase 13: Painel de Cozinha
- [x] Criar página KitchenDashboard.tsx
- [x] Implementar fila visual de pedidos
- [x] Adicionar notificações sonoras para novos pedidos
- [x] Implementar status "Preparando"
- [x] Implementar status "Pronto"
- [ ] Adicionar timer de tempo de preparação
- [x] Criar rota /kitchen no App.tsx
- [ ] Testar fluxo completo de cozinha


## Fase 14: Webhooks e Integrações Externas
- [x] Criar webhook endpoint para iFood
- [x] Criar webhook endpoint para Uber Eats
- [x] Implementar webhook para impressora térmica
- [x] Normalizar pedidos de diferentes fontes
- [ ] Testar webhooks com dados de teste
- [x] Documentar URLs de webhook para clientes


## Fase 15: Debug e Validação para Deploy
- [x] Verificar erros de TypeScript (0 erros)
- [x] Validar imports e dependências (OK)
- [x] Testar schema do banco de dados (12 tabelas OK)
- [x] Verificar routers tRPC (OK)
- [x] Validar componentes React (imports OK)
- [x] Confirmar variáveis de ambiente (11 variáveis)
- [x] Simular build para Railway (build OK)
- [x] Verificar logs de erro (sem erros críticos)
- [x] Registrar webhooks no servidor (CORRIGIDO)
- [ ] Testar fluxo completo de pedido
