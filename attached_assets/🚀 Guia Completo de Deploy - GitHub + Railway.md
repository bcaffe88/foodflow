# 🚀 Guia Completo de Deploy - GitHub + Railway

## 📦 Passo 1: Upload para GitHub

### 1.1 Baixar o Código
Baixe o arquivo `delivery-system-complete.zip` que foi gerado.

### 1.2 Criar Repositório no GitHub
1. Acesse https://github.com/new
2. Nome do repositório: `delivery-system-online`
3. Descrição: `Sistema completo de delivery online similar ao iFood`
4. Visibilidade: **Public** ou **Private** (sua escolha)
5. **NÃO** marque "Add a README file"
6. **NÃO** marque "Add .gitignore"
7. Clique em **"Create repository"**

### 1.3 Fazer Upload do Código

**Opção A: Via Interface Web (Mais Fácil)**
1. Na página do repositório criado, clique em **"uploading an existing file"**
2. Extraia o ZIP `delivery-system-complete.zip`
3. Arraste todos os arquivos e pastas para a área de upload
4. Escreva uma mensagem de commit: `Initial commit - Sistema de delivery completo`
5. Clique em **"Commit changes"**

**Opção B: Via Git CLI (Se preferir)**
```bash
# Extrair o ZIP
unzip delivery-system-complete.zip
cd delivery-system

# Inicializar git
git init
git add .
git commit -m "Initial commit - Sistema de delivery completo"

# Adicionar remote (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/delivery-system-online.git

# Push
git branch -M main
git push -u origin main
```

---

## 🚂 Passo 2: Deploy na Railway

### 2.1 Criar Conta na Railway
1. Acesse https://railway.app
2. Clique em **"Login"**
3. Faça login com sua conta GitHub
4. Autorize o Railway a acessar seus repositórios

### 2.2 Criar Novo Projeto
1. No dashboard da Railway, clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório `delivery-system-online`
4. Railway detectará automaticamente que é um projeto Node.js

### 2.3 Configurar Banco de Dados MySQL
1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"Add MySQL"**
3. Railway criará automaticamente um banco MySQL
4. Anote a variável `DATABASE_URL` que será gerada

### 2.4 Configurar Variáveis de Ambiente

Clique no serviço do seu app → **"Variables"** → **"RAW Editor"** e adicione:

```env
# Database (Railway gera automaticamente, mas verifique)
DATABASE_URL=mysql://user:password@host:port/database

# JWT Secret (gere uma string aleatória forte)
JWT_SECRET=sua_chave_secreta_muito_forte_aqui_min_32_caracteres

# Manus OAuth (use as mesmas do ambiente de desenvolvimento)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=seu_app_id_aqui

# Owner Info (suas informações)
OWNER_OPEN_ID=seu_open_id
OWNER_NAME=Seu Nome

# App Config
VITE_APP_TITLE=Sabor Express
VITE_APP_LOGO=/logo.png
NODE_ENV=production
PORT=3000

# Manus Built-in APIs (se disponíveis)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_chave_aqui
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua_chave_frontend_aqui

# Analytics (opcional)
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

### 2.5 Configurar Build e Start Commands

Na aba **"Settings"** do serviço:

**Build Command:**
```bash
pnpm install && pnpm db:push && pnpm build
```

**Start Command:**
```bash
pnpm start
```

**Root Directory:** (deixe vazio ou `/`)

### 2.6 Fazer Deploy
1. Clique em **"Deploy"**
2. Railway começará a fazer o build
3. Aguarde 3-5 minutos
4. Se houver erros, verifique os logs em **"Deployments"** → **"View Logs"**

### 2.7 Obter URL Pública
1. Vá em **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"**
3. Railway gerará uma URL tipo: `delivery-system-online-production.up.railway.app`
4. Anote essa URL!

---

## 🔧 Passo 3: Configurar OAuth Callback

### 3.1 Atualizar Manus OAuth
1. Acesse o painel de configuração do Manus OAuth
2. Adicione a URL de callback da Railway:
   ```
   https://SEU_DOMINIO.up.railway.app/api/oauth/callback
   ```
3. Salve as alterações

---

## 🗄️ Passo 4: Popular Banco de Dados

### 4.1 Executar Seed via Railway CLI

**Opção A: Via Railway Dashboard**
1. No serviço do app, vá em **"Settings"** → **"Deploy Triggers"**
2. Adicione um comando one-time:
   ```bash
   pnpm exec tsx scripts/seed.mjs
   ```

**Opção B: Via Railway CLI (Recomendado)**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Linkar ao projeto
railway link

# Executar seed
railway run pnpm exec tsx scripts/seed.mjs
```

**Opção C: Conectar ao Banco Remotamente**
1. Copie a `DATABASE_URL` da Railway
2. No seu computador local:
   ```bash
   export DATABASE_URL="mysql://..."
   pnpm exec tsx scripts/seed.mjs
   ```

---

## ✅ Passo 5: Testar o Deploy

### 5.1 Acessar a Aplicação
Acesse: `https://SEU_DOMINIO.up.railway.app`

### 5.2 Verificar Funcionalidades
- [ ] Página inicial carrega com produtos
- [ ] Adicionar produtos ao carrinho funciona
- [ ] Checkout abre corretamente
- [ ] Login OAuth funciona
- [ ] Dashboard do restaurante acessível em `/restaurant`
- [ ] Dashboard do desenvolvedor acessível em `/developer`
- [ ] Dashboard de motoboys acessível em `/delivery`

### 5.3 Verificar Logs
Se algo não funcionar:
1. Railway Dashboard → Seu serviço → **"Deployments"**
2. Clique no deployment ativo → **"View Logs"**
3. Procure por erros em vermelho

---

## 🐛 Troubleshooting Comum

### Erro: "Cannot connect to database"
**Solução:**
- Verifique se o serviço MySQL está rodando na Railway
- Verifique se a `DATABASE_URL` está correta
- Formato correto: `mysql://user:password@host:port/database`

### Erro: "OAuth callback failed"
**Solução:**
- Verifique se adicionou a URL de callback no painel Manus OAuth
- URL deve ser: `https://SEU_DOMINIO.up.railway.app/api/oauth/callback`

### Erro: "Build failed" ou "Module not found"
**Solução:**
- Verifique se o `package.json` está no root do repositório
- Verifique se o build command está correto
- Tente fazer deploy novamente (às vezes é problema temporário)

### Erro: "Port already in use"
**Solução:**
- Railway usa a variável `PORT` automaticamente
- Certifique-se que o código usa `process.env.PORT || 3000`

### Banco de dados vazio
**Solução:**
- Execute o seed manualmente via Railway CLI
- Ou conecte ao banco remotamente e execute o seed local

---

## 📊 Monitoramento e Manutenção

### Logs em Tempo Real
```bash
railway logs
```

### Restart do Serviço
```bash
railway restart
```

### Ver Variáveis de Ambiente
```bash
railway variables
```

### Atualizar Código
Basta fazer push para o GitHub:
```bash
git add .
git commit -m "Atualização XYZ"
git push
```
Railway fará deploy automático!

---

## 🎯 Próximos Passos Após Deploy

1. **Domínio Personalizado** (Opcional)
   - Railway Settings → Networking → Custom Domain
   - Adicione seu domínio (ex: `delivery.seusite.com`)
   - Configure DNS conforme instruções

2. **SSL/HTTPS**
   - Railway fornece SSL automático ✅
   - Nada precisa ser configurado!

3. **Backup do Banco**
   - Configure backups automáticos no MySQL da Railway
   - Ou use ferramentas como `mysqldump`

4. **Monitoramento**
   - Configure alertas na Railway
   - Use ferramentas como Sentry para erros

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs na Railway
2. Consulte a documentação: https://docs.railway.app
3. Entre em contato via WhatsApp: 87999480699

---

**Última atualização**: 21 de Novembro de 2024  
**Versão do Sistema**: 9b4875a1
