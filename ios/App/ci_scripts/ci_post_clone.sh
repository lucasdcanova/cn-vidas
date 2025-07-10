#\!/bin/sh

# Script para Xcode Cloud
echo "🔧 Executando script post-clone do Xcode Cloud..."

# Instalar CocoaPods se necessário
if \! command -v pod &> /dev/null; then
    echo "📦 Instalando CocoaPods..."
    sudo gem install cocoapods
fi

# Navegar para o diretório iOS
cd ios/App

# Limpar cache
echo "🗑️ Limpando cache..."
rm -rf ~/Library/Caches/CocoaPods
rm -rf Pods
rm -f Podfile.lock

# Instalar pods
echo "📦 Instalando dependências do CocoaPods..."
pod install --repo-update

echo "✅ Script post-clone concluído\!"
EOF < /dev/null