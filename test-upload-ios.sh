#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações
BASE_URL="${1:-https://www.homologacao.cnvidas.com.br}"
EMAIL="lucas.canova@hotmail.com"
PASSWORD="666666"
TEST_IMAGE="test-profile.jpg"

echo -e "${CYAN}🚀 Teste de Upload de Foto - iOS Simulator${NC}"
echo -e "${BLUE}   URL: $BASE_URL${NC}"
echo -e "${BLUE}   Usuário: $EMAIL${NC}"
echo ""

# Criar imagem de teste se não existir
if [ ! -f "$TEST_IMAGE" ]; then
    echo -e "${YELLOW}📸 Criando imagem de teste...${NC}"
    # Criar uma imagem de teste simples usando ImageMagick (se disponível)
    if command -v convert &> /dev/null; then
        convert -size 100x100 xc:blue "$TEST_IMAGE"
    else
        # Criar um arquivo JPEG mínimo
        printf "\xFF\xD8\xFF\xE0\x00\x10\x4A\x46\x49\x46\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xFF\xDB\x00\x43\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\x09\x09\x08\x0A\x0C\x14\x0D\x0C\x0B\x0B\x0C\x19\x12\x13\x0F\x14\x1D\x1A\x1F\x1E\x1D\x1A\x1C\x1C\x20\x24\x2E\x27\x20\x22\x2C\x23\x1C\x1C\x28\x37\x29\x2C\x30\x31\x34\x34\x34\x1F\x27\x39\x3D\x38\x32\x3C\x2E\x33\x34\x32\xFF\xDB\x00\x43\x01\x09\x09\x09\x0C\x0B\x0C\x18\x0D\x0D\x18\x32\x21\x1C\x21\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\x32\xFF\xC0\x00\x11\x08\x00\x01\x00\x01\x03\x01\x22\x00\x02\x11\x01\x03\x11\x01\xFF\xC4\x00\x1F\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\xFF\xC4\x00\xB5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01\x7D\x01\x02\x03\x00\x04\x11\x05\x12\x21\x31\x41\x06\x13\x51\x61\x07\x22\x71\x14\x32\x81\x91\xA1\x08\x23\x42\xB1\xC1\x15\x52\xD1\xF0\x24\x33\x62\x72\x82\x09\x0A\x16\x17\x18\x19\x1A\x25\x26\x27\x28\x29\x2A\x34\x35\x36\x37\x38\x39\x3A\x43\x44\x45\x46\x47\x48\x49\x4A\x53\x54\x55\x56\x57\x58\x59\x5A\x63\x64\x65\x66\x67\x68\x69\x6A\x73\x74\x75\x76\x77\x78\x79\x7A\x83\x84\x85\x86\x87\x88\x89\x8A\x92\x93\x94\x95\x96\x97\x98\x99\x9A\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFF\xC4\x00\x1F\x01\x00\x03\x01\x01\x01\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\xFF\xC4\x00\xB5\x11\x00\x02\x01\x02\x04\x04\x03\x04\x07\x05\x04\x04\x00\x01\x02\x77\x00\x01\x02\x03\x11\x04\x05\x21\x31\x06\x12\x41\x51\x07\x61\x71\x13\x22\x32\x81\x08\x14\x42\x91\xA1\xB1\xC1\x09\x23\x33\x52\xF0\x15\x62\x72\xD1\x0A\x16\x24\x34\xE1\x25\xF1\x17\x18\x19\x1A\x26\x27\x28\x29\x2A\x35\x36\x37\x38\x39\x3A\x43\x44\x45\x46\x47\x48\x49\x4A\x53\x54\x55\x56\x57\x58\x59\x5A\x63\x64\x65\x66\x67\x68\x69\x6A\x73\x74\x75\x76\x77\x78\x79\x7A\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x92\x93\x94\x95\x96\x97\x98\x99\x9A\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFF\xDA\x00\x0C\x03\x01\x00\x02\x11\x03\x11\x00\x3F\x00\xF4\xFF\xD9" > "$TEST_IMAGE"
    fi
    echo -e "${GREEN}✅ Imagem de teste criada${NC}"
fi

# Função para fazer login
echo -e "\n${CYAN}🔐 Fazendo login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    -c cookies.txt)

# Extrair token do response
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Falha no login${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Login bem-sucedido!${NC}"
echo -e "${BLUE}   Token obtido: ${TOKEN:0:20}...${NC}"

# Extrair informações do usuário
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
USER_EMAIL=$(echo "$LOGIN_RESPONSE" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
USER_ROLE=$(echo "$LOGIN_RESPONSE" | grep -o '"role":"[^"]*' | cut -d'"' -f4)

echo -e "${BLUE}   User ID: $USER_ID${NC}"
echo -e "${BLUE}   Email: $USER_EMAIL${NC}"
echo -e "${BLUE}   Role: $USER_ROLE${NC}"

# Testar upload com diferentes configurações de headers
echo -e "\n${CYAN}📤 Testando upload de foto...${NC}"

# Teste 1: Upload padrão
echo -e "\n${YELLOW}Teste 1: Upload com headers padrão${NC}"
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/profile/upload-image" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Auth-Token: $TOKEN" \
    -b cookies.txt \
    -F "profileImage=@$TEST_IMAGE" \
    -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$UPLOAD_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
RESPONSE_BODY=$(echo "$UPLOAD_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

echo -e "Status: $HTTP_CODE"
echo -e "Response: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Upload bem-sucedido!${NC}"
    IMAGE_URL=$(echo "$RESPONSE_BODY" | grep -o '"imageUrl":"[^"]*' | cut -d'"' -f4)
    if [ ! -z "$IMAGE_URL" ]; then
        echo -e "${CYAN}🖼️  URL da imagem: $IMAGE_URL${NC}"
    fi
else
    echo -e "${RED}❌ Upload falhou${NC}"
fi

# Teste 2: Simular iOS com User-Agent
echo -e "\n${YELLOW}Teste 2: Upload simulando iOS${NC}"
UPLOAD_RESPONSE_IOS=$(curl -s -X POST "$BASE_URL/api/profile/upload-image" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Auth-Token: $TOKEN" \
    -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148" \
    -H "X-Platform: ios" \
    -H "X-Request-Source: capacitor" \
    -b cookies.txt \
    -F "profileImage=@$TEST_IMAGE" \
    -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE_IOS=$(echo "$UPLOAD_RESPONSE_IOS" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
RESPONSE_BODY_IOS=$(echo "$UPLOAD_RESPONSE_IOS" | sed 's/HTTP_CODE:[0-9]*$//')

echo -e "Status: $HTTP_CODE_IOS"
echo -e "Response: $RESPONSE_BODY_IOS"

if [ "$HTTP_CODE_IOS" = "200" ]; then
    echo -e "${GREEN}✅ Upload iOS bem-sucedido!${NC}"
else
    echo -e "${RED}❌ Upload iOS falhou${NC}"
fi

# Verificar perfil após upload
echo -e "\n${CYAN}🔍 Verificando perfil do usuário...${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/users/profile" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Auth-Token: $TOKEN" \
    -b cookies.txt)

PROFILE_IMAGE=$(echo "$PROFILE_RESPONSE" | grep -o '"profileImage":"[^"]*' | cut -d'"' -f4)
FULL_NAME=$(echo "$PROFILE_RESPONSE" | grep -o '"fullName":"[^"]*' | cut -d'"' -f4)

echo -e "${BLUE}   Nome: $FULL_NAME${NC}"
echo -e "${BLUE}   Imagem: ${PROFILE_IMAGE:-Nenhuma}${NC}"

# Limpar
rm -f cookies.txt

echo -e "\n${GREEN}✅ Teste concluído!${NC}"