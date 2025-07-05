#!/bin/sh

# Script executado APÓS o clone do repositório pelo Xcode Cloud
# Este script configura o ambiente inicial

echo "🔧 Configurando ambiente após clone..."

# Definir variáveis de ambiente se necessário
export NODE_ENV=production

# Verificar versão do Node.js
echo "📌 Versão do Node.js:"
node --version

# Verificar versão do npm/yarn
echo "📌 Versão do npm:"
npm --version

if command -v yarn >/dev/null 2>&1; then
    echo "📌 Versão do yarn:"
    yarn --version
fi

# Criar arquivos de configuração se necessário
# Por exemplo, criar arquivo .env se precisar
if [ ! -f ".env" ] && [ ! -z "$CI_STRIPE_PUBLIC_KEY" ]; then
    echo "🔐 Criando arquivo de configuração..."
    cat > .env << EOF
VITE_STRIPE_PUBLIC_KEY=$CI_STRIPE_PUBLIC_KEY
VITE_API_URL=$CI_API_URL
VITE_DAILY_API_KEY=$CI_DAILY_API_KEY
EOF
fi

echo "✅ Configuração inicial concluída!"