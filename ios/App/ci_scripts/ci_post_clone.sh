#!/bin/sh
set -e

echo "🔧 Script ci_post_clone iniciado..."
echo "📍 Diretório de trabalho: $(pwd)"

# Navegar para o diretório iOS/App
if [ -d "$CI_WORKSPACE/ios/App" ]; then
    cd "$CI_WORKSPACE/ios/App"
elif [ -d "../.." ] && [ -f "../../Podfile" ]; then
    # Se estivermos em ci_scripts, voltar para App
    cd ../..
else
    echo "❌ Erro: Não foi possível encontrar o diretório iOS/App"
    echo "Estrutura de diretórios:"
    ls -la "$CI_WORKSPACE"
    exit 1
fi

echo "📦 Instalando CocoaPods..."
pod install || echo "⚠️ Falha ao executar pod install"

# Voltar para o diretório raiz
cd "$CI_WORKSPACE"

echo "📦 Criando estrutura de diretórios para plugins Capacitor..."

# Criar diretórios necessários
mkdir -p node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin
mkdir -p node_modules/@capacitor/browser/ios/Sources/BrowserPlugin

# Copiar arquivos do Preferences
echo "📋 Copiando arquivos do plugin Preferences..."
if [ -f "ios/App/Pods/CapacitorPreferences/ios/Sources/PreferencesPlugin/Preferences.swift" ]; then
    cp ios/App/Pods/CapacitorPreferences/ios/Sources/PreferencesPlugin/*.swift node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin/
    echo "✅ Plugin @capacitor/preferences copiado com sucesso"
else
    # Tentar copiar de outros locais possíveis
    echo "⚠️ Arquivos não encontrados em Pods, tentando PluginSources..."
    if [ -d "ios/App/PluginSources/CapacitorPreferences" ]; then
        find ios/App/PluginSources/CapacitorPreferences -name "*.swift" -exec cp {} node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin/ \;
        echo "✅ Copiado de PluginSources"
    else
        echo "❌ Arquivos do plugin Preferences não encontrados"
    fi
fi

# Copiar arquivos do Browser
echo "📋 Copiando arquivos do plugin Browser..."
if [ -f "ios/App/Pods/CapacitorBrowser/ios/Sources/BrowserPlugin/Browser.swift" ]; then
    cp ios/App/Pods/CapacitorBrowser/ios/Sources/BrowserPlugin/*.swift node_modules/@capacitor/browser/ios/Sources/BrowserPlugin/
    echo "✅ Plugin @capacitor/browser copiado com sucesso"
else
    # Tentar copiar de outros locais possíveis
    echo "⚠️ Arquivos não encontrados em Pods, tentando PluginSources..."
    if [ -d "ios/App/PluginSources/CapacitorBrowser" ]; then
        find ios/App/PluginSources/CapacitorBrowser -name "*.swift" -exec cp {} node_modules/@capacitor/browser/ios/Sources/BrowserPlugin/ \;
        echo "✅ Copiado de PluginSources"
    else
        echo "❌ Arquivos do plugin Browser não encontrados"
    fi
fi

# Listar arquivos copiados para verificação
echo "📋 Verificando arquivos copiados:"
echo "Preferences:"
ls -la node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin/ 2>/dev/null || echo "Diretório não existe"
echo "Browser:"
ls -la node_modules/@capacitor/browser/ios/Sources/BrowserPlugin/ 2>/dev/null || echo "Diretório não existe"

echo "✅ Script ci_post_clone concluído!"