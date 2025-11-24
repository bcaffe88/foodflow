# 🚀 FoodFlow - Deploy Railway & GitHub

Plataforma Multi-Tenant de Delivery (Clone iFood) pronta para deploy no Railway.

## 📋 Pré-requisitos

- [GitHub Account](https://github.com)
- [Railway Account](https://railway.app)
- Node.js 18+ (local)

## 🎯 Quick Setup

### 1️⃣ Criar Repositório GitHub

```bash
# Clone este projeto
git clone https://github.com/seu-usuario/foodflow.git
cd foodflow

# Crie um repositório VAZIO em: https://github.com/new
# Nome: foodflow
# Deixe vazio (sem README, .gitignore, license)

# Configure origin
git remote remove origin
git remote add origin https://github.com/seu-usuario/foodflow.git
git branch -M main
git push -u origin main
```

### 2️⃣ Setup Railway

#### Opção A: Deploy via GitHub (Recomendado)

1. Vá para [railway.app](https://railway.app)
2. Clique **"New Project"** → **"Deploy from GitHub Repo"**
3. Autorize Railway a acessar GitHub
4. Selecione: `seu-usuario/foodflow`
5. Railway fará deploy automático! ✅

#### Opção B: Deploy via CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link projeto
railway link

# Deploy
railway up
```

### 3️⃣ Configurar Variáveis de Ambiente

No dashboard Railway:

1. Vá para **Settings** → **Environment Variables**
2. Copie conteúdo de `.env.example`
3. Preencha valores reais:

```
# Exemplo de valores para Railway
DATABASE_URL=postgresql://...      # Railway PostgreSQL
JWT_SECRET=sua-chave-segura-aqui
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLIC_KEY=pk_live_xxx
N8N_HOST=https://seu-n8n.railway.app
SUPABASE_URL=https://seu-project.supabase.co
SUPABASE_KEY=seu-token-aqui
GOOGLE_MAPS_API_KEY=sua-chave-aqui
NODE_ENV=production
```

### 4️⃣ Adicionar PostgreSQL (Railway)

1. Dashboard Railway → **New Service**
2. Selecione **PostgreSQL**
3. Railway linkará automaticamente `DATABASE_URL`

### 5️⃣ Build & Deploy

Railway fará automaticamente:

```bash
npm install          # Instala dependências
npm run build        # Build production
npm run db:push      # Migra database
npm run start        # Inicia servidor
```

## 🎯 Estrutura do Projeto

```
foodflow/
├── client/              # React Frontend
│   └── src/
│       ├── pages/       # Páginas (Customer, Restaurant, Driver, Admin)
│       ├── components/  # Componentes reutilizáveis
│       └── App.tsx      # Router principal
├── server/              # Express Backend
│   ├── routes.ts        # Endpoints API
│   ├── storage.ts       # Data persistence
│   ├── auth/            # JWT Authentication
│   ├── payment/         # Stripe integration
│   ├── n8n-api.ts       # N8N webhook integration
│   └── index.ts         # Server entry point
├── shared/
│   └── schema.ts        # Zod schemas (shared types)
├── railway.json         # Railway config
├── Procfile             # Process file for Railway
├── package.json         # Dependencies
└── README.md            # Documentação
```

## 🔌 Integrações Externas

### WhatsApp + N8N
- N8N processa mensagens via webhook
- Cria pedidos automaticamente via LLM agent
- [Documentação N8N](https://seu-n8n.railway.app)

### Google Maps
- Geocoding de endereços
- Cálculo de distância (com Haversine fallback)
- ETA estimado

### Stripe
- Pagamentos via cartão
- Webhooks para confirmação
- [Dashboard Stripe](https://dashboard.stripe.com)

### Supabase
- Armazenamento de memories WhatsApp
- Fallback em memória

## 📦 Deploy Automático

Railway faz redeploy automaticamente quando você:

```bash
git push origin main
```

Você pode acompanhar em:
- Dashboard Railway → **Deployments** → Logs em tempo real

## 🐛 Troubleshooting

### Build falha
```
Erro: "npm ERR! code ERESOLVE"
→ Railway pode estar em Node 16. Configure em Settings:
  Engine: Node.js 18+
```

### Database connection erro
```
Erro: "ECONNREFUSED"
→ Adicione PostgreSQL service em Railway
→ Aguarde 1-2 min para linkagem automática
```

### Variáveis de ambiente não funcionam
```
→ Clique "Redeploy" no dashboard Railway
→ Aguarde 2-3 min
```

### N8N webhook não funciona
```
→ Configure URL do webhook em N8N:
  https://seu-app.railway.app/api/whatsapp/webhook
→ Teste via: POST /api/whatsapp/webhook (no Postman)
```

## 🚀 Próximos Passos

1. ✅ Deploy no Railway
2. ✅ Configurar integrações (Stripe, N8N, Google Maps)
3. ✅ Testar fluxo completo (WhatsApp → Pedido)
4. ✅ Configurar domínio customizado
5. ✅ Monitorar logs e performance

## 📞 Suporte

- [Railway Docs](https://docs.railway.app)
- [FoodFlow GitHub Issues](https://github.com/seu-usuario/foodflow/issues)

---

**Última Atualização:** 23 Novembro 2025  
**Status:** 🟢 Pronto para Production
