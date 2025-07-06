#!/bin/sh

set -e

# Script executado pelo Xcode Cloud após clonar o repositório

echo "🚀 Iniciando script post-clone..."

# Debug: mostrar ambiente
echo "📍 Diretório atual: $(pwd)"
echo "📁 Conteúdo da raiz:"
ls -la

# Criar arquivo .env a partir das variáveis de ambiente do Xcode Cloud
echo "🔧 Criando arquivo .env..."
cat > .env << EOF
# Gerado automaticamente pelo Xcode Cloud
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET

# Stripe
STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET

# Database
DATABASE_URL=$DATABASE_URL

# Email
EMAIL_HOST=$EMAIL_HOST
EMAIL_PORT=$EMAIL_PORT
EMAIL_USERNAME=$EMAIL_USERNAME
EMAIL_PASSWORD=$EMAIL_PASSWORD
EMAIL_FROM="$EMAIL_FROM"

# Daily.co
DAILY_API_KEY=$DAILY_API_KEY

# OpenAI
OPENAI_API_KEY=$OPENAI_API_KEY

# URLs
FRONTEND_URL=$FRONTEND_URL
BACKEND_URL=$BACKEND_URL

# Environment
NODE_ENV=production

# WhatsApp (opcional)
WHATSAPP_API_KEY=$WHATSAPP_API_KEY
WHATSAPP_PHONE_NUMBER=$WHATSAPP_PHONE_NUMBER
EOF

if [ -f ".env" ]; then
    echo "✅ Arquivo .env criado com sucesso"
else
    echo "❌ Erro: Arquivo .env não foi criado"
    exit 1
fi

# Instalar dependências do Node.js
echo "📦 Instalando dependências do Node.js..."
npm ci || npm install

# Verificar se node_modules foi criado
if [ -d "node_modules" ]; then
    echo "✅ Dependências instaladas com sucesso"
else
    echo "❌ Erro: Falha ao instalar dependências"
    exit 1
fi

# Verificar se estamos no diretório correto
echo "📂 Verificando estrutura do projeto..."
if [ -d "ios/App" ]; then
    echo "✅ Diretório iOS encontrado"
    ls -la ios/App/
else
    echo "❌ Erro: Diretório ios/App não encontrado!"
    exit 1
fi

# Criar estrutura completa do CapacitorKeyboard
echo "🔧 Criando estrutura do CapacitorKeyboard..."
KEYBOARD_PATH="node_modules/@capacitor/keyboard"
mkdir -p "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include"

# Copiar arquivos do CapacitorKeyboard do repositório
echo "📋 Copiando arquivos do CapacitorKeyboard..."
if [ -d "ios/App/CapacitorKeyboard/ios" ]; then
    cp -R ios/App/CapacitorKeyboard/ios/* "${KEYBOARD_PATH}/ios/" 2>/dev/null || true
    echo "✅ Arquivos copiados com sucesso"
    
    # Listar arquivos copiados para debug
    echo "📁 Arquivos em ${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/:"
    ls -la "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/" || echo "Diretório não encontrado"
else
    echo "⚠️ Diretório ios/App/CapacitorKeyboard não encontrado!"
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
    
    echo "✅ Arquivos de header criados manualmente"
fi

# Verificar se os arquivos existem
echo "🔍 Verificando arquivos do CapacitorKeyboard..."
if [ -f "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/KeyboardPlugin.h" ]; then
    echo "✅ KeyboardPlugin.h existe"
    echo "  Tamanho: $(wc -c < "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/KeyboardPlugin.h") bytes"
else
    echo "❌ KeyboardPlugin.h NÃO encontrado!"
fi

if [ -f "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/Keyboard.h" ]; then
    echo "✅ Keyboard.h existe"
    echo "  Tamanho: $(wc -c < "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/Keyboard.h") bytes"
else
    echo "❌ Keyboard.h NÃO encontrado!"
fi

# Build do projeto web
echo "🏗️ Fazendo build do projeto..."
npm run build

# Sincronizar com iOS
echo "📱 Sincronizando com Capacitor iOS..."
npx cap sync ios

# Verificar novamente após sync
echo "🔍 Verificação após sync..."
if [ -f "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/KeyboardPlugin.h" ]; then
    echo "✅ KeyboardPlugin.h ainda existe após sync"
else
    echo "⚠️ KeyboardPlugin.h foi removido pelo sync!"
    
    # Re-copiar se necessário
    echo "🔄 Re-copiando arquivos..."
    mkdir -p "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include"
    if [ -d "ios/App/CapacitorKeyboard/ios/Sources/KeyboardPlugin/include" ]; then
        cp -f ios/App/CapacitorKeyboard/ios/Sources/KeyboardPlugin/include/*.h "${KEYBOARD_PATH}/ios/Sources/KeyboardPlugin/include/"
        echo "✅ Arquivos re-copiados"
    fi
fi

echo "✅ Script post-clone concluído!"