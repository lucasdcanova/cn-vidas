#!/bin/bash

set -e

echo "=== Iniciando script ci_post_clone.sh ==="
echo "Diretório atual: $(pwd)"

# Instalar Node.js usando Homebrew
echo "Instalando Node.js..."
brew install node || echo "Node.js já instalado"

# Navegar para o diretório raiz do projeto
cd ../../
echo "Mudou para diretório: $(pwd)"

# Limpar node_modules antigos se existirem
echo "Limpando node_modules antigos..."
rm -rf node_modules/@capacitor/keyboard

# Instalar dependências do Node
echo "Instalando dependências do Node..."
npm install

# Criar estrutura completa do CapacitorKeyboard
echo "Criando estrutura completa do CapacitorKeyboard..."
KEYBOARD_PATH="node_modules/@capacitor/keyboard"
mkdir -p "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include"

# Copiar TODO o conteúdo do CapacitorKeyboard do repositório
echo "Copiando arquivos do CapacitorKeyboard do repositório..."
if [ -d "ios/App/CapacitorKeyboard/ios" ]; then
    cp -R ios/App/CapacitorKeyboard/ios/* "${KEYBOARD_PATH}/ios/" 2>/dev/null || true
    echo "Estrutura copiada com sucesso"
    
    # Listar arquivos copiados para debug
    echo "Arquivos em ${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/:"
    ls -la "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/" || echo "Diretório não encontrado"
else
    echo "ERRO: Diretório ios/App/CapacitorKeyboard não encontrado!"
    echo "Criando arquivos de header manualmente..."
    
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
    
    echo "Arquivos de header criados manualmente"
fi

# Verificar se os arquivos existem
echo "=== Verificação final dos arquivos ==="
if [ -f "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/KeyboardPlugin.h" ]; then
    echo "✓ KeyboardPlugin.h existe"
    echo "  Tamanho: $(wc -c < "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/KeyboardPlugin.h") bytes"
else
    echo "✗ KeyboardPlugin.h NÃO encontrado!"
fi

if [ -f "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/Keyboard.h" ]; then
    echo "✓ Keyboard.h existe"
    echo "  Tamanho: $(wc -c < "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/Keyboard.h") bytes"
else
    echo "✗ Keyboard.h NÃO encontrado!"
fi

# Build do projeto web
echo "Fazendo build do projeto..."
npm run build

# Sincronizar com iOS
echo "Sincronizando com Capacitor iOS..."
npx cap sync ios

# Verificar novamente após sync
echo "=== Verificação após sync ==="
if [ -f "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/KeyboardPlugin.h" ]; then
    echo "✓ KeyboardPlugin.h ainda existe após sync"
else
    echo "✗ KeyboardPlugin.h foi removido pelo sync!"
    
    # Re-copiar se necessário
    echo "Re-copiando arquivos..."
    mkdir -p "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include"
    if [ -d "ios/App/CapacitorKeyboard/ios/Sources/KeyboardPlugin/include" ]; then
        cp -f ios/App/CapacitorKeyboard/ios/Sources/KeyboardPlugin/include/*.h "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/"
    fi
fi

# Voltar para o diretório iOS
cd ios/App

echo "=== Script ci_post_clone.sh concluído ==="
echo "Diretório final: $(pwd)"