#!/bin/bash

echo "🔄 Sincronizando Android..."

# Build do projeto
echo "📦 Building..."
npm run build

# Sincronizar com Android
echo "🤖 Sincronizando Android..."
npx cap sync android

echo "✅ Android sincronizado! Agora você pode abrir o Android Studio no seu computador local."
echo "   Execute: npx cap open android"