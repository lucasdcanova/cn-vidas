# Claude Code Instructions

## Projeto CNVidas

Sistema de telemedicina desenvolvido com React, TypeScript, Node.js e PostgreSQL.

## Comandos importantes

### Frontend
```bash
# Instalar dependências
yarn install

# Rodar em desenvolvimento
yarn dev

# Build para produção
yarn build

# Verificar tipos
yarn typecheck

# Lint
yarn lint
```

### Backend
```bash
# O servidor roda junto com o frontend em desenvolvimento
# Porta padrão: 3001
```

## Estrutura do projeto

```
/
├── client/          # Frontend React + Vite
├── server/          # Backend Node.js + Express
├── db/             # Configurações e migrations do banco
└── uploads/        # Arquivos enviados pelos usuários
```

## Tecnologias principais

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Banco de dados**: PostgreSQL com Drizzle ORM
- **Autenticação**: JWT
- **Pagamentos**: Stripe
- **Upload de arquivos**: Multer
- **Video chamadas**: Daily.co

## Informações importantes

### Stripe
- PIX precisa ser ativado no dashboard do Stripe
- Chave pública: `pk_live_51RAOnMKOsPzrrDErXaDRtMivvPi3iVD7socexHWBbvb5BEjeUuDBxhC3WTrBRC9NLJ1IASrSAI8SGQj8ZF9uZA8F002np3ZUCz`
- Métodos de pagamento: cartão, PIX, boleto

### Planos de assinatura
- basic (Básico)
- standard (Padrão)
- premium (Premium)
- family_basic (Familiar Básico)
- family_plus (Familiar Plus)
- ultra_family (Ultra Familiar)
- medical (Plano Médico - gratuito)

### Funcionalidades principais
- Agendamento de consultas
- Videochamadas
- Chat em tempo real
- Prontuário eletrônico
- Sistema de notificações
- Upload de documentos médicos
- Consultas de emergência

## Padrões de código

- Usar TypeScript strict mode
- Seguir convenções do projeto existente
- Componentes React funcionais com hooks
- Tailwind para estilização
- Shadcn/ui para componentes de UI
- Tratamento de erros com try/catch
- Logs detalhados no console para debugging

## Antes de commitar

1. Verificar tipos: `yarn typecheck`
2. Rodar lint: `yarn lint`
3. Testar funcionalidades afetadas
4. Verificar console por erros

## Sincronização automática com iOS

O projeto está configurado para sincronizar automaticamente com o iOS após cada commit usando um hook post-commit do Husky.

## Notas de desenvolvimento

- Sistema usa autenticação por cookies HTTP-only
- Upload de imagens limitado a 10MB
- Sessões de vídeo expiram após 1 hora
- PIX tem timeout de 60 minutos
- Boleto tem prazo de 3 dias

## Deploy

O projeto está configurado para deploy automático no Render:
- **URL de produção**: https://cnvidas.onrender.com
- **Deploy automático**: Após cada `git push` para a branch `main`
- **Configuração**: Definida no arquivo `render.yaml`

## Variáveis de Ambiente

```env
# Autenticação e Segurança
SESSION_SECRET=              # Segredo para sessões Express
JWT_SECRET=                  # Segredo para tokens JWT

# Stripe (Pagamentos)
STRIPE_PUBLISHABLE_KEY=      # Chave pública do Stripe
STRIPE_SECRET_KEY=           # Chave secreta do Stripe  
STRIPE_WEBHOOK_SECRET=       # Segredo para webhooks

# Banco de Dados
DATABASE_URL=                # URL PostgreSQL

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=              # Email do remetente
EMAIL_PASSWORD=              # Senha de aplicativo
EMAIL_FROM="CN Vidas <noreply@cnvidas.com.br>"

# Daily.co (Videochamadas)
DAILY_API_KEY=               # Chave da API Daily.co

# OpenAI
OPENAI_API_KEY=              # Chave da API OpenAI

# URLs da Aplicação
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8080
```

## Endpoints Principais da API

### Autenticação (`/api/auth`)
- `POST /register` - Registro com aceitação de termos legais
- `POST /login` - Login com email/senha
- `POST /login-qr` - Login via QR Code
- `POST /logout` - Logout e limpeza de cookies
- `GET /user` - Dados do usuário autenticado
- `POST /refresh-user` - Atualizar dados do usuário
- `POST /verify-email` - Verificar email
- `POST /forgot-password` - Solicitar reset de senha
- `POST /reset-password` - Resetar senha

### Consultas (`/api/appointments`)
- `GET /` - Listar consultas do usuário
- `POST /` - Criar nova consulta
- `PUT /:id` - Atualizar consulta
- `DELETE /:id` - Cancelar consulta
- `GET /doctor/:doctorId` - Consultas de um médico
- `POST /join/:roomName` - Entrar em videochamada

### Emergência (`/api/emergency`)
- `POST /v2/start` - Iniciar consulta de emergência
- `GET /v2/available-doctors` - Médicos disponíveis
- `POST /v2/accept` - Médico aceita emergência
- `POST /v2/join/:roomName` - Entrar na sala
- `GET /v2/notifications/:doctorId` - Notificações

### Pagamentos (`/api/payments`)
- `POST /preauthorize` - Pré-autorizar pagamento
- `POST /capture/:paymentIntentId` - Capturar pagamento
- `POST /cancel/:paymentIntentId` - Cancelar pré-autorização
- `GET /status/:paymentIntentId` - Status do pagamento

### Assinaturas (`/api/subscription`)
- `POST /create-session` - Criar sessão de checkout
- `GET /current` - Assinatura atual
- `POST /cancel` - Cancelar assinatura
- `GET /plans` - Listar planos disponíveis

## Fluxos Críticos

### Login/Autenticação
1. Login com email/senha ou QR Code
2. JWT armazenado em cookie httpOnly
3. Middleware global processa JWT
4. Verificação de email obrigatória

### Agendamento de Consultas
1. Seleção de médico e especialidade
2. Escolha de data/hora disponível
3. Pré-autorização de pagamento
4. Criação da sala Daily.co
5. Envio de notificações
6. Captura do pagamento após consulta

### Consulta de Emergência
1. Verificação de consultas disponíveis
2. Criação de sala com nome único
3. Notificação para médicos disponíveis
4. Médico aceita e entra na sala
5. Cobrança após 5 minutos
6. Decremento de consultas

## Limites e Configurações

### Uploads
- Imagens: 50MB máximo
- Timeout: 2 minutos
- Formatos: JPG, PNG, GIF, WebP

### Timeouts
- Sessões de vídeo: 60 minutos
- PIX: 60 minutos para pagamento
- Boleto: 3 dias para pagamento
- Tokens de email: 24 horas
- Tokens de reset: 1 hora

### Pagamentos
- Pré-autorização sem captura imediata
- Captura após consulta realizada
- Cancelamento automático em 6 horas
- Taxa de consulta: configurável por médico

## Padrões de Nomenclatura

### Rotas da API
- Kebab-case: `/api/emergency-consultation`
- Versionamento: `/api/emergency/v2/start`
- RESTful: GET, POST, PUT, DELETE

### Arquivos TypeScript
- Kebab-case: `auth-routes.ts`
- Sufixos: `-routes`, `-utils`, `-service`

### Componentes React
- PascalCase: `EmergencyConsultation.tsx`
- Hooks: prefixo `use`: `useAuth.ts`

### Banco de Dados
- Snake_case para tabelas: `email_verifications`
- Snake_case para colunas: `created_at`

## Estrutura de Dados

### Usuários (users)
- Roles: patient, partner, admin, doctor
- Planos: free, basic, premium, ultra, *_family
- Consultas de emergência limitadas por plano

### Consultas (appointments)
- Status: scheduled, completed, cancelled, waiting
- Tipos: telemedicine, in_person
- Integração com Daily.co e Stripe

### Médicos (doctors)
- CRM e RQE obrigatórios
- Disponibilidade para emergência
- Taxa de consulta configurável
- Status de onboarding

## Funcionalidades Especiais

### QR Code Authentication
- Login rápido via câmera
- Tokens únicos por usuário
- Logs de autenticação

### Sistema de Notificações
- Tipos: info, success, warning, error, emergency
- Notificações de emergência prioritárias
- Armazenamento em banco

### Upload de Imagens
- Crop antes do upload
- Compressão automática
- Cache otimizado (1 dia)

### Jobs Agendados (Cron)
- Processamento de pagamentos (hourly)
- Cancelamento de pré-autorizações (6h)
- Limpeza de dados temporários

## Segurança

- HTTPS obrigatório em produção
- Sanitização de inputs
- Rate limiting configurado
- CORS para domínios específicos
- Cookies httpOnly + Secure + SameSite

## Scripts de Desenvolvimento

```bash
# Criar usuário admin
node create-admin.js

# Verificar dados
node check-users.mjs
node check-doctors-table.js

# Migrations
yarn migrate
node run-migration.js
```

## IMPORTANTE: Guia de Nomenclaturas e Padrões

### ⚠️ ATENÇÃO: O projeto tem inconsistências de nomenclatura que estão sendo corrigidas gradualmente

### Rotas da API (usar sempre PLURAL)
- ✅ CORRETO: `/api/users`, `/api/doctors`, `/api/appointments`
- ❌ EVITAR: `/api/user`, `/api/doctor`, `/api/appointment`

### IDs e Referências
- **ID primário**: `id`
- **Referência de usuário**: `userId` (referencia users.id)
- **Referência de médico**: `doctorId` (referencia doctors.id, NÃO users.id)
- **Referência de paciente**: `patientId` (referencia users.id quando role='patient')
- **Referência de parceiro**: `partnerId` (referencia partners.id)

### Campos de Nome
- **Nome completo**: usar `fullName` (não `name` ou `full_name`)
- **Nome em appointments**: `patientName`, `doctorName` (para display)

### Campos de Médico
- **Número de licença**: `licenseNumber` (não `crm` ou `license_number`)
- **Biografia**: `biography` (campo principal), `fullBio` (extendida)
- **RQE**: `rqeNumber` (Registro de Qualificação de Especialista)

### Imagem de Perfil
- **No código**: `profileImage`
- **No banco**: `profile_image`
- **URLs**: `profileImageUrl`

### Campos de Data/Hora
- **No código TypeScript**: camelCase (`createdAt`, `updatedAt`, `startTime`)
- **No banco de dados**: snake_case (`created_at`, `updated_at`, `start_time`)

### Campos Booleanos
- **Prefixo `is`**: `isActive`, `isRead`, `isFeatured`
- **Sufixo `ed`**: `emailVerified`, `onboardingCompleted`
- **Para disponibilidade**: `availableForEmergency`

### Status de Appointments
- `scheduled` - Agendada
- `completed` - Concluída
- `cancelled` - Cancelada
- `no-show` - Paciente não compareceu
- `waiting` - Aguardando (emergência)

### Roles de Usuário
- `patient` - Paciente
- `doctor` - Médico
- `partner` - Parceiro
- `admin` - Administrador

### Campos de Pagamento
- **Intent ID**: `paymentIntentId`
- **Taxa de consulta**: `consultationFee`
- **Status**: `paymentStatus`
- **Valor**: `paymentAmount`
- **IDs Stripe**: `stripeCustomerId`, `stripeSubscriptionId`

### Endereço (campos separados)
- `street` - Rua
- `number` - Número
- `complement` - Complemento
- `neighborhood` - Bairro
- `city` - Cidade
- `state` - Estado (UF)
- `zipcode` - CEP (não usar `cep` ou `postalCode`)

### Convenções de Arquivos
- **Rotas**: kebab-case (`auth-routes.ts`, `doctor-routes.ts`)
- **Componentes**: PascalCase (`DoctorProfile.tsx`)
- **Hooks**: camelCase com prefixo use (`useAuth.ts`)
- **Utilitários**: kebab-case (`date-utils.ts`)

### Mapeamento Banco <-> Código
```typescript
// Exemplo de transformação
const user = {
  fullName: row.full_name,        // snake_case -> camelCase
  createdAt: row.created_at,
  profileImage: row.profile_image,
  emailVerified: row.email_verified
}
```

### Inconsistências Conhecidas (NÃO CRIAR NOVAS)
- `/api/user` e `/api/users` (ambos existem)
- `name` vs `fullName` (migrar para `fullName`)
- `bio` vs `biography` (migrar para `biography`)
- Campos snake_case no TypeScript (migrar para camelCase)

## Arquivos de Nomenclatura e Mapeamento

### Arquivo de Mapeamento Central
- **Localização**: `/shared/nomenclature-mapping.ts`
- **Função**: Centraliza todas as transformações de nomenclatura
- **Conteúdo**:
  - Mapeamento snake_case ↔ camelCase
  - Funções helper `dbToTs()` e `tsToDb()`
  - Constantes para status, roles e planos
  - Validador de nomenclatura

### Status das Correções
- **Documentação**: `NOMENCLATURE_FIXES_STATUS.md`
- **Progresso**: ~8% concluído (23/06/2025)
- **Correções realizadas**:
  - ✅ 10 arquivos .backup removidos
  - ✅ 4 versões antigas de páginas removidas
  - ✅ Hook useAudioRecording padronizado
  - ✅ Arquivo de mapeamento criado

## Correções Pendentes de Alta Prioridade

### 1. Campos "seller" → "referrer"
- `sellerId` e `sellerName` devem migrar para `referrerId` e `referrerName`
- Usar camada de compatibilidade durante transição

### 2. Rotas API (manter por enquanto)
- `/api/user` (singular) - autenticação crítica
- `/api/users` (plural) - outros endpoints
- NÃO MUDAR sem plano de migração completo

### 3. Campos múltiplos para mesma coisa
- `name` → `fullName` (sempre)
- `bio` → `biography` (padrão)
- `crm` → `licenseNumber` (oficial)

## Lembretes de Desenvolvimento

- SEMPRE QUE FIZER ALTERACOES SOBRE A CHAMADA DE VIDEO USE GIT COMMIT E GIT PUSH NA SEQUENCIA
- Verificar tipos e lint antes de commitar
- Testar funcionalidades em desenvolvimento antes do push
- Logs detalhados para debugging em desenvolvimento
- SEMPRE seguir os padrões de nomenclatura acima para novo código
- Ao encontrar inconsistências, seguir o padrão documentado acima
- Usar `/shared/nomenclature-mapping.ts` para conversões
- NÃO criar novas inconsistências de nomenclatura