# Status das Correções de Nomenclatura - CNVidas

## ✅ Correções Realizadas (23/06/2025)

### 1. Limpeza de Arquivos
- ✅ Removidos 6 arquivos .backup não utilizados:
  - `prisma/schema.backup.prisma`
  - `server/schema.ts.backup`
  - `server/routes/medical-records-routes.backup.ts`
  - `server/routes/profile-image-routes-fix.ts.backup`
  - `server/routes/profile-image-routes.ts.backup`
  - `server/routes/upload-routes.ts.backup`

### 2. Remoção de Versões Antigas
- ✅ Removidas páginas não utilizadas:
  - `telemedicine-emergency-v4.tsx`
  - `telemedicine-emergency-v4-new.tsx`
  - `dependents-page.tsx`
  - `dependents-page-new.tsx`

### 3. Padronização de Hooks
- ✅ Renomeado `useAudioRecording.ts` → `use-audio-recording.ts`
- ✅ Atualizado import em `RecordingControls.tsx`

### 4. Arquivo de Mapeamento
- ✅ Criado `shared/nomenclature-mapping.ts` com:
  - Mapeamento snake_case ↔ camelCase
  - Padronização de campos problemáticos
  - Funções helper para conversão
  - Validador de nomenclatura

## ⚠️ Correções Pendentes (Alta Prioridade)

### 1. Rotas API Inconsistentes
**Problema**: Mistura de singular/plural
- `/api/user` (singular) - endpoint de autenticação
- `/api/users` (plural) - outros endpoints

**Solução Proposta**: Manter por enquanto devido ao risco em produção

### 2. Campos "seller" → "referrer"
**Problema**: Terminologia confusa entre seller/partner
- `sellerId`, `sellerName` na tabela users
- Entidade `partners` separada

**Solução Proposta**: 
```sql
-- Migration futura
ALTER TABLE users ADD COLUMN referrer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN referrer_name VARCHAR(255);
-- Copiar dados e remover campos antigos
```

### 3. Inconsistência de IDs
**Problema**: `doctorId` às vezes referencia `doctors.id`, às vezes `users.id`

**Solução Proposta**: Documentar claramente:
- `userId` → sempre `users.id`
- `doctorId` → sempre `doctors.id`
- `patientId` → `users.id` quando role='patient'

## 🔄 Correções em Andamento

### 1. Padronização de Campos
Usar o arquivo `nomenclature-mapping.ts` para conversões graduais:
- `name` → `fullName`
- `bio` → `biography`
- `crm` → `licenseNumber`

### 2. Convenções de Arquivo
- Rotas: kebab-case ✅
- Componentes: PascalCase ✅
- Hooks: kebab-case com prefixo `use-` ✅

## 📋 Próximos Passos

1. **Implementar camada de compatibilidade** usando `nomenclature-mapping.ts`
2. **Criar middleware** para padronizar requisições automaticamente
3. **Atualizar DTOs** para usar nomenclatura consistente
4. **Adicionar testes** para validar nomenclatura
5. **Documentar no CLAUDE.md** todas as convenções

## ⚠️ Avisos Importantes

1. **NÃO CRIAR** novas inconsistências - seguir padrões do CLAUDE.md
2. **NÃO MUDAR** rotas críticas sem plano de migração
3. **SEMPRE TESTAR** em staging antes de produção
4. **MANTER COMPATIBILIDADE** durante período de transição

## 📊 Métricas de Progresso

- Arquivos limpos: 10 ✅
- Nomenclaturas padronizadas: 4/50+ (8%)
- Risco de breaking changes: BAIXO
- Tempo estimado para conclusão: 2-3 semanas

---

*Última atualização: 23/06/2025*