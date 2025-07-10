#!/bin/bash

echo "🔧 Corrigindo problemas de build do iOS..."

# Navegar para o diretório iOS
cd ios/App

echo "📦 Limpando cache do CocoaPods..."
rm -rf ~/Library/Caches/CocoaPods
rm -rf Pods
rm -rf ~/Library/Developer/Xcode/DerivedData

echo "🗑️ Removendo arquivos antigos..."
rm -f Podfile.lock

echo "💎 Desinstalando CocoaPods..."
gem list --local | grep cocoapods | awk '{print $1}' | xargs sudo gem uninstall -aIx

echo "💎 Reinstalando CocoaPods..."
sudo gem install cocoapods

echo "📦 Instalando pods..."
pod install --repo-update

echo "✅ Processo concluído!"
echo "🚀 Agora você pode fazer build no Xcode Cloud"

cd ../..