#!/bin/sh

# Script executado automaticamente pelo Xcode Cloud após clonar o repositório

echo "🔧 Iniciando configuração do ambiente Xcode Cloud..."

# Instalar Node.js se necessário
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, configure o ambiente com Node.js."
    exit 1
fi

echo "✅ Node.js versão: $(node --version)"
echo "✅ npm versão: $(npm --version)"

# Navegar para o diretório do repositório
cd "$CI_PRIMARY_REPOSITORY_PATH" || exit 1

# Limpar cache se necessário
echo "🧹 Limpando caches antigos..."
rm -rf node_modules
rm -f package-lock.json

# Instalar dependências
echo "📦 Instalando dependências do projeto..."
npm install

# Verificar se os arquivos Swift foram instalados
echo "🔍 Verificando arquivos Swift do Capacitor..."

if [ -f "node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin/Preferences.swift" ]; then
    echo "✅ Arquivos Swift do @capacitor/preferences encontrados"
else
    echo "❌ Arquivos Swift do @capacitor/preferences NÃO encontrados"
    ls -la node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin/ || echo "Diretório não existe"
fi

if [ -f "node_modules/@capacitor/browser/ios/Sources/BrowserPlugin/Browser.swift" ]; then
    echo "✅ Arquivos Swift do @capacitor/browser encontrados"
else
    echo "❌ Arquivos Swift do @capacitor/browser NÃO encontrados"
    ls -la node_modules/@capacitor/browser/ios/Sources/BrowserPlugin/ || echo "Diretório não existe"
fi

# Build do projeto web
echo "🏗️ Fazendo build do projeto web..."
npm run build

# Sincronizar com Capacitor
echo "📱 Sincronizando com iOS..."
npx cap sync ios

# Instalar CocoaPods
echo "🍫 Instalando CocoaPods..."
cd ios/App
pod install --repo-update

echo "✅ Configuração concluída!"