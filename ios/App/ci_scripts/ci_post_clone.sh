#!/bin/sh
set -e

echo "🔧 Script ci_post_clone iniciado..."
echo "📍 Diretório de trabalho: $(pwd)"

# Navegar para o diretório raiz do repositório
cd "$CI_WORKSPACE"

echo "📦 Criando estrutura de diretórios para plugins Capacitor..."

# Lista de plugins que precisam ser copiados
PLUGINS=(
    "preferences:PreferencesPlugin"
    "browser:BrowserPlugin"
)

for PLUGIN_INFO in "${PLUGINS[@]}"; do
    PLUGIN_NAME=$(echo "$PLUGIN_INFO" | cut -d: -f1)
    PLUGIN_DIR=$(echo "$PLUGIN_INFO" | cut -d: -f2)
    
    SOURCE_DIR="ios/App/PluginSources/Capacitor${PLUGIN_DIR^}/Sources/${PLUGIN_DIR}"
    TARGET_DIR="node_modules/@capacitor/${PLUGIN_NAME}/ios/Sources/${PLUGIN_DIR}"
    
    if [ -d "$SOURCE_DIR" ]; then
        echo "📂 Criando diretório: $TARGET_DIR"
        mkdir -p "$TARGET_DIR"
        
        echo "📋 Copiando arquivos de $SOURCE_DIR para $TARGET_DIR"
        cp -R "$SOURCE_DIR"/* "$TARGET_DIR/" || true
        
        echo "✅ Plugin @capacitor/${PLUGIN_NAME} copiado com sucesso"
    else
        echo "⚠️  Diretório fonte não encontrado: $SOURCE_DIR"
    fi
done

# Listar arquivos copiados para verificação
echo "📋 Verificando arquivos copiados:"
find node_modules/@capacitor/preferences/ios/Sources -type f -name "*.swift" 2>/dev/null || echo "Nenhum arquivo Swift encontrado em preferences"
find node_modules/@capacitor/browser/ios/Sources -type f -name "*.swift" 2>/dev/null || echo "Nenhum arquivo Swift encontrado em browser"

echo "✅ Script ci_post_clone concluído!"