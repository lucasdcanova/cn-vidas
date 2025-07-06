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

echo "✅ Script post-clone concluído!"