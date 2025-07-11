# Scripts de Teste - Registro de Parceiros

Este diretório contém scripts para testar o fluxo de registro e onboarding de parceiros no sistema CNVidas.

## Scripts Disponíveis

### 1. test-partner-registration.js (Node.js)
Script completo em Node.js que testa todo o fluxo de registro.

**Uso:**
```bash
node test-partner-registration.js [URL_BASE]
# ou
./test-partner-registration.js
```

**Exemplo:**
```bash
# Teste local
node test-partner-registration.js

# Teste em staging
node test-partner-registration.js https://staging.cnvidas.com
```

### 2. test-partner-registration.sh (Bash/cURL)
Script simplificado usando cURL para testes rápidos.

**Requisitos:**
- curl
- jq (para formatação JSON)

**Uso:**
```bash
./test-partner-registration.sh [URL_BASE]
```

**Exemplo:**
```bash
# Teste local
./test-partner-registration.sh

# Teste em produção
./test-partner-registration.sh https://cnvidas.com
```

### 3. test-partner-registration.py (Python)
Script mais detalhado com melhor formatação e análise.

**Requisitos:**
- Python 3.x
- requests (`pip install requests`)

**Uso:**
```bash
python3 test-partner-registration.py [URL_BASE]
# ou
./test-partner-registration.py
```

**Exemplo:**
```bash
# Teste local
python3 test-partner-registration.py

# Teste com URL customizada
python3 test-partner-registration.py http://localhost:3000
```

## O que os Scripts Testam

1. **Registro de Parceiro**
   - Cria um novo parceiro com dados válidos
   - Verifica se o registro foi bem-sucedido
   - Confirma recebimento do cookie de autenticação

2. **Login Automático**
   - Verifica se o usuário foi autenticado automaticamente após o registro
   - Testa endpoint `/api/user` para confirmar autenticação

3. **Acesso ao Onboarding**
   - Tenta acessar `/partner-onboarding`
   - Verifica se não há redirecionamento para login
   - Confirma que a página de onboarding é carregada

4. **API do Parceiro**
   - Testa endpoint `/api/partners/me`
   - Verifica se os dados do parceiro são retornados
   - Confirma status do onboarding

## Interpretando os Resultados

### ✅ Sucesso Total
Todos os 4 testes passaram - o fluxo está funcionando corretamente.

### ⚠️ Falhas Comuns

1. **"Redirecionado para login"**
   - O login automático não funcionou
   - Verificar configuração de cookies
   - Verificar middleware de autenticação

2. **"API do parceiro falhou"**
   - Perfil do parceiro não foi criado
   - Verificar lógica de criação pós-registro

3. **"Erro 404 em partner-onboarding"**
   - Rota não configurada corretamente
   - Verificar rotas no frontend

## Dados de Teste

Os scripts criam parceiros com:
- Email único com timestamp
- CNPJ válido: 48.780.455/0001-01
- Senha: senha123
- Nome: Empresa Teste [timestamp]

## Limpeza

Os parceiros de teste criados permanecerão no banco de dados. Para limpar:

```sql
-- Remover parceiros de teste
DELETE FROM users WHERE email LIKE 'partner.test.%@example.com';
```

## Troubleshooting

### Erro de Certificado SSL
Se estiver testando com HTTPS e certificados auto-assinados, os scripts já desabilitam a verificação SSL.

### Erro de Conexão
Verifique se o servidor está rodando na URL especificada.

### Erro 500
Verifique os logs do servidor para erros de backend.

## Executando Todos os Testes

```bash
# Script para executar todos os testes
echo "🧪 Executando teste Node.js..."
node test-partner-registration.js

echo -e "\n🧪 Executando teste Bash..."
./test-partner-registration.sh

echo -e "\n🧪 Executando teste Python..."
python3 test-partner-registration.py
```