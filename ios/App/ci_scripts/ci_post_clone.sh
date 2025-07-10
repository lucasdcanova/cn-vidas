#!/bin/sh

# Xcode Cloud Post-Clone Script
# Este script é executado automaticamente pelo Xcode Cloud após clonar o repositório

set -e

echo "🚀 Executando script ci_post_clone.sh do Xcode Cloud..."
echo "📍 Diretório atual: $(pwd)"
echo "📂 Conteúdo do diretório:"
ls -la

# Verificar se estamos no diretório correto
if [ ! -f "Podfile" ]; then
    echo "❌ Erro: Podfile não encontrado no diretório atual"
    echo "📍 Navegando para o diretório do projeto iOS..."
    
    # Se estamos em ci_scripts, subir um nível
    if [[ "$(pwd)" == *"/ci_scripts" ]]; then
        cd ..
        echo "✅ Subiu para: $(pwd)"
    fi
    
    # Se ainda não encontramos o Podfile, tentar outras opções
    if [ ! -f "Podfile" ]; then
        # Tentar voltar para a raiz e ir para ios/App
        cd /Volumes/workspace/repository
        if [ -d "ios/App" ]; then
            cd ios/App
            echo "✅ Navegou para: $(pwd)"
        else
            echo "❌ Erro: Diretório ios/App não encontrado a partir da raiz"
            exit 1
        fi
    fi
fi

# Verificar se o arquivo Podfile existe
if [ ! -f "Podfile" ]; then
    echo "❌ Erro: Podfile não encontrado!"
    exit 1
fi

echo "✅ Podfile encontrado"

# Verificar se npm está disponível
if ! command -v npm &> /dev/null; then
    echo "❌ Erro: npm não está instalado!"
    echo "📦 Tentando usar node/npm do Xcode Cloud..."
    
    # Xcode Cloud geralmente tem node instalado
    export PATH="/usr/local/bin:$PATH"
    
    if ! command -v npm &> /dev/null; then
        echo "❌ Erro fatal: npm não encontrado no sistema"
        exit 1
    fi
fi

echo "✅ npm encontrado: $(npm --version)"
echo "✅ node encontrado: $(node --version)"

# Instalar CocoaPods se necessário
if ! command -v pod &> /dev/null; then
    echo "📦 Instalando CocoaPods..."
    export GEM_HOME=$HOME/.gem
    export PATH=$GEM_HOME/bin:$PATH
    gem install cocoapods --user-install
else
    echo "✅ CocoaPods já está instalado"
    pod --version
fi

# Limpar cache de pods se necessário
echo "🧹 Limpando cache de pods..."
pod cache clean --all || true

# Sempre instalar dependências do npm para garantir que estejam presentes
echo "📦 Instalando dependências do npm..."
ORIGINAL_DIR=$(pwd)
cd ../..
echo "📍 Instalando npm em: $(pwd)"

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado!"
    exit 1
fi

# Instalar dependências
npm install

# Verificar se node_modules foi criado
if [ ! -d "node_modules" ]; then
    echo "❌ Erro: node_modules não foi criado após npm install"
    exit 1
fi

# Verificar se os plugins do Capacitor foram instalados
if [ ! -d "node_modules/@capacitor/preferences" ]; then
    echo "❌ Erro: @capacitor/preferences não foi instalado"
    exit 1
fi

echo "✅ Dependências npm instaladas com sucesso"
cd "$ORIGINAL_DIR"

# Verificar se Pods já existe
if [ -d "Pods" ]; then
    echo "📂 Diretório Pods já existe"
    # Remover Pods e Podfile.lock para garantir instalação limpa
    echo "🧹 Removendo Pods e Podfile.lock para instalação limpa..."
    rm -rf Pods
    rm -f Podfile.lock
fi

# Executar pod install
echo "🔧 Executando pod install..."
pod install --repo-update --verbose

# Verificar se a instalação foi bem sucedida
if [ ! -d "Pods" ]; then
    echo "❌ Erro: Diretório Pods não foi criado após pod install"
    exit 1
fi

echo "✅ Script ci_post_clone.sh concluído com sucesso!"
echo "📂 Conteúdo final do diretório:"
ls -la