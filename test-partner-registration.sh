#!/bin/bash

# Script de teste simplificado usando curl
# Uso: ./test-partner-registration.sh [URL_BASE]

# Configurações
BASE_URL="${1:-http://localhost:3000}"
TIMESTAMP=$(date +%s)
EMAIL="partner.test.${TIMESTAMP}@example.com"
CNPJ="48.780.455/0001-01"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Teste de Registro de Parceiro${NC}"
echo -e "${BLUE}📍 URL: ${BASE_URL}${NC}"
echo -e "${BLUE}📧 Email: ${EMAIL}${NC}"
echo ""

# 1. Registrar parceiro
echo -e "${YELLOW}1️⃣ Registrando parceiro...${NC}"

REGISTER_RESPONSE=$(curl -s -c cookies.txt -w "\n%{http_code}" -X POST "${BASE_URL}/api/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'${EMAIL}'",
    "username": "e48780455000101",
    "password": "senha123",
    "fullName": "Empresa Teste '${TIMESTAMP}'",
    "role": "partner",
    "cnpj": "'${CNPJ}'",
    "acceptTerms": true,
    "acceptPrivacy": true,
    "acceptPartnerContract": true
  }')

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n 1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✅ Registro bem-sucedido!${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Falha no registro: HTTP $HTTP_CODE${NC}"
  echo "$BODY"
  exit 1
fi

# 2. Verificar autenticação
echo -e "\n${YELLOW}2️⃣ Verificando autenticação...${NC}"

USER_RESPONSE=$(curl -s -b cookies.txt -w "\n%{http_code}" "${BASE_URL}/api/user")
HTTP_CODE=$(echo "$USER_RESPONSE" | tail -n 1)
BODY=$(echo "$USER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Usuário autenticado!${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Não autenticado: HTTP $HTTP_CODE${NC}"
fi

# 3. Tentar acessar partner-onboarding
echo -e "\n${YELLOW}3️⃣ Verificando acesso ao partner-onboarding...${NC}"

ONBOARDING_RESPONSE=$(curl -s -b cookies.txt -w "\n%{http_code}" -L "${BASE_URL}/partner-onboarding")
HTTP_CODE=$(echo "$ONBOARDING_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "200" ]; then
  # Verificar se não foi redirecionado para login
  if echo "$ONBOARDING_RESPONSE" | grep -q "login\|auth"; then
    echo -e "${RED}❌ Página contém referências a login${NC}"
  else
    echo -e "${GREEN}✅ Acesso ao onboarding permitido!${NC}"
  fi
else
  echo -e "${RED}❌ Erro ao acessar onboarding: HTTP $HTTP_CODE${NC}"
fi

# 4. Verificar dados do parceiro
echo -e "\n${YELLOW}4️⃣ Verificando dados do parceiro...${NC}"

PARTNER_RESPONSE=$(curl -s -b cookies.txt -w "\n%{http_code}" "${BASE_URL}/api/partners/me")
HTTP_CODE=$(echo "$PARTNER_RESPONSE" | tail -n 1)
BODY=$(echo "$PARTNER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Dados do parceiro recuperados!${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}❌ Erro ao recuperar dados: HTTP $HTTP_CODE${NC}"
fi

# Limpar cookies temporários
rm -f cookies.txt

echo -e "\n${BLUE}📊 Teste concluído!${NC}"