#!/bin/bash

echo "🚀 Iniciando servidor CNVidas com logs detalhados..."
echo "📝 Todos os logs serão exibidos no terminal"
echo "🔍 Procure por logs com [ProcessRecording] e [MedicalRecordEditor]"
echo "-------------------------------------------"

cd /Users/lucascanova/Documents/CNVidas\ 1.0/CNVidas-updated

# Garantir que as dependências estão instaladas
echo "📦 Verificando dependências..."
npm install

# Iniciar o servidor com logs detalhados
echo "🖥️ Iniciando servidor..."
npm run dev