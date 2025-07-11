#!/bin/sh
set -e

echo "🔧 Script ci_pre_xcodebuild iniciado..."
echo "📍 Diretório de trabalho atual: $(pwd)"
echo "📂 Conteúdo do diretório:"
ls -la

# Detectar onde estamos
if [ -f "../../Podfile" ]; then
    echo "⚠️  Estamos em um subdiretório, voltando para App..."
    cd ../..
elif [ -f "../Podfile" ]; then
    echo "⚠️  Estamos em um subdiretório, voltando para App..."
    cd ..
elif [ ! -f "Podfile" ]; then
    echo "❌ Erro: Podfile não encontrado!"
    echo "📍 Diretório atual: $(pwd)"
    echo "📂 Estrutura de diretórios:"
    find . -name "Podfile" -type f | head -10
    exit 1
fi

echo "✅ Diretório correto confirmado: $(pwd)"
echo "📋 Verificando arquivos do Pods..."

# Verificar se os arquivos xcconfig existem
if [ -d "Pods/Target Support Files" ]; then
    echo "✅ Diretório 'Target Support Files' encontrado"
    
    # Listar alguns arquivos para debug
    echo "📂 Arquivos xcconfig encontrados:"
    find "Pods/Target Support Files" -name "*.xcconfig" | head -5
else
    echo "❌ Erro: Diretório 'Pods/Target Support Files' não encontrado!"
    exit 1
fi

echo "✅ Script ci_pre_xcodebuild concluído com sucesso!"