#!/bin/bash

echo "🚀 FoodFlow - Push para GitHub"
echo "================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis
REPO_NAME="foodflow"
GITHUB_TOKEN=${GITHUB_TOKEN:-""}

# Verificações
echo "📋 Pré-requisitos..."
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git não está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git instalado${NC}"

if ! git config --global user.email &> /dev/null; then
    echo -e "${RED}❌ Configure Git: git config --global user.email e user.name${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git configurado${NC}"

# Solicitar informações
echo ""
echo "📝 Informações necessárias:"
read -p "Seu usuário GitHub: " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo -e "${RED}❌ Usuário GitHub é obrigatório${NC}"
    exit 1
fi

# URL do repositório
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo ""
echo "🔄 Processando..."
echo "Repositório: $REPO_URL"
echo ""

# Configurar git remote
echo "1️⃣ Configurando git remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
echo -e "${GREEN}✅ Remote configurado${NC}"

# Sincronizar branch
echo ""
echo "2️⃣ Sincronizando branch..."
git branch -M main 2>/dev/null || git branch -m main 2>/dev/null || true
echo -e "${GREEN}✅ Branch main pronto${NC}"

# Adicionar arquivos
echo ""
echo "3️⃣ Adicionando arquivos..."
git add .
echo -e "${GREEN}✅ Arquivos adicionados${NC}"

# Commit
echo ""
echo "4️⃣ Fazendo commit..."
git commit -m "🚀 Initial commit - FoodFlow Deploy Ready" 2>/dev/null || echo "Nenhuma mudança para commit"
echo -e "${GREEN}✅ Commit concluído${NC}"

# Push
echo ""
echo "5️⃣ Fazendo push para GitHub..."
echo "📌 Pode ser solicitado autenticação GitHub..."
echo ""

if git push -u origin main; then
    echo -e "${GREEN}✅ Push concluído com sucesso!${NC}"
    echo ""
    echo "🎉 Repositório criado e atualizado:"
    echo "   🔗 https://github.com/${GITHUB_USER}/${REPO_NAME}"
    echo ""
    echo "⏭️  Próximo passo:"
    echo "   1. Vá em: https://railway.app"
    echo "   2. New Project → Deploy from GitHub Repo"
    echo "   3. Procure por: ${GITHUB_USER}/${REPO_NAME}"
    echo "   4. Selecione e Railway fará deploy automático!"
else
    echo -e "${RED}❌ Erro ao fazer push${NC}"
    echo ""
    echo "Opções:"
    echo "1. Crie um Personal Access Token:"
    echo "   - GitHub → Settings → Developer settings → Personal access tokens"
    echo "   - Escopo: repo, admin:org"
    echo ""
    echo "2. Use token para autenticar:"
    echo "   git config --global credential.helper store"
    echo "   git push -u origin main"
    echo "   (Cole token quando pedir senha)"
    exit 1
fi

echo ""
echo "✅ Tudo pronto para Railway!"
