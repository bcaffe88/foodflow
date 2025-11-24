# 🚀 FoodFlow - Setup no Railway

Guia completo para fazer deploy da plataforma FoodFlow no Railway.

---

## 📋 Pré-requisitos

- ✅ Conta no [GitHub](https://github.com)
- ✅ Conta no [Railway](https://railway.app)
- ✅ Node.js 18+ instalado (local - para testes)
- ✅ Credenciais dos serviços (Stripe, N8N, Supabase, Google Maps)

---

## 🔗 Passo 1: Criar Repositório no GitHub

1. **Vá para:** https://github.com/new

2. **Preencha:**
   - Repository name: `foodflow`
   - Description: `Plataforma Multi-Tenant de Delivery - FoodFlow Clone`
   - Visibility: **Public**
   - ✅ NÃO marque "Add a README file"
   - ✅ NÃO marque "Add .gitignore"
   - ✅ NÃO marque "Add a license"

3. **Clique:** "Create repository"

4. **Copie o link SSH:** `git@github.com:SEU-USUARIO/foodflow.git`

---

## 📤 Passo 2: Fazer Push do Código

Na pasta do projeto (Replit):

```bash
# 1. Configurar git (se não estiver)
git config --global user.email "seu-email@example.com"
git config --global user.name "Seu Nome"

# 2. Remover remote antigo (se existir)
git remote remove origin

# 3. Adicionar novo remote do GitHub
git remote add origin git@github.com:SEU-USUARIO/foodflow.git

# 4. Renomear branch para main
git branch -M main

# 5. Fazer push
git push -u origin main
```

**Resultado esperado:**
```
✅ Everything up-to-date
✅ Branch 'main' set up to track 'origin/main'
```

---

## 🚂 Passo 3: Deploy no Railway

### Via GitHub (Recomendado - CI/CD Automático)

1. **Vá para:** https://railway.app/dashboard

2. **Clique:** "New Project"

3. **Selecione:** "Deploy from GitHub repo"

4. **Conecte sua conta GitHub:**
   - Autorize Railway
   - Selecione `SEU-USUARIO/foodflow`
   - Clique "Deploy"

5. **Railway fará:**
   - ✅ Build automático (npm run build)
   - ✅ Deploy da app
   - ✅ Configuração de domínio (*.railway.app)

### Via CLI (Se preferir)

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Fazer login
railway login

# 3. Criar projeto
railway init

# 4. Fazer deploy
railway up
```

---

## 🔧 Passo 4: Configurar Variáveis de Ambiente

No **Railway Dashboard:**

1. **Abra seu projeto** → **Variables**

2. **Adicione cada variável:**

### Variáveis Essenciais

```env
# Database (Railway configura automaticamente)
DATABASE_URL=${DATABASE_URL}

# JWT
JWT_SECRET=gerar-com: openssl rand -base64 32
JWT_EXPIRY=7d
SESSION_SECRET=gerar-com: openssl rand -base64 32

# N8N (OBRIGATÓRIO)
N8N_HOST=https://seu-n8n-instance.railway.app
N8N_API_KEY=sua-chave-api-n8n

# Supabase (OBRIGATÓRIO)
SUPABASE_URL=https://seu-project.supabase.co
SUPABASE_KEY=sua-chave-supabase

# Stripe (Opcional mas recomendado)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# WhatsApp (OBRIGATÓRIO se quiser WebhookS)
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_BUSINESS_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...

# Google Maps (Opcional)
GOOGLE_MAPS_API_KEY=...

# Frontend
VITE_API_URL=https://seu-dominio.railway.app
NODE_ENV=production
PORT=5000
```

### Generar JWT_SECRET Seguro

```bash
# Local (seu computador)
openssl rand -base64 32

# Output exemplo: kJ8mK9pL0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ0k=
# Cole isso em JWT_SECRET
```

---

## 🔗 Passo 5: Conectar Banco de Dados

### Opção A: PostgreSQL da Railway (Recomendado)

1. **No Dashboard do projeto:** "+ Add Service"
2. **Selecione:** "PostgreSQL"
3. **Railway auto-popula:** `DATABASE_URL`
4. ✅ Banco criado automaticamente

### Opção B: Neon Database (Recomendado)

1. **Vá para:** https://console.neon.tech
2. **Crie um projeto**
3. **Copie connection string**
4. **Em Railway, adicione:**
   ```env
   DATABASE_URL=postgresql://user:password@host/db
   ```

---

## 🧪 Passo 6: Testar Deploy

Após deploy, acesse:

```
https://seu-projeto-randomico.railway.app/
```

### Testes Rápidos

```bash
# 1. Verificar saúde da API
curl https://seu-projeto.railway.app/api/health

# 2. Listar restaurantes
curl https://seu-projeto.railway.app/api/storefront/restaurants

# 3. Verificar status
https://seu-projeto.railway.app/status
```

---

## 📊 Monitorar Deploy

### Logs em Tempo Real

```bash
# Via CLI
railway logs

# Ou no Dashboard: Seu Projeto → Logs
```

### Métricas

- **CPU:** Deve estar <50% em idle
- **Memory:** Deve estar <200MB em idle
- **Build Time:** ~2-3 minutos

---

## 🔐 CI/CD Automático

Agora **toda vez que você fizer push para `main`:**

1. ✅ GitHub dispara webhook
2. ✅ Railway inicia build automático
3. ✅ `npm run build` executa
4. ✅ App faz deploy automático
5. ✅ Zero downtime se usar horários de deploy

### Configurar Webhook (Automático)

Railway detecta GitHub automaticamente. Mas se precisar:

1. **Settings → Deploy Triggers**
2. **Ativar:** "Deploy on push to main"

---

## 🐛 Troubleshooting

### Build falha: "npm run build failed"

**Solução:**
```bash
# Local, teste o build
npm run build

# Se der erro, corrija e faça push
git add .
git commit -m "Fix build"
git push origin main
```

### Database connection error

**Solução:**
```bash
# 1. Verifique DATABASE_URL está configurada
# 2. Se houver, Railway vai popular automaticamente
# 3. Aguarde 30 segundos e redeploye
```

### Porta 5000 já está em uso

**Solução:**
```env
# Railway auto-detecta a porta
# Não configure PORT manualmente se Railway estiver gerenciando
```

### App não inicia

**Verificar logs:**
```bash
railway logs --follow
```

**Causas comuns:**
- ❌ NODE_ENV não está definido
- ❌ DATABASE_URL ausente
- ❌ JWT_SECRET ausente
- ❌ Erro ao compilar TypeScript

---

## 🎯 Próximos Passos

Depois do deploy funcionar:

1. **Configurar Domínio Customizado:**
   - Railway Dashboard → Settings → Custom Domain
   - Adicione seu domínio
   - Configure DNS

2. **Habilitar HTTPS:**
   - ✅ Railway faz automaticamente com certificado Wildcard

3. **Configurar N8N Webhook:**
   - Em N8N, atualize URL da webhook para:
   ```
   https://seu-dominio.railway.app/api/whatsapp/webhook
   ```

4. **Testar Fluxo WhatsApp:**
   - Envie mensagem WhatsApp
   - Veja ordem ser criada
   - Verifique rastreamento

---

## 📞 Suporte Railway

- **Docs:** https://docs.railway.app
- **Status:** https://status.railway.app
- **Community:** https://discord.gg/railway

---

**Status:** ✅ Pronto para deploy  
**Tempo Estimado:** 5-10 minutos  
**Custo:** ~$7-15/mês (incluindo banco de dados)

