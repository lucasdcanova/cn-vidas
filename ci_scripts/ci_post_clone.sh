#!/bin/sh

# Script executado após o clone no Xcode Cloud
# Este script garante que os plugins do Capacitor sejam configurados corretamente

echo "🔧 Configurando ambiente de build do Xcode Cloud..."

# Navegar para o diretório do projeto
cd $CI_WORKSPACE

echo "📦 Instalando dependências do Node.js..."
npm ci

echo "🔨 Fazendo build do projeto..."
npm run build

echo "📱 Sincronizando Capacitor com iOS..."
npx cap sync ios

echo "✅ Configuração concluída!"