#!/bin/sh

# Script executado APÓS o clone do repositório pelo Xcode Cloud
echo "🎯 Executando script pós-clone do Xcode Cloud..."
echo "📍 Diretório inicial: $(pwd)"
echo "📂 CI_PRIMARY_REPOSITORY_PATH: $CI_PRIMARY_REPOSITORY_PATH"

# Navegar para o diretório do repositório se necessário
if [ -n "$CI_PRIMARY_REPOSITORY_PATH" ]; then
    cd $CI_PRIMARY_REPOSITORY_PATH
    echo "📍 Mudando para: $CI_PRIMARY_REPOSITORY_PATH"
fi

# Verificar se estamos no diretório correto
echo "📂 Diretório atual após navegação: $(pwd)"
echo "📂 Conteúdo do diretório:"
ls -la

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "⚠️ package.json não encontrado!"
    echo "🔍 Procurando package.json..."
    find . -name "package.json" -type f | head -5
fi

# Instalar Node.js 18 se necessário
echo "🔧 Verificando Node.js..."
if ! command -v node >/dev/null 2>&1; then
    echo "📦 Node.js não encontrado. Instalando..."
    # Usar brew para instalar Node.js
    if command -v brew >/dev/null 2>&1; then
        brew install node@18
        export PATH="/opt/homebrew/opt/node@18/bin:$PATH"
    else
        echo "❌ Brew não encontrado. Não é possível instalar Node.js"
    fi
fi

# Verificar versões
echo "📌 Versão do Node.js: $(node --version 2>&1 || echo 'Não instalado')"
echo "📌 Versão do NPM: $(npm --version 2>&1 || echo 'Não instalado')"
echo "📌 Versão do Yarn: $(yarn --version 2>&1 || echo 'Não instalado')"

# Definir variáveis de ambiente necessárias
export NODE_ENV=production
export VITE_API_URL=https://cnvidas.onrender.com

echo "🔧 Variáveis de ambiente configuradas:"
echo "   NODE_ENV=$NODE_ENV"
echo "   VITE_API_URL=$VITE_API_URL"

# Tornar scripts executáveis
if [ -d "ci_scripts" ]; then
    chmod +x ci_scripts/*.sh
    echo "✅ Scripts CI tornados executáveis"
else
    echo "⚠️ Diretório ci_scripts não encontrado"
fi

echo "✅ Script pós-clone concluído!"