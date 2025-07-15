# Guia de Teste - Planos Corporativos CNVidas

## 1. Preparação do Ambiente

### 1.1 Aplicar a Migration
```bash
# Verificar se a migration foi aplicada
psql $DATABASE_URL -c "SELECT * FROM migrations WHERE name LIKE '%corporate%';"

# Se não foi aplicada, executar:
psql $DATABASE_URL < db/migrations/0017_add_corporate_plans.sql
```

### 1.2 Verificar se os Planos foram Criados
```sql
-- Conectar ao banco
psql $DATABASE_URL

-- Verificar planos corporativos
SELECT * FROM corporate_subscription_plans ORDER BY plan_type, min_employees;

-- Deve retornar 9 registros (3 planos x 3 tiers cada)
```

## 2. Teste como Parceiro

### 2.1 Login como Parceiro
1. Acesse http://localhost:3000/login
2. Use credenciais de um parceiro existente ou crie um novo

### 2.2 Acessar Planos Corporativos
1. No menu lateral, clique em "Planos Corporativos"
2. URL: http://localhost:3000/partner/corporate-plans

### 2.3 Testar Configurador de Planos
1. **Slider de Funcionários**:
   - Mova o slider para diferentes valores (10, 75, 250)
   - Observe a mudança de tier (5-50, 51-200, 201+)
   - Verifique se o preço por funcionário muda

2. **Período de Cobrança**:
   - Selecione Mensal (sem desconto)
   - Selecione Semestral (5% desconto)
   - Selecione Anual (8% desconto)
   - Confirme que o preço total reflete o desconto

3. **Seleção de Plano**:
   - Clique em cada card de plano (Básico, Premium, Ultra)
   - Verifique as características de cada plano
   - Observe o destaque visual do plano selecionado

### 2.4 Contratar Plano
1. Configure: 15 funcionários, Premium, Mensal
2. Clique em "Contratar Plano Corporativo"
3. No modal de checkout:
   - Selecione método de pagamento (Cartão)
   - Use cartão de teste: 4242 4242 4242 4242
   - Data: qualquer futura, CVC: qualquer 3 dígitos
4. Complete o pagamento

## 3. Gerenciar Colaboradores

### 3.1 Acessar Página de Colaboradores
1. Após contratar, vá para "Colaboradores" no menu
2. URL: http://localhost:3000/partner/corporate-employees

### 3.2 Convidar Colaborador
1. Clique em "Convidar Colaborador"
2. Preencha:
   - Email: teste1@empresa.com
   - Nome: João Silva
3. Clique em "Enviar Convite"

### 3.3 Verificar Convite no Banco
```sql
-- Ver convites enviados
SELECT * FROM corporate_invitations ORDER BY invited_at DESC;

-- Pegar o token do convite
SELECT invitation_token FROM corporate_invitations 
WHERE email = 'teste1@empresa.com';
```

## 4. Teste de Aceitação de Convite

### 4.1 Simular Aceitação (Novo Usuário)
1. Abra uma janela anônima/privada
2. Acesse: http://localhost:3000/corporate-invite/[TOKEN]
3. Verifique a página de convite:
   - Nome da empresa
   - Plano oferecido
   - Benefícios listados
4. Clique em "Aceitar Convite"
5. Será redirecionado para cadastro
6. Crie conta com o email do convite
7. Após login, verifique se tem acesso ao plano

### 4.2 Verificar no Banco
```sql
-- Verificar se usuário foi vinculado
SELECT u.email, u.corporate_partner_id, u.is_corporate_user, u.corporate_plan_type
FROM users u
WHERE u.email = 'teste1@empresa.com';

-- Verificar employee record
SELECT * FROM corporate_employees 
WHERE employee_email = 'teste1@empresa.com';
```

## 5. Teste de Relatórios

### 5.1 Gerar Dados de Teste
```sql
-- Inserir alguns atestados médicos de teste
INSERT INTO medical_certificates (
  user_id, doctor_id, corporate_partner_id,
  certificate_number, sick_days, start_date, end_date,
  cid_code, diagnosis_description
) 
SELECT 
  u.id, 
  1, -- ID de um médico existente
  u.corporate_partner_id,
  'CERT-' || generate_series,
  floor(random() * 5 + 1)::int,
  CURRENT_DATE - interval '15 days',
  CURRENT_DATE - interval '10 days',
  'J00',
  'Resfriado comum'
FROM users u, generate_series(1, 3)
WHERE u.corporate_partner_id IS NOT NULL
LIMIT 3;
```

### 5.2 Baixar Relatório
1. Na página de Colaboradores, clique em "Relatórios de Uso"
2. Selecione o mês atual
3. Baixe em CSV e JSON
4. Verifique o conteúdo dos arquivos

## 6. Testes de API (Postman/cURL)

### 6.1 Listar Planos Disponíveis
```bash
curl http://localhost:3000/api/corporate/plans
```

### 6.2 Verificar Assinatura Atual (Autenticado)
```bash
curl http://localhost:3000/api/corporate/subscription/current \
  -H "Authorization: Bearer [TOKEN_PARCEIRO]"
```

### 6.3 Listar Colaboradores
```bash
curl http://localhost:3000/api/corporate/employees \
  -H "Authorization: Bearer [TOKEN_PARCEIRO]"
```

## 7. Casos de Teste Específicos

### 7.1 Teste de Limites
- [ ] Tentar convidar com email inválido
- [ ] Tentar aceitar convite expirado (altere expires_at no banco)
- [ ] Tentar aceitar convite já usado
- [ ] Tentar remover colaborador

### 7.2 Teste de Cálculo de Preços
- [ ] 10 funcionários, Básico, Mensal = R$ 749,00
- [ ] 100 funcionários, Premium, Semestral = R$ 9.490,50 (com 5% desc)
- [ ] 300 funcionários, Ultra, Anual = R$ 35.748,00 (com 8% desc)

### 7.3 Teste de Permissões
- [ ] Acessar como paciente comum (deve ser negado)
- [ ] Acessar como parceiro sem plano corporativo
- [ ] Acessar como parceiro com plano corporativo

## 8. Verificações no Banco de Dados

### 8.1 Status Geral
```sql
-- Contar parceiros corporativos
SELECT COUNT(*) FROM partners WHERE is_corporate = true;

-- Ver assinaturas ativas
SELECT p.business_name, cs.* 
FROM corporate_subscriptions cs
JOIN partners p ON p.id = cs.partner_id
WHERE cs.status = 'active';

-- Estatísticas de colaboradores
SELECT 
  p.business_name,
  COUNT(DISTINCT ce.user_id) as total_employees,
  COUNT(DISTINCT ci.id) as pending_invites
FROM partners p
LEFT JOIN corporate_employees ce ON ce.partner_id = p.id AND ce.status = 'active'
LEFT JOIN corporate_invitations ci ON ci.partner_id = p.id AND ci.status = 'pending'
WHERE p.is_corporate = true
GROUP BY p.id, p.business_name;
```

## 9. Troubleshooting

### Erro: "Plano não encontrado"
```sql
-- Verificar se os planos existem
SELECT COUNT(*) FROM corporate_subscription_plans;
-- Deve retornar 9
```

### Erro: "Não autorizado"
```sql
-- Verificar se parceiro está marcado como corporativo
UPDATE partners SET is_corporate = true WHERE id = [PARTNER_ID];
```

### Email não enviado
- Verificar configuração SMTP no .env
- Verificar logs do servidor para erros de envio

## 10. Checklist Final

- [ ] Planos corporativos aparecem corretamente
- [ ] Cálculo de preços está correto
- [ ] Checkout com Stripe funciona
- [ ] Convites são enviados por email
- [ ] Colaboradores conseguem aceitar convites
- [ ] Relatórios são gerados corretamente
- [ ] Remoção de colaborador funciona
- [ ] Navegação mobile está correta

## Scripts Úteis para Desenvolvimento

### Resetar Dados de Teste
```sql
-- Limpar dados corporativos (CUIDADO!)
DELETE FROM corporate_employees;
DELETE FROM corporate_invitations;
DELETE FROM medical_certificates WHERE corporate_partner_id IS NOT NULL;
DELETE FROM corporate_subscriptions;
UPDATE partners SET is_corporate = false, active_employees_count = 0;
UPDATE users SET corporate_partner_id = NULL, is_corporate_user = false, corporate_plan_type = NULL 
WHERE corporate_partner_id IS NOT NULL;
```

### Criar Parceiro de Teste Corporativo
```sql
-- Assumindo que existe um usuário parceiro com ID 123
UPDATE partners 
SET is_corporate = true 
WHERE user_id = 123;
```