# Configuração de Variáveis de Ambiente no Xcode Cloud

## Como configurar as variáveis de ambiente

1. **Acesse o Xcode Cloud**
   - Abra o Xcode
   - Vá em Product → Xcode Cloud → Manage Workflows

2. **Edite o Workflow**
   - Selecione seu workflow
   - Clique em "Edit Workflow"

3. **Adicione as Environment Variables**
   - Vá na aba "Environment Variables"
   - Clique no "+" para adicionar cada variável
   - Marque como "Secret" para valores sensíveis

## Variáveis Necessárias

### Essenciais
- `SESSION_SECRET` - String aleatória longa para sessões
- `JWT_SECRET` - String aleatória longa para JWT
- `DATABASE_URL` - URL completa do PostgreSQL

### Stripe (Produção)
- `STRIPE_PUBLISHABLE_KEY` - pk_live_...
- `STRIPE_SECRET_KEY` - sk_live_...
- `STRIPE_WEBHOOK_SECRET` - whsec_...

### Email
- `EMAIL_HOST` - smtp.gmail.com (ou outro)
- `EMAIL_PORT` - 587
- `EMAIL_USERNAME` - seu-email@gmail.com
- `EMAIL_PASSWORD` - senha de aplicativo
- `EMAIL_FROM` - "CN Vidas <noreply@cnvidas.com.br>"

### APIs
- `DAILY_API_KEY` - Chave da API Daily.co
- `OPENAI_API_KEY` - sk-... (API OpenAI)

### URLs
- `FRONTEND_URL` - https://www.homologacao.cnvidas.com.br
- `BACKEND_URL` - https://www.homologacao.cnvidas.com.br

### Opcionais
- `WHATSAPP_API_KEY` - Se usar WhatsApp
- `WHATSAPP_PHONE_NUMBER` - Número do WhatsApp

## Exemplo de Valores

```
SESSION_SECRET=sua-string-super-secreta-aqui-com-64-caracteres-ou-mais
JWT_SECRET=outra-string-super-secreta-diferente-da-anterior
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
STRIPE_PUBLISHABLE_KEY=pk_live_51RAOnMKOsPzrrDErXaDRtMivvPi3iVD7socexHWBbvb5BEjeUuDBxhC3WTrBRC9NLJ1IASrSAI8SGQj8ZF9uZA8F002np3ZUCz
EMAIL_FROM="CN Vidas <noreply@cnvidas.com.br>"
```

## Importante

1. **Nunca commite** essas variáveis no código
2. **Use valores de produção** no Xcode Cloud
3. **Marque como "Secret"** no Xcode Cloud
4. O script `ci_post_clone.sh` criará o arquivo `.env` automaticamente

## Verificação

Para verificar se as variáveis foram configuradas corretamente:
1. Faça um build no Xcode Cloud
2. Verifique os logs do script `ci_post_clone.sh`
3. Procure por "✅ Arquivo .env criado com sucesso"