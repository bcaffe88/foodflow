# 🚀 Setup GitHub + Railway para FoodFlow

**Status:** Arquivos de Deploy preparados ✅

---

## 📋 Passo 1: Criar Repositório Vazio no GitHub

1. Abra: https://github.com/new
2. Preencha:
   - **Repository name:** `foodflow`
   - **Description:** `Plataforma Multi-Tenant de Delivery (Clone iFood)`
   - **Visibility:** Selecione **Public**
3. **Importante:** Deixe desmarcado:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
4. Clique **"Create repository"**

---

## 🔧 Passo 2: Configurar Git Local

```bash
# Navegue até a pasta do projeto
cd /path/to/foodflow

# Configure seu usuário Git (se não tiver feito)
git config --global user.email "seu-email@example.com"
git config --global user.name "Seu Nome"

# Substitua pela URL do SEU repositório
git remote set-url origin https://github.com/SEU-USUARIO/foodflow.git

# Verifique se está correto
git remote -v
# Deve mostrar:
# origin    https://github.com/SEU-USUARIO/foodflow.git (fetch)
# origin    https://github.com/SEU-USUARIO/foodflow.git (push)

# Renomeie branch para main se necessário
git branch -M main

# Faça o push de TUDO
git push -u origin main

# Aguarde alguns segundos...
```

---

## 🎯 Passo 3: Verificar GitHub

Abra: https://github.com/seu-usuario/foodflow

Deve aparecer:
- ✅ Todos os arquivos do projeto
- ✅ client/ folder
- ✅ server/ folder
- ✅ shared/ folder
- ✅ package.json
- ✅ railway.json
- ✅ Procfile
- ✅ README-RAILWAY.md

---

## 🚀 Passo 4: Deploy no Railway

### Opção A: Via Dashboard Railway (Recomendado)

1. Abra: https://railway.app/dashboard
2. Faça login (ou crie conta)
3. Clique **"New Project"**
4. Selecione **"Deploy from GitHub Repo"**
5. Autorize Railway a acessar GitHub
6. Procure por `seu-usuario/foodflow`
7. Clique **"Select"**
8. Railway fará deploy automático! ✅

### Opção B: Via Railway CLI

```bash
# Instale Railway CLI
npm install -g @railway/cli

# Faça login
railway login

# No diretório do projeto
railway link

# Deploy
railway up

# Ver logs em tempo real
railway logs
```

---

## 🗂️ Passo 5: Configurar Banco de Dados

### No Dashboard Railway:

1. Vá para **Project Settings** → **Plugins**
2. Clique **"Add Plugin"**
3. Selecione **"PostgreSQL"**
4. Railway vai:
   - Criar banco de dados automaticamente
   - Setar `DATABASE_URL` automáticamente
   - ✅ Pronto!

---

## 🔐 Passo 6: Configurar Variáveis de Ambiente

### No Dashboard Railway:

1. Vá para **Environment** (abinha superior)
2. Abra arquivo `.env.example`
3. Para cada variável, adicione:

```
DATABASE_URL=          (deixar vazio - Railway seta automaticamente)
JWT_SECRET=            sua-chave-super-segura-aqui
SESSION_SECRET=        outra-chave-super-segura-aqui
STRIPE_SECRET_KEY=     sk_test_seu_token (ou sk_live em produção)
VITE_STRIPE_PUBLIC_KEY=pk_test_seu_token (ou pk_live em produção)
NODE_ENV=              production
PORT=                  5000
GOOGLE_MAPS_API_KEY=   sua-chave-google-maps-aqui (opcional)
N8N_HOST=              https://seu-n8n.railway.app (opcional)
SUPABASE_URL=          sua-supabase-url (opcional)
SUPABASE_KEY=          sua-supabase-key (opcional)
VITE_API_URL=          https://seu-railway-app.railway.app
```

---

## 🎬 Passo 7: Deploy Build

1. Após adicionar env vars, Railway fará build automaticamente
2. Acompanhe em **Deployments** → clique no deploy
3. Veja logs em tempo real
4. Quando aparecer **Status: ✅ Success**, está online!

---

## ✅ Verificar Deploy

```bash
# Abra a URL do Railway (aparece no dashboard)
# Ex: https://foodflow-production-xyz.railway.app

# Teste um endpoint
curl https://foodflow-production-xyz.railway.app/api/restaurant/menu
```

---

## 📊 Estrutura Final

```
Seu GitHub:
seu-usuario/foodflow (repositório público)
├── main branch (todos os arquivos)
└── Sincroniza com Railway automaticamente

Railway:
Projeto: FoodFlow
├── Service 1: Web (Node.js + React)
│   └── Environment: Variáveis .env
├── Service 2: PostgreSQL (Banco de dados)
└── Auto-redeploy em cada `git push`
```

---

## 🔄 Deploy Automático

Agora sempre que você fazer:

```bash
git add .
git commit -m "Novo feature"
git push origin main
```

Railway vai:
1. ✅ Detectar push no GitHub
2. ✅ Fazer build automático
3. ✅ Rodar migrations de banco
4. ✅ Fazer deploy
5. ✅ Tudo ao vivo em ~5-10 minutos

---

## 🐛 Troubleshooting

### Build falha com "ERR! code ERESOLVE"
```
Solução:
1. No Railway Dashboard → Settings
2. Set: Node.js 18.x ou 20.x
3. Clique "Redeploy"
```

### App sobe mas não funciona
```
Solução:
1. Verifique DATABASE_URL em Environment
2. Se vazio, adicione PostgreSQL plugin
3. Clique "Redeploy"
```

### Erro 502 Bad Gateway
```
Solução:
1. Aguarde 2-3 min (pode estar ainda iniciando)
2. Se persistir, clique "Redeploy"
3. Verifique logs: Deployments → seu-deploy → Logs
```

### Database migration falha
```
Solução:
npm run db:push (local, com env vars corretos)
Depois make push:
git push origin main
```

---

## 📞 Próximos Passos

1. ✅ Criar repo GitHub
2. ✅ Fazer push dos arquivos
3. ✅ Conectar Railway ao GitHub
4. ✅ Adicionar PostgreSQL
5. ✅ Configurar env vars
6. ✅ Acompanhar primeiro deploy
7. ✅ Testar endpoints
8. ✅ Configurar domínio customizado (opcional)

---

## 🎉 Quando Tudo Estiver Pronto

Sua app estará:
- ✅ No GitHub: `github.com/seu-usuario/foodflow`
- ✅ Ao vivo no Railway: `https://seu-app.railway.app`
- ✅ Com banco de dados PostgreSQL
- ✅ Pronto para receber tráfego real
- ✅ Auto-deploy a cada push

---

**Última Atualização:** 23 Novembro 2025  
**Status:** 🟢 Arquivos Prontos para GitHub + Railway
