#!/bin/sh

set -e

# Script executado pelo Xcode Cloud após clonar o repositório

echo "🚀 Iniciando script post-clone..."

# Debug: mostrar ambiente
echo "📍 Diretório atual: $(pwd)"
echo "📁 Conteúdo da raiz:"
ls -la

# Xcode Cloud executa da raiz do repositório
# Precisamos navegar para ios/App
echo "📂 Navegando para ios/App..."
cd ios/App

# Verificar se o Podfile existe
if [ ! -f "Podfile" ]; then
    echo "❌ Erro: Podfile não encontrado em ios/App!"
    echo "Estrutura do diretório:"
    pwd
    ls -la
    exit 1
fi

echo "✅ Podfile encontrado"

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