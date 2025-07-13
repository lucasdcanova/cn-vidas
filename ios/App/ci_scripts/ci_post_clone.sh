#!/bin/sh
set -e

echo "🔧 Script ci_post_clone iniciado..."
echo "📍 Diretório de trabalho: $(pwd)"
echo "📍 CI_WORKSPACE: $CI_WORKSPACE"

# Debug: mostrar estrutura de diretórios
echo "📂 Estrutura de diretórios:"
ls -la "$CI_WORKSPACE" || echo "Erro ao listar CI_WORKSPACE"

# Primeiro, vamos garantir que estamos no diretório correto
if [ -f "$CI_WORKSPACE/ios/App/Podfile" ]; then
    echo "✅ Encontrado Podfile em $CI_WORKSPACE/ios/App/"
    cd "$CI_WORKSPACE/ios/App"
elif [ -f "../../Podfile" ]; then
    echo "✅ Encontrado Podfile em ../../"
    cd ../..
elif [ -f "Podfile" ]; then
    echo "✅ Já estamos no diretório com Podfile"
else
    echo "❌ Erro: Não foi possível encontrar o Podfile"
    echo "Procurando Podfile..."
    find "$CI_WORKSPACE" -name "Podfile" -type f 2>/dev/null || echo "Nenhum Podfile encontrado"
    exit 1
fi

echo "📦 Instalando CocoaPods..."
echo "Diretório atual: $(pwd)"
pod install || echo "⚠️ Falha ao executar pod install"

# Voltar para o diretório raiz
cd "$CI_WORKSPACE"

echo "📦 Copiando arquivos dos plugins Capacitor..."

# Criar diretórios necessários
mkdir -p node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin
mkdir -p node_modules/@capacitor/browser/ios/Sources/BrowserPlugin

# Copiar Preferences Plugin
echo "📋 Procurando arquivos do plugin preferences..."
if [ -d "ios/App/Pods/CapacitorPreferences/ios/Sources/PreferencesPlugin" ]; then
    echo "✅ Encontrado em Pods"
    cp ios/App/Pods/CapacitorPreferences/ios/Sources/PreferencesPlugin/*.swift node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin/ 2>/dev/null || echo "Erro ao copiar"
elif [ -d "ios/App/PluginSources/CapacitorPreferences/Sources/PreferencesPlugin" ]; then
    echo "✅ Encontrado em PluginSources" 
    cp ios/App/PluginSources/CapacitorPreferences/Sources/PreferencesPlugin/*.swift node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin/ 2>/dev/null || echo "Erro ao copiar"
else
    echo "❌ Arquivos do plugin preferences não encontrados"
    echo "Procurando arquivos PreferencesPlugin.swift..."
    find . -name "PreferencesPlugin.swift" -type f 2>/dev/null | head -5
fi

# Copiar Browser Plugin
echo "📋 Procurando arquivos do plugin browser..."
if [ -d "ios/App/Pods/CapacitorBrowser/ios/Sources/BrowserPlugin" ]; then
    echo "✅ Encontrado em Pods"
    cp ios/App/Pods/CapacitorBrowser/ios/Sources/BrowserPlugin/*.swift node_modules/@capacitor/browser/ios/Sources/BrowserPlugin/ 2>/dev/null || echo "Erro ao copiar"
elif [ -d "ios/App/PluginSources/CapacitorBrowser/Sources/BrowserPlugin" ]; then
    echo "✅ Encontrado em PluginSources"
    cp ios/App/PluginSources/CapacitorBrowser/Sources/BrowserPlugin/*.swift node_modules/@capacitor/browser/ios/Sources/BrowserPlugin/ 2>/dev/null || echo "Erro ao copiar"
else
    echo "❌ Arquivos do plugin browser não encontrados"
    echo "Procurando arquivos BrowserPlugin.swift..."
    find . -name "BrowserPlugin.swift" -type f 2>/dev/null | head -5
fi

# Verificar resultados
echo "📋 Verificando arquivos copiados:"
echo "Preferences:"
ls -la node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin/*.swift 2>/dev/null || echo "❌ Nenhum arquivo Swift em preferences"
echo "Browser:"
ls -la node_modules/@capacitor/browser/ios/Sources/BrowserPlugin/*.swift 2>/dev/null || echo "❌ Nenhum arquivo Swift em browser"

echo "✅ Script ci_post_clone concluído!"