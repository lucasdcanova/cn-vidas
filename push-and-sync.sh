#!/bin/bash

echo "📤 Fazendo push para o GitHub..."

# Fazer o push
git push origin main

# Verificar se o push foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Push realizado com sucesso!"
    echo "🔄 Iniciando sincronização iOS..."
    
    # Executar sincronização iOS
    ./sync-ios.sh
else
    echo "❌ Erro ao fazer push. Sincronização iOS cancelada."
    exit 1
fi