#!/bin/sh

# Script executado ANTES do xcodebuild pelo Xcode Cloud
# Este script prepara o ambiente e dependências necessárias

echo "🚀 Iniciando preparação do ambiente para Xcode Cloud..."

# Navegar para o diretório raiz do projeto
cd $CI_PRIMARY_REPOSITORY_PATH

# Instalar dependências do Node.js
echo "📦 Instalando dependências do Node.js..."
if [ -f "package.json" ]; then
    # Usar yarn se disponível, senão npm
    if command -v yarn >/dev/null 2>&1; then
        yarn install --frozen-lockfile
    else
        npm ci
    fi
else
    echo "⚠️ package.json não encontrado!"
fi

# Build do projeto web
echo "🔨 Construindo o projeto web..."
if command -v yarn >/dev/null 2>&1; then
    yarn build
else
    npm run build
fi

# Sincronizar com Capacitor
echo "📱 Sincronizando com Capacitor..."
if command -v yarn >/dev/null 2>&1; then
    yarn cap sync ios
else
    npm run cap:sync
fi

# Navegar para o diretório iOS
cd ios/App

# Instalar pods se necessário
if [ -f "Podfile" ]; then
    echo "🧩 Instalando CocoaPods..."
    pod install || pod install --repo-update
fi

echo "✅ Preparação do ambiente concluída!"