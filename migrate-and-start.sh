#!/bin/bash

# Executa a migração do Drizzle
echo "Iniciando migração do banco de dados..."
npm run db:push

# Inicia o servidor
echo "Iniciando o servidor..."
npm start
