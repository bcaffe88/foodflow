#!/bin/bash

echo "🔍 VERIFICANDO DATA-TESTID EM TODOS OS COMPONENTES"
echo "=================================================="

TESTIDS=$(grep -r "data-testid" client/src --include="*.tsx" | grep -oP "data-testid=\"\K[^\"]*" | sort | uniq)

echo ""
echo "📋 TESTIDS ENCONTRADOS ($(echo "$TESTIDS" | wc -l) total):"
echo ""

# Categorizar
echo "🔘 BOTÕES:"
echo "$TESTIDS" | grep "^button-" | head -20

echo ""
echo "📝 INPUTS:"
echo "$TESTIDS" | grep "^input-" | head -10

echo ""
echo "🔗 LINKS:"
echo "$TESTIDS" | grep "^link-" | head -10

echo ""
echo "📄 TEXTOS:"
echo "$TESTIDS" | grep "^text-" | head -20

echo ""
echo "🃏 CARDS:"
echo "$TESTIDS" | grep "^card-" | head -10

echo ""
echo "✅ VERIFICAÇÃO CONCLUÍDA"
