# Configuração do Webhook do Stripe

## Problema Identificado

Os cartões de crédito não estavam sendo salvos corretamente porque não havia um webhook do Stripe configurado para processar os eventos de `setup_intent.succeeded`.

## Solução Implementada

1. **Webhook Handler**: Criado arquivo `server/routes/stripe-webhook.ts` que processa eventos do Stripe
2. **Confirmação Manual**: Adicionado endpoint `/api/subscription/confirm-setup-intent` como fallback
3. **Melhorias no Frontend**: O componente agora confirma o setup intent após o processamento

## Configuração Necessária

### 1. Configurar Webhook no Dashboard do Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/webhooks)
2. Clique em "Add endpoint"
3. Configure:
   - **Endpoint URL**: `https://cnvidas.onrender.com/api/webhooks/stripe`
   - **Events to listen**: Selecione pelo menos:
     - `setup_intent.succeeded`
     - `payment_method.attached`
     - `payment_intent.succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

### 2. Adicionar o Webhook Secret

1. Após criar o webhook, copie o "Signing secret" (começa com `whsec_`)
2. Adicione ao Codespaces Secrets:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 3. Testar o Webhook

Use o Stripe CLI para testar localmente:
```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

## Eventos Processados

O webhook processa os seguintes eventos:

- **setup_intent.succeeded**: Define o método de pagamento como padrão
- **payment_method.attached**: Registra quando um método é anexado
- **payment_intent.succeeded**: Garante que métodos usados em pagamentos sejam salvos
- **customer.subscription.***: Atualiza status de assinaturas no banco de dados

## Monitoramento

Para verificar se os webhooks estão funcionando:

1. Acesse o Dashboard do Stripe > Webhooks
2. Clique no webhook configurado
3. Veja o log de tentativas e respostas

## Troubleshooting

Se os cartões ainda não estiverem sendo salvos:

1. Verifique se o webhook está recebendo os eventos (Dashboard do Stripe)
2. Verifique os logs do servidor para mensagens com `📨 Evento Stripe recebido`
3. Confirme que o `STRIPE_WEBHOOK_SECRET` está configurado corretamente
4. Teste manualmente usando o endpoint de confirmação