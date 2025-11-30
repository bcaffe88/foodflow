# 📋 PLANO GERAL - WILSON PIZZARIA

**Status**: Em Desenvolvimento (Turn 11 de ∞)  
**Target**: Deploy para produção (Railway)  
**Próximo Turn**: TURN 12 - FIX CRÍTICOS + DEPLOY

---

## 🎯 FASES DO PROJETO

### ✅ FASE 1: CORE (COMPLETO)
- ✅ Frontend 20/20 páginas
- ✅ Backend routes (2390 linhas)
- ✅ Database schema (PostgreSQL)
- ✅ WebSocket driver tracking
- ✅ Address search (Nominatim)

### ⏳ FASE 2: SECURITY (BLOQUEADO)
- ❌ Remove mock login
- ❌ Remove Stripe secret keys
- ⏳ JWT token validation
- ⏳ Rate limiting

### 🔄 FASE 3: CLEANUP (PRÓXIMA)
- ⏳ Remove console.logs
- ⏳ Fix type safety (`any` → types)
- ⏳ Standardize error responses
- ⏳ Auto-assign drivers

### 🚀 FASE 4: DEPLOY (QUANDO 1-3 READY)
- ⏳ Deploy para Railway
- ⏳ Setup production database
- ⏳ Configure environment variables
- ⏳ Setup monitoring/alerts

### 🎉 FASE 5: FEATURES (AFTER DEPLOY)
- ⏳ Ratings & feedback system
- ⏳ Promotion/coupon system
- ⏳ Analytics dashboard
- ⏳ Mobile app (React Native)

---

## 📊 ROADMAP POR TURN

### TURN 12 (AGORA) - SEGURANÇA + DEPLOY
**Duration**: 1 turn  
**Tasks**:
- [ ] Remove mock login (2 min)
- [ ] Remove Stripe secret keys (3 min)
- [ ] Test login real (5 min)
- [ ] Deploy para Railway (10 min)

**Expected Result**: App em produção! 🚀

---

### TURN 13 - CÓDIGO LIMPO
**Duration**: 1 turn  
**Tasks**:
- [ ] Remove 270+ console.logs
- [ ] Fix 9+ `any` types
- [ ] Standardize errors
- [ ] Auto-assign drivers

**Expected Result**: Production-ready code

---

### TURN 14+ - FEATURES
**Features**:
- Ratings system (5 stars, comments)
- Promotion codes (PROMO20)
- Analytics dashboard (daily metrics)
- Mobile app support

---

## 🔐 SEGURANÇA - CHECKLIST

- [ ] **Auth**: Mock login removido
- [ ] **Keys**: Stripe secret não exposto
- [ ] **Tokens**: JWT com expiração
- [ ] **Rate Limit**: 100 req/min por IP
- [ ] **HTTPS**: Certificado SSL (Railway auto)
- [ ] **CORS**: Whitelist domains

---

## 📱 USUÁRIOS TESTADOS

```
Admin:    admin@foodflow.com / Admin123!      ✅ Funciona
Restaurant: wilson@wilsonpizza.com / wilson123 ⚠️ Mock login (vai remover)
Customer: customer@example.com / password      ✅ Funciona
Driver:   driver@example.com / password        ✅ Funciona
```

Após TURN 12:
```
Restaurant: wilson@wilsonpizza.com / wilson123 ✅ Real database
```

---

## 📈 MÉTRICAS

| Métrica | Status |
|---------|--------|
| Frontend Pages | 20/20 (100%) ✅ |
| Backend Routes | 50+ ✅ |
| Database Tables | 18+ ✅ |
| LSP Errors | 0 ✅ |
| Build Time | ~100ms ✅ |
| WebSocket | Online ✅ |
| Address Search | FREE (Nominatim) ✅ |
| Security Issues | 2 (TURN 12) ❌ |
| Code Quality | 4 issues (TURN 13) 🟠 |

---

## 🚀 DEPLOYMENT

### Railway Setup
```bash
# 1. Push code para GitHub
git push origin main

# 2. Connect Railway
# - Go to railway.app
# - Create new project
# - Select GitHub repo
# - Add environment variables

# 3. Environment Variables
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
SENDGRID_API_KEY=SG.xxx
FIREBASE_PROJECT_ID=xxx
NODE_ENV=production

# 4. Deploy
# - Railway auto-deploys on push
# - Access via railway.dev domain
```

---

## 📝 ARQUIVO IMPORTANTE

Se você está começando um novo turn:
1. **LEIA**: `TURN_12_AUDIT.md` (este arquivo)
2. **LEIA**: `replit.md` (status geral)
3. **LEIA**: `PLAN.md` (este arquivo)
4. **CHECKLIST**: Use replit.md para ver o que falta

---

## 🎯 PRÓXIMO DESENVOLVEDOR - QUICK START

1. **Entenda o Projeto**:
   - Front: React + Vite (20 páginas, Tailwind CSS)
   - Back: Express + TypeScript (2390 linhas)
   - DB: PostgreSQL (18 tables)
   - Real-time: WebSocket (driver tracking)

2. **Veja os Issues**:
   - 2 CRÍTICOS em TURN 12_AUDIT.md (security)
   - 4 MENORES para próx sprint
   - Todos documentados com linhas de código

3. **Próxima Ação**: TURN 12 - Remover 2 issues críticos

4. **Deploy**: Depois de TURN 12, deploy para Railway

---

**Mantido por**: Agent (Autonomous Mode)  
**Última atualização**: Turn 11 Audit  
**Próxima revisão**: TURN 12 (após deploy)
