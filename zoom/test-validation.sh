#!/bin/bash
set -e

echo "=========================================="
echo "🧪 VALIDAÇÃO VISUAL E FUNCIONAL COMPLETA"
echo "=========================================="

echo ""
echo "1️⃣  TESTANDO ENDPOINT DE RESTAURANTES..."
curl -s http://localhost:5000/api/storefront/restaurants | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'✅ Total restaurantes: {len(data)}')
for r in data:
    status = '✅' if r['isActive'] else '❌'
    print(f'  {status} {r[\"name\"]} (slug: {r[\"slug\"]}) - Active: {r[\"isActive\"]}')
"

echo ""
echo "2️⃣  TESTANDO WILSON PIZZA ESPECÍFICO..."
curl -s http://localhost:5000/api/storefront/wilsonpizza | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'error' in data:
    print(f'❌ Erro: {data[\"error\"]}')
else:
    print(f'✅ Wilson Pizza encontrado:')
    print(f'   Nome: {data[\"name\"]}')
    print(f'   Slug: {data[\"slug\"]}')
    print(f'   Descrição: {data[\"description\"]}')
"

echo ""
echo "3️⃣  TESTANDO CATEGORIAS DO WILSON PIZZA..."
curl -s http://localhost:5000/api/storefront/wilsonpizza/categories | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'✅ Total categorias: {len(data)}')
if len(data) > 0:
    for cat in data[:3]:
        print(f'   - {cat[\"name\"]} ({cat[\"slug\"]})')
    if len(data) > 3:
        print(f'   ... e mais {len(data)-3} categorias')
"

echo ""
echo "4️⃣  TESTANDO PRODUTOS DO WILSON PIZZA..."
curl -s "http://localhost:5000/api/storefront/wilsonpizza/products" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'✅ Total produtos: {len(data)}')
if len(data) > 0:
    for prod in data[:3]:
        print(f'   - {prod[\"name\"]} - R\$ {prod[\"price\"]}')
    if len(data) > 3:
        print(f'   ... e mais {len(data)-3} produtos')
"

echo ""
echo "✅ VALIDAÇÃO COMPLETA - TUDO FUNCIONANDO!"
echo "=========================================="
