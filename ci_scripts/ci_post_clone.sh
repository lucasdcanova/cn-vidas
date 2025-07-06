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