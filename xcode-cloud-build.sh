#!/bin/bash

# Script para construir e preparar o projeto para Xcode Cloud
echo "🚀 Iniciando build para Xcode Cloud..."

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
rm -rf dist/
rm -rf ios/App/App/public/

# Instalar dependências
echo "📦 Instalando dependências..."
yarn install --frozen-lockfile

# Build do projeto
echo "🔨 Construindo projeto..."
yarn build

# Verificar se o build foi bem sucedido
if [ ! -f "dist/client/index.html" ]; then
    echo "❌ Erro: Build falhou - index.html não foi criado"
    exit 1
fi

echo "✅ Build concluído com sucesso"

# Sincronizar com Capacitor
echo "📱 Sincronizando com iOS..."
yarn cap sync ios

# Verificar se a sincronização foi bem sucedida
if [ ! -f "ios/App/App/public/index.html" ]; then
    echo "❌ Erro: Sincronização falhou - arquivos não foram copiados para iOS"
    exit 1
fi

echo "✅ Sincronização concluída"

# Adicionar arquivos ao git (temporariamente para Xcode Cloud)
echo "📝 Preparando arquivos para commit..."
git add -f ios/App/App/public/
git commit -m "chore: adicionar arquivos de build para Xcode Cloud [skip ci]" || true

echo "✅ Projeto preparado para Xcode Cloud!"
echo "📌 Próximos passos:"
echo "   1. git push origin main"
echo "   2. Xcode Cloud irá construir o app automaticamente"