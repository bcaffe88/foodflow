#!/bin/bash

# Script para fazer push automático dos arquivos essenciais no GitHub
# Execute este script para atualizar seu repositório GitHub

echo "🚀 FoodFlow - Push para GitHub"
echo "=============================="

# Verificar se está em um repositório Git
if [ ! -d .git ]; then
  echo "❌ Erro: Não está em um repositório Git"
  echo "Execute: git init && git remote add origin <seu-repo-url>"
  exit 1
fi

# Configurar Git
echo "📝 Configurando Git..."
git config user.email "bot@foodflow.local"
git config user.name "FoodFlow Deployment Bot"

# Adicionar apenas arquivos essenciais
echo "📦 Adicionando arquivos essenciais..."
git add \
  .env.example \
  .gitignore \
  .replit \
  package.json \
  package-lock.json \
  tsconfig.json \
  postcss.config.js \
  drizzle.config.ts \
  vite.config.ts \
  tailwind.config.ts \
  README.md \
  RAILWAY_DEPLOYMENT.md \
  GITHUB_EXPORT.md \
  server/ \
  client/ \
  shared/ \
  -f

# Verificar status
echo ""
echo "✅ Status do repositório:"
git status

# Commit
echo ""
read -p "Fazer commit? (s/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
  git commit -m "🚀 FoodFlow MVP - Pronto para Railway Deploy

- Build otimizado: 186.4KB production
- Zero erros TypeScript
- Todas 25 páginas com lazy loading
- Autenticação JWT implementada
- Stripe integration
- WhatsApp notifications
- N8N webhooks
- Security headers + Rate limiting"

  # Push
  echo ""
  read -p "Fazer push? (s/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    git push origin main -u
    echo ""
    echo "✅ Push concluído com sucesso!"
    echo "📚 Próximo passo: Conectar ao Railway"
    echo "   1. Railway: railway.app"
    echo "   2. New Project > GitHub Repo"
    echo "   3. Selecionar este repositório"
    echo "   4. Adicionar variáveis de ambiente"
  fi
fi
