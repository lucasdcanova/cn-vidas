#!/bin/sh

# Script executado pelo Xcode Cloud após clonar o repositório

echo "🚀 Iniciando script post-clone..."

# Navegar para o diretório correto
cd ios/App

# Instalar CocoaPods se necessário
if ! command -v pod &> /dev/null; then
    echo "📦 Instalando CocoaPods..."
    sudo gem install cocoapods
fi

# Executar pod install
echo "🔧 Executando pod install..."
pod install

echo "✅ Script post-clone concluído!"