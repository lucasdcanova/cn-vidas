#!/bin/bash

set -e

# Instalar Node.js usando Homebrew
echo "Instalando Node.js..."
brew install node || echo "Node.js já instalado"

# Navegar para o diretório raiz do projeto
cd ../../

# Instalar dependências do Node
echo "Instalando dependências do Node..."
npm install

# Build do projeto web
echo "Fazendo build do projeto..."
npm run build

# Sincronizar com iOS
echo "Sincronizando com Capacitor iOS..."
npx cap sync ios

# Copiar arquivos do CapacitorKeyboard para evitar erro de build
echo "Copiando arquivos do CapacitorKeyboard..."
if [ -d "ios/App/CapacitorKeyboard" ]; then
    mkdir -p "node_modules/@capacitor/keyboard/ios/Sources/KeyboardPlugin/include"
    cp ios/App/CapacitorKeyboard/ios/Sources/KeyboardPlugin/include/*.h "node_modules/@capacitor/keyboard/ios/Sources/KeyboardPlugin/include/" || true
fi

# Voltar para o diretório iOS
cd ios/App

echo "Script ci_post_clone.sh concluído com sucesso!"