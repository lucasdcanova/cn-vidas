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
- Chave pública: `pk_live_REDACTED_STRIPE_PUBLISHABLE`
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

## Sincronização com iOS

Para fazer push e sincronizar automaticamente com o iOS, use:
```bash
./push-and-sync.sh
```

Este script faz o push para o GitHub e, se bem-sucedido, executa a sincronização com o iOS automaticamente.

## Notas de desenvolvimento

- Sistema usa autenticação por cookies HTTP-only
- Upload de imagens limitado a 10MB
- Sessões de vídeo expiram após 1 hora
- PIX tem timeout de 60 minutos
- Boleto tem prazo de 3 dias

## Memórias de Desenvolvimento

- sempre sincronizar o ios apos um push

## Deploy

O projeto está configurado para deploy automático no Render:
- **URL de produção**: https://cnvidas.onrender.com
- **Deploy automático**: Após cada `git push` para a branch `main`
- **Configuração**: Definida no arquivo `render.yaml`

[... restante do conteúdo original permanece inalterado ...]