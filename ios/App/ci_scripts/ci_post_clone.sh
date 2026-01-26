#!/bin/sh
set -e

echo "🔧 Script ci_post_clone iniciado..."
echo "📍 Diretório de trabalho: $(pwd)"

# Voltar para o diretório raiz do repositório (ci_scripts -> App -> ios -> root)
cd ../../..
REPO_ROOT=$(pwd)
echo "📍 Diretório raiz do repositório: $REPO_ROOT"

# =====================================================
# PARTE 1: Build do Web App e Capacitor Sync
# =====================================================

echo "📦 Instalando dependências npm..."
if [ -f "package-lock.json" ]; then
    npm ci
elif [ -f "yarn.lock" ]; then
    npm install -g yarn
    yarn install --frozen-lockfile
else
    npm install
fi

echo "🔨 Construindo web app..."
npm run build

# Verificar se o build foi bem sucedido
if [ ! -f "dist/client/index.html" ]; then
    echo "❌ Erro: Build falhou - index.html não foi criado"
    exit 1
fi
echo "✅ Build do web app concluído!"

echo "📱 Sincronizando com Capacitor iOS..."
npx cap sync ios

# Verificar se a sincronização foi bem sucedida
if [ ! -f "ios/App/App/public/index.html" ]; then
    echo "❌ Erro: Sincronização falhou - arquivos não foram copiados para iOS"
    exit 1
fi
echo "✅ Capacitor sync concluído!"

# Verificar arquivos copiados
echo "📋 Verificando arquivos em ios/App/App/public/assets/:"
ls -la ios/App/App/public/assets/ | head -20

# =====================================================
# PARTE 2: CocoaPods
# =====================================================

# Navegar para o diretório App (que contém o Podfile)
cd "$REPO_ROOT/ios/App"

echo "📍 Novo diretório: $(pwd)"
echo "📂 Conteúdo do diretório:"
ls -la

# Verificar se estamos no diretório correto
if [ ! -f "Podfile" ]; then
    echo "❌ Erro: Podfile não encontrado no diretório atual"
    echo "Tentando encontrar o Podfile..."
    find "$REPO_ROOT" -name "Podfile" -type f 2>/dev/null | head -5
    exit 1
fi

echo "✅ Podfile encontrado!"

echo "📦 Instalando CocoaPods..."
pod install || echo "⚠️ Falha ao executar pod install"

# =====================================================
# PARTE 3: Copiar arquivos de plugins Capacitor (se necessário)
# =====================================================

cd "$REPO_ROOT"
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