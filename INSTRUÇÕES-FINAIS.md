# 📦 FoodFlow - Instruções Finais GitHub + Railway

**Status:** ✅ Tudo pronto para deploy

---

## 🎯 O Que Foi Preparado

### ✅ Arquivos de Produção

```
Preparados para Railway:
✅ railway.json          - Config Railway
✅ Procfile              - Comando start
✅ .env.example          - Variáveis (Railway seta automático)
✅ .gitignore           - Git ignore (prod-ready)
✅ package.json         - Scripts prontos
✅ README-RAILWAY.md    - Documentação
✅ PUSH-PARA-GITHUB.sh  - Script automático
```

### ✅ Scripts de Build

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node ...",
    "start": "NODE_ENV=production node dist/index.js",
    "db:push": "drizzle-kit push"
  }
}
```

### ✅ Configuração Railway

```json
{
  "build": { "builder": "nixpacks" },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "npm run start",
    "restartPolicyMaxRetries": 0
  }
}
```

---

## 🚀 PRÓXIMOS PASSOS (3 Passos Apenas)

### Passo 1️⃣: Criar Repo Vazio no GitHub

```bash
1. Vá em: https://github.com/new
2. Preencha:
   - Name: foodflow
   - Description: Plataforma Multi-Tenant de Delivery
   - Visibility: Public
   - ❌ Deixe DESMARCADO:
      - Add a README file
      - Add .gitignore
      - Choose a license
3. Clique: "Create repository"
```

**Resultado:** Você terá URL como `https://github.com/seu-usuario/foodflow`

---

### Passo 2️⃣: Fazer Push Automático

**Opção A: Script Automático (Recomendado)**

```bash
# No terminal (na pasta raiz do projeto):
bash PUSH-PARA-GITHUB.sh

# Será solicitado seu usuário GitHub
# Script vai fazer tudo automaticamente!
```

**Opção B: Manual**

```bash
git config --global user.email "seu-email@example.com"
git config --global user.name "Seu Nome"

git remote set-url origin https://github.com/seu-usuario/foodflow.git
git branch -M main
git push -u origin main

# Se pedir autenticação:
# Crie Personal Access Token em:
# GitHub → Settings → Developer settings → Personal access tokens
# Escopo: repo, admin:org
```

**Resultado:** Todos os arquivos no GitHub! ✅

---

### Passo 3️⃣: Deploy no Railway

```bash
1. Vá em: https://railway.app
2. Faça login (ou crie conta)
3. Clique: "New Project"
4. Selecione: "Deploy from GitHub Repo"
5. Autorize Railway acessar GitHub
6. Procure: seu-usuario/foodflow
7. Clique: "Select"
8. Railway fará TUDO automático:
   ✅ Build (npm install + npm run build)
   ✅ Setup Database (PostgreSQL)
   ✅ Run migrations (npm run db:push)
   ✅ Deploy (npm run start)
   ✅ Online em ~5-10 min
```

**Resultado:** App ao vivo em `https://seu-app.railway.app` 🎉

---

## 🔐 Configurar Variáveis (Railway)

Depois que Railway fizer deploy, configure variáveis:

```
Railway Dashboard → Environment Variables

JWT_SECRET=sua-chave-super-segura-aqui-TROCAR
SESSION_SECRET=outra-chave-super-segura-aqui-TROCAR
STRIPE_SECRET_KEY=sk_test_seu_token (ou sk_live)
VITE_STRIPE_PUBLIC_KEY=pk_test_seu_token (ou pk_live)
NODE_ENV=production
PORT=5000

# Opcional (para integrações avançadas):
GOOGLE_MAPS_API_KEY=sua-chave-google
N8N_HOST=https://seu-n8n.railway.app
SUPABASE_URL=https://seu-project.supabase.co
VITE_API_URL=https://seu-app.railway.app
```

Depois clique **"Redeploy"** para aplicar as variáveis.

---

## ✅ Verificar Deploy

```bash
# Quando app estiver online, teste:

# 1. Health check
curl https://seu-app.railway.app/api/health

# 2. Restaurantes
curl https://seu-app.railway.app/api/storefront/restaurants

# 3. Menu
curl https://seu-app.railway.app/api/storefront/wilson-pizza/menu

# Se tudo retornar dados → ✅ Pronto!
```

---

## 📊 Diagrama Final

```
Local (Seu Computador)
    ↓
[GitHub] seu-usuario/foodflow
    ↓ (push automático)
[Railway] Deploy automático
    ↓
✅ App ao vivo
```

---

## 🐛 Se Algo Falhar

### Erro 1: "Repository not found"
```
Solução: Verifique que criou repo vazio no GitHub
Não deve ter README, .gitignore ou license
```

### Erro 2: Build falha com "ERESOLVE"
```
Solução no Railway:
1. Settings → Node.js version: 18.x ou 20.x
2. Clique "Redeploy"
```

### Erro 3: "DATABASE_URL not set"
```
Solução:
1. Railway Dashboard → Add PostgreSQL plugin
2. Aguarde 2-3 min para sincronizar
3. Clique "Redeploy"
```

### Erro 4: App online mas endpoints 404
```
Solução:
1. Verifique BUILD_URL em Railway
2. Verifique DATABASE_URL está preenchido
3. Clique "Redeploy"
```

---

## 🎯 Resultado Final

Depois de tudo:

✅ **GitHub:**
- Repo público: `github.com/seu-usuario/foodflow`
- Todos os arquivos sincronizados
- Histórico de commits

✅ **Railway:**
- App ao vivo: `https://seu-app.railway.app`
- PostgreSQL automático
- Auto-deploy em cada git push
- Pronto para tráfego real

✅ **Próximas Fases (Opcional):**
- Integrar Stripe para pagamentos
- Conectar N8N para WhatsApp automático
- Google Maps para geolocalização
- Supabase para cache avançado

---

## 📖 Documentação

Leia para mais detalhes:
- `README-RAILWAY.md` - Deploy detalhado
- `GITHUB-SETUP.md` - Passo-a-passo GitHub
- `DEPLOY-CHECKLIST.md` - Checklist completo

---

## ⏱️ Tempo Estimado

- Passo 1 (Criar repo): 2 min
- Passo 2 (Push): 3 min
- Passo 3 (Railway deploy): 5-10 min

**Total: 10-15 minutos até ao vivo!**

---

## 🎉 Você Está Aqui

```
Local Development ✅
    ↓
GitHub Repository ← AQUI (próximo)
    ↓
Railway Deploy ← (depois)
    ↓
🌍 PRODUCTION LIVE
```

---

**Próximo:** Execute `bash PUSH-PARA-GITHUB.sh` no terminal!

Depois vá para https://railway.app e clique "New Project"

Qualquer dúvida, leia os documentos acima ou verifique logs do Railway. Tudo está pronto! 🚀
