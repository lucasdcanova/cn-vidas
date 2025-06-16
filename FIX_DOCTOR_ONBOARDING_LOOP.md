# Correção do Loop de Redirecionamento no Onboarding de Médicos

## Problema Identificado

O sistema possui dois fluxos de onboarding conflitantes para médicos:
1. Um fluxo usa o campo `welcomeCompleted` e redireciona para `/doctor-onboarding`
2. Outro fluxo usa o campo `onboardingCompleted` e redireciona para `/onboarding/doctor`

Como o campo `onboardingCompleted` não existia no banco de dados, ele sempre retornava `false`, causando um loop infinito de redirecionamento.

## Solução Implementada

### 1. Migração do Banco de Dados

Foi criado um arquivo de migração SQL (`add_onboarding_completed_field.sql`) que:
- Adiciona o campo `onboarding_completed` à tabela `doctors`
- Adiciona campos adicionais para o novo fluxo de onboarding:
  - `consultation_price_description`
  - `full_bio`
  - `areas_of_expertise`
  - `languages_spoken`
  - `achievements`
- Atualiza médicos existentes que já completaram o onboarding antigo

### 2. Atualização do Schema TypeScript

O arquivo `shared/schema.ts` foi atualizado para incluir os novos campos na definição da tabela `doctors`.

### 3. Correção dos Componentes React

Os seguintes arquivos foram corrigidos:
- `/client/src/pages/doctor-onboarding.tsx`: Usa `onboardingCompleted` ao invés de `welcomeCompleted`
- `/client/src/components/doctor/doctor-onboarding-guard.tsx`: Verifica `onboardingCompleted` corretamente

## Como Aplicar a Correção

### 1. Execute a Migração do Banco de Dados

```bash
# Opção 1: Usando o script Node.js
node run-onboarding-migration.js

# Opção 2: Executando diretamente com psql
psql $DATABASE_URL < add_onboarding_completed_field.sql
```

### 2. Reinicie o Servidor

```bash
npm run dev
# ou
npm start
```

### 3. Limpe o Cache do Navegador

Para garantir que as mudanças sejam aplicadas:
1. Abra as ferramentas de desenvolvedor (F12)
2. Clique com o botão direito no botão de recarregar
3. Selecione "Esvaziar cache e recarregar"

## Verificação

Para verificar se a correção foi aplicada corretamente:

1. **No banco de dados**, execute:
```sql
-- Verificar se os campos foram adicionados
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'doctors' 
AND column_name IN ('onboarding_completed', 'consultation_price_description', 'full_bio');

-- Verificar médicos com onboarding completo
SELECT id, user_id, welcome_completed, onboarding_completed 
FROM doctors;
```

2. **No navegador**, faça login como médico:
- Se o onboarding estiver incompleto, você será redirecionado para `/onboarding/doctor`
- Após completar o onboarding, você será redirecionado para `/doctor-telemedicine`
- Não deve haver loops de redirecionamento

## Notas Importantes

- O campo `welcomeCompleted` foi mantido por compatibilidade (campo legado)
- O novo campo `onboardingCompleted` é o que controla o fluxo de onboarding atual
- Médicos que já tinham `welcomeCompleted = true` foram automaticamente marcados com `onboardingCompleted = true`

## Troubleshooting

Se o problema persistir:

1. Verifique se a migração foi executada com sucesso
2. Verifique os logs do servidor para erros
3. Inspecione o Network tab do navegador para ver os redirecionamentos
4. Verifique se o cookie de sessão está sendo mantido corretamente