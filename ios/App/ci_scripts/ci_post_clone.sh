#!/bin/sh
set -e

echo "🔧 Script ci_post_clone iniciado..."
echo "📍 Diretório de trabalho: $(pwd)"

# Navegar para o diretório App (que contém o Podfile)
# O script está em ios/App/ci_scripts, então precisamos voltar um nível
cd ..

echo "📍 Novo diretório: $(pwd)"
echo "📂 Conteúdo do diretório:"
ls -la

# Verificar se estamos no diretório correto
if [ ! -f "Podfile" ]; then
    echo "❌ Erro: Podfile não encontrado no diretório atual"
    echo "Tentando encontrar o Podfile..."
    find ../.. -name "Podfile" -type f 2>/dev/null | head -5
    exit 1
fi

echo "✅ Podfile encontrado!"

echo "📦 Instalando CocoaPods..."
pod install || echo "⚠️ Falha ao executar pod install"

# Voltar para o diretório raiz do repositório
cd ../..
REPO_ROOT=$(pwd)
echo "📍 Diretório raiz do repositório: $REPO_ROOT"

echo "📦 Copiando arquivos dos plugins Capacitor..."

# Criar diretórios necessários
mkdir -p "$REPO_ROOT/node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin"
mkdir -p "$REPO_ROOT/node_modules/@capacitor/browser/ios/Sources/BrowserPlugin"

# Copiar Preferences Plugin
echo "📋 Procurando arquivos do plugin preferences..."
if [ -d "$REPO_ROOT/ios/App/Pods/CapacitorPreferences/ios/Sources/PreferencesPlugin" ]; then
    echo "✅ Encontrado em Pods"
    cp "$REPO_ROOT/ios/App/Pods/CapacitorPreferences/ios/Sources/PreferencesPlugin"/*.swift "$REPO_ROOT/node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin/" 2>/dev/null || echo "Erro ao copiar"
else
    echo "❌ Não encontrado em Pods"
    echo "Procurando arquivos PreferencesPlugin.swift no repositório..."
    find "$REPO_ROOT" -name "PreferencesPlugin.swift" -type f 2>/dev/null | grep -v node_modules | head -5
fi

# Copiar Browser Plugin
echo "📋 Procurando arquivos do plugin browser..."
if [ -d "$REPO_ROOT/ios/App/Pods/CapacitorBrowser/ios/Sources/BrowserPlugin" ]; then
    echo "✅ Encontrado em Pods"
    cp "$REPO_ROOT/ios/App/Pods/CapacitorBrowser/ios/Sources/BrowserPlugin"/*.swift "$REPO_ROOT/node_modules/@capacitor/browser/ios/Sources/BrowserPlugin/" 2>/dev/null || echo "Erro ao copiar"
else
    echo "❌ Não encontrado em Pods"
    echo "Procurando arquivos BrowserPlugin.swift no repositório..."
    find "$REPO_ROOT" -name "BrowserPlugin.swift" -type f 2>/dev/null | grep -v node_modules | head -5
fi

# Verificar resultados
echo "📋 Verificando arquivos copiados:"
echo "Preferences:"
ls -la "$REPO_ROOT/node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin/"*.swift 2>/dev/null || echo "❌ Nenhum arquivo Swift em preferences"
echo "Browser:"
ls -la "$REPO_ROOT/node_modules/@capacitor/browser/ios/Sources/BrowserPlugin/"*.swift 2>/dev/null || echo "❌ Nenhum arquivo Swift em browser"

echo "✅ Script ci_post_clone concluído!"