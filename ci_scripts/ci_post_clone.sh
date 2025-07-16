#!/bin/sh

# Script executado APÓS o clone do repositório pelo Xcode Cloud
echo "🎯 Executando script pós-clone do Xcode Cloud..."

# Definir variáveis de ambiente necessárias
export NODE_ENV=production
export VITE_API_URL=https://cnvidas.onrender.com

# Verificar versão do Node.js
echo "📌 Versão do Node.js:"
node --version

# Verificar se estamos no diretório correto
echo "📂 Diretório atual: $(pwd)"
echo "📂 Conteúdo do diretório:"
ls -la

# Tornar scripts executáveis
chmod +x ci_scripts/*.sh

echo "✅ Script pós-clone concluído!"