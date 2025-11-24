# 🚀 FoodFlow - Deploy Checklist Completo

**Data:** 23 Novembro 2025  
**Status:** 🟢 Arquivos prontos para GitHub + Railway

---

## ✅ Arquivos Criados/Atualizados

- [x] `railway.json` - Configuração Railway
- [x] `Procfile` - Comando start
- [x] `.env.example` - Env vars melhorado
- [x] `.gitignore` - Production-ready
- [x] `README-RAILWAY.md` - Documentação deploy
- [x] `GITHUB-SETUP.md` - Passo-a-passo
- [x] `package.json` - Scripts prontos
  - `npm run dev` - Desenvolvimento
  - `npm run build` - Production build
  - `npm run start` - Production start
  - `npm run db:push` - Database migration

---

## 🎯 PRÓXIMOS PASSOS (Você Faz)

### 1️⃣ Criar Repositório GitHub

```bash
# Vá em: https://github.com/new
# Preencha:
# - Name: foodflow
# - Description: Plataforma Multi-Tenant de Delivery
# - Visibility: Public
# - ❌ Deixe desmarcado: README, .gitignore, license

# Depois você terá uma URL:
# https://github.com/seu-usuario/foodflow
```

### 2️⃣ Conectar Replit ao GitHub (VIA INTEGRAÇÃO)

```
1. Clique em "Setup GitHub" no chat acima
2. Autorize Replit a acessar seu GitHub
3. Replit fará push automático de todos os arquivos
```

### 3️⃣ Deploy no Railway

```bash
# Vá em: https://railway.app
# 1. New Project → Deploy from GitHub Repo
# 2. Procure: seu-usuario/foodflow
# 3. Clique: Select
# 4. Railway fará deploy automático!
```

### 4️⃣ Configurar Banco de Dados (Railway)

```
No Dashboard Railway:
1. Settings → Plugins
2. Add: PostgreSQL
3. Railway configura DATABASE_URL automaticamente
```

### 5️⃣ Variáveis de Ambiente (Railway)

```
No Dashboard Railway → Environment:

JWT_SECRET=sua-chave-super-segura-aqui-trocar
SESSION_SECRET=outra-chave-segura-aqui-trocar
STRIPE_SECRET_KEY=sk_test_seu_token (ou sk_live)
VITE_STRIPE_PUBLIC_KEY=pk_test_seu_token (ou pk_live)
NODE_ENV=production
PORT=5000

# Opcional (para integrações avançadas):
GOOGLE_MAPS_API_KEY=sua-chave-google
N8N_HOST=https://seu-n8n.railway.app
SUPABASE_URL=https://seu-project.supabase.co
SUPABASE_KEY=sua-key
VITE_API_URL=https://seu-app.railway.app
```

### 6️⃣ Acompanhar Deploy

```
Railway Dashboard → Deployments:
✅ Build started
✅ Build complete
✅ Deployment running
✅ Status: Success → App ao vivo!
```

---

## 📊 Estrutura de Deploy

```
seu-usuario/foodflow (GitHub)
├── Trigger: git push origin main
├── Railway detecta push
├── Build: npm install + npm run build
├── Migrate: npm run db:push
├── Start: npm run start
└── Live: https://seu-app.railway.app

Auto-redeploy em cada push!
```

---

## 🧪 Testes Finais

```bash
# Quando app estiver ao vivo:

# Teste 1: Health check
curl https://seu-app.railway.app/api/health

# Teste 2: Restaurantes
curl https://seu-app.railway.app/api/storefront/restaurants

# Teste 3: Menu
curl https://seu-app.railway.app/api/storefront/wilson-pizza/menu

# Se tudo retornar 200 → ✅ Pronto!
```

---

## 🐛 Se Algo Falhar

### Build Error: "ERESOLVE"
```
Solução:
1. Railway Dashboard → Settings
2. Node.js version: 18.x ou 20.x
3. Clique: Redeploy
```

### Database não conecta
```
Solução:
1. Verifique se PostgreSQL foi adicionado
2. Aguarde 2-3 min para sincronizar
3. Clique: Redeploy
```

### App online mas endpoints 404
```
Solução:
1. Verifique BUILD_URL em Railway
2. Verifique DATABASE_URL está setado
3. Clique: Redeploy
```

---

## 🎯 Resultado Final

Depois de tudo, você terá:

✅ **GitHub:**
- Repositório público: `github.com/seu-usuario/foodflow`
- Todos os arquivos sincronizados
- Histórico de commits

✅ **Railway:**
- App ao vivo: `https://seu-app.railway.app`
- Banco de dados PostgreSQL
- Auto-deploy em cada push
- Logs em tempo real

✅ **Pronto para:**
- Receber tráfego real
- Integrar com Stripe, N8N, Google Maps
- Escalar com mais usuários

---

## 📞 Documentação

- `README-RAILWAY.md` - Deploy detalhado
- `GITHUB-SETUP.md` - Passo-a-passo GitHub
- `projeto Wilson pizza/N8N_HTTP_NODES_DEBUG.md` - Bugs N8N
- `projeto Wilson pizza/CORREÇÃO_BUGS_GUIA_PRÁTICO.md` - Como testar

---

## 🚀 Você Está Aqui

```
Local Development ✅
    ↓
GitHub Repository ⏳ (próximo passo)
    ↓
Railway Deploy ⏳ (depois do GitHub)
    ↓
Configurar Integrações ⏳ (Stripe, N8N, etc)
    ↓
🎉 PRODUCTION LIVE 🎉
```

---

**Status:** 🟢 100% Pronto  
**Tempo:** 10-15 min para completar  
**Próximo:** Clique "Setup GitHub" acima →
