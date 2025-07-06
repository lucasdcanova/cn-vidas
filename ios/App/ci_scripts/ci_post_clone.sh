#!/bin/sh

set -e

# Script executado pelo Xcode Cloud após clonar o repositório

echo "🚀 Iniciando script post-clone..."

# Debug: mostrar ambiente
echo "📍 Diretório atual: $(pwd)"
echo "📁 Conteúdo da raiz:"
ls -la

# Verificar se estamos no diretório correto
if [ -f "Podfile" ]; then
    echo "✅ Podfile encontrado no diretório atual"
elif [ -f "ios/App/Podfile" ]; then
    echo "📂 Navegando para ios/App..."
    cd ios/App
elif [ -f "App/Podfile" ]; then
    echo "📂 Navegando para App..."
    cd App
else
    echo "❌ Erro: Podfile não encontrado!"
    echo "Estrutura do diretório:"
    find . -name "Podfile" -type f
    exit 1
fi

# Instalar CocoaPods
echo "📦 Instalando CocoaPods..."
export GEM_HOME=$HOME/.gem
export PATH=$GEM_HOME/bin:$PATH
gem install cocoapods --user-install

# Verificar instalação
echo "🔍 Verificando CocoaPods..."
which pod
pod --version

# Limpar cache se existir
echo "🧹 Limpando cache do CocoaPods..."
rm -rf ~/Library/Caches/CocoaPods
rm -rf Pods
rm -f Podfile.lock

# Executar pod install
echo "🔧 Executando pod install..."
pod install --repo-update --verbose

# Verificar resultado
if [ -d "Pods" ] && [ -f "App.xcworkspace" ]; then
    echo "✅ Pod install concluído com sucesso!"
    echo "📁 Conteúdo após pod install:"
    ls -la
else
    echo "❌ Erro: Pod install pode ter falhado"
    exit 1
fi

echo "✅ Script post-clone concluído!"