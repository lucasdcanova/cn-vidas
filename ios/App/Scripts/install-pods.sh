#!/bin/sh

# Script para instalar CocoaPods se necessário

# Verificar se estamos no Xcode Cloud
if [ -n "$CI_XCODE_CLOUD" ]; then
    echo "🚀 Detectado ambiente Xcode Cloud"
    
    # Configurar ambiente
    export GEM_HOME=$HOME/.gem
    export PATH=$GEM_HOME/bin:$PATH
    
    # Instalar CocoaPods se necessário
    if ! command -v pod &> /dev/null; then
        echo "📦 Instalando CocoaPods..."
        gem install cocoapods --user-install
    fi
    
    # Navegar para o diretório correto
    cd "$SRCROOT"
    
    # Verificar se Pods existe
    if [ ! -d "Pods" ]; then
        echo "🔧 Executando pod install..."
        pod install --repo-update
    else
        echo "✅ Pods já instalados"
    fi
fi