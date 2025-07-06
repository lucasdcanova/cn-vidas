#!/bin/sh

# Script executado ANTES do xcodebuild pelo Xcode Cloud
# Este script prepara o ambiente e dependências necessárias

echo "🚀 Iniciando preparação do ambiente para Xcode Cloud..."

# Navegar para o diretório raiz do projeto
cd $CI_PRIMARY_REPOSITORY_PATH

# Instalar dependências do Node.js
echo "📦 Instalando dependências do Node.js..."
if [ -f "package.json" ]; then
    # Usar yarn se disponível, senão npm
    if command -v yarn >/dev/null 2>&1; then
        yarn install --frozen-lockfile
    else
        npm ci
    fi
else
    echo "⚠️ package.json não encontrado!"
fi

# Build do projeto web
echo "🔨 Construindo o projeto web..."
if command -v yarn >/dev/null 2>&1; then
    yarn build
else
    npm run build
fi

# Sincronizar com Capacitor
echo "📱 Sincronizando com Capacitor..."
if command -v yarn >/dev/null 2>&1; then
    yarn cap sync ios
else
    npm run cap:sync
fi

# Criar estrutura do CapacitorKeyboard
echo "🔧 Criando estrutura do CapacitorKeyboard..."
KEYBOARD_PATH="$CI_PRIMARY_REPOSITORY_PATH/node_modules/@capacitor/keyboard"
mkdir -p "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include"

# Copiar arquivos do CapacitorKeyboard
echo "📋 Copiando arquivos do CapacitorKeyboard..."
if [ -d "$CI_PRIMARY_REPOSITORY_PATH/ios/App/CapacitorKeyboard/ios" ]; then
    cp -R "$CI_PRIMARY_REPOSITORY_PATH/ios/App/CapacitorKeyboard/ios/"* "${KEYBOARD_PATH}/ios/" 2>/dev/null || true
    echo "✅ Arquivos copiados com sucesso"
else
    echo "📝 Criando arquivos de header manualmente..."
    
    # Criar KeyboardPlugin.h
    cat > "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/KeyboardPlugin.h" << 'EOF'
#import <UIKit/UIKit.h>

//! Project version number for Plugin.
FOUNDATION_EXPORT double PluginVersionNumber;

//! Project version string for Plugin.
FOUNDATION_EXPORT const unsigned char PluginVersionString[];

// In this header, you should import all the public headers of your framework using statements like #import <Plugin/PublicHeader.h>
EOF

    # Criar Keyboard.h
    cat > "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/Keyboard.h" << 'EOF'
#import <UIKit/UIKit.h>
#import <Capacitor/CAPPlugin.h>
#import <Capacitor/CAPBridgedPlugin.h>


@class CAPPluginCall;

@interface KeyboardPlugin : CAPPlugin <CAPBridgedPlugin>

@end
EOF
    
    echo "✅ Arquivos de header criados"
fi

# Verificar se os arquivos existem
echo "🔍 Verificando arquivos do CapacitorKeyboard..."
ls -la "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/" || echo "Diretório não encontrado"

# Navegar para o diretório iOS
cd ios/App

# Instalar pods se necessário
if [ -f "Podfile" ]; then
    echo "🧩 Instalando CocoaPods..."
    pod install || pod install --repo-update
fi

echo "✅ Preparação do ambiente concluída!"