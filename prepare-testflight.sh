#!/bin/bash

echo "🚀 Preparando CNVidas para TestFlight..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar se estamos no diretório correto
if [ ! -d "ios/App" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Checklist de preparação:${NC}"

# 2. Build do projeto web
echo -e "\n${YELLOW}🔨 Fazendo build do projeto web...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build do projeto${NC}"
    exit 1
fi

# 3. Sincronizar com iOS
echo -e "\n${YELLOW}📱 Sincronizando com iOS...${NC}"
npx cap sync ios

# 4. Verificar versão atual
echo -e "\n${YELLOW}📊 Informações do build:${NC}"
cd ios/App
MARKETING_VERSION=$(xcodebuild -showBuildSettings | grep MARKETING_VERSION | head -1 | awk '{print $3}')
CURRENT_PROJECT_VERSION=$(xcodebuild -showBuildSettings | grep CURRENT_PROJECT_VERSION | head -1 | awk '{print $3}')
echo "Versão: $MARKETING_VERSION"
echo "Build: $CURRENT_PROJECT_VERSION"
cd ../..

# 5. Lembrete de screenshots
echo -e "\n${YELLOW}📸 Lembrete de Screenshots:${NC}"
echo "- iPhone 6.7\" (1290 x 2796)"
echo "- iPhone 6.5\" (1242 x 2688)"
echo "- iPhone 5.5\" (1242 x 2208)"
echo "- iPad 12.9\" (2048 x 2732)"

# 6. Checklist final
echo -e "\n${GREEN}✅ Preparação concluída!${NC}"
echo -e "\n${YELLOW}📋 Próximos passos:${NC}"
echo "1. Abra o Xcode: cd ios/App && open App.xcworkspace"
echo "2. Selecione 'Any iOS Device (arm64)' como destino"
echo "3. Product > Archive"
echo "4. Validate e Upload para App Store Connect"
echo ""
echo -e "${YELLOW}⚠️  Verificações importantes:${NC}"
echo "- [ ] Testou no dispositivo físico?"
echo "- [ ] Removeu console.logs de debug?"
echo "- [ ] Verificou URLs de produção?"
echo "- [ ] Testou login e funcionalidades principais?"
echo ""
echo -e "${GREEN}Boa sorte com o lançamento! 🚀${NC}"