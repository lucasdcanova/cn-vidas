#!/bin/bash

echo "🔄 Sincronizando projeto iOS com as últimas alterações..."

# Pull das últimas alterações
echo "📥 Baixando últimas alterações do Git..."
git pull origin main

# Build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build

# Sincronizar com Capacitor
echo "📱 Sincronizando com iOS..."
npx cap sync ios

echo "✅ Sincronização concluída!"
echo "📌 Agora abra o Xcode e faça:"
echo "   1. Product > Clean Build Folder (⇧⌘K)"
echo "   2. Product > Build (⌘B)"
echo "   3. Product > Run (⌘R)"