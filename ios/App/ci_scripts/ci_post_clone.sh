#!/bin/sh
set -e

echo "🔧 Script ci_post_clone iniciado..."
echo "📍 Diretório de trabalho: $(pwd)"

# Navegar para o diretório raiz do repositório
cd "$CI_WORKSPACE"

echo "📦 Criando estrutura de diretórios para plugins Capacitor..."

# Copiar plugin Preferences
SOURCE_DIR="ios/App/PluginSources/CapacitorPreferences/Sources/PreferencesPlugin"
TARGET_DIR="node_modules/@capacitor/preferences/ios/Sources/PreferencesPlugin"

if [ -d "$SOURCE_DIR" ]; then
    echo "📂 Criando diretório: $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
    
    echo "📋 Copiando arquivos de Preferences"
    cp -R "$SOURCE_DIR"/* "$TARGET_DIR/" || true
    
    echo "✅ Plugin @capacitor/preferences copiado com sucesso"
else
    echo "⚠️  Diretório fonte não encontrado: $SOURCE_DIR"
fi

# Copiar plugin Browser
SOURCE_DIR="ios/App/PluginSources/CapacitorBrowser/Sources/BrowserPlugin"
TARGET_DIR="node_modules/@capacitor/browser/ios/Sources/BrowserPlugin"

if [ -d "$SOURCE_DIR" ]; then
    echo "📂 Criando diretório: $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
    
    echo "📋 Copiando arquivos de Browser"
    cp -R "$SOURCE_DIR"/* "$TARGET_DIR/" || true
    
    echo "✅ Plugin @capacitor/browser copiado com sucesso"
else
    echo "⚠️  Diretório fonte não encontrado: $SOURCE_DIR"
fi

# Listar arquivos copiados para verificação
echo "📋 Verificando arquivos copiados:"
find node_modules/@capacitor/preferences/ios/Sources -type f -name "*.swift" 2>/dev/null || echo "Nenhum arquivo Swift encontrado em preferences"
find node_modules/@capacitor/browser/ios/Sources -type f -name "*.swift" 2>/dev/null || echo "Nenhum arquivo Swift encontrado em browser"

echo "✅ Script ci_post_clone concluído!"