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

# Voltar para o diretório iOS
cd ios/App

echo "Script ci_post_clone.sh concluído com sucesso!"