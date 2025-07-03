# Testando Gravação na Nuvem Daily.co

## Status Atual

✅ **Implementado:**
- Componente MinimalistVideoCallCloud sem gravação local
- Webhook handler para processar notificações do Daily.co
- Indicador visual de gravação na nuvem
- Schema atualizado com campos de cloud recording

❌ **Pendente:**
- Configurar webhook no Daily.co (produção)
- Testar fluxo completo com gravação real

## Como Testar

### 1. Configurar Webhook no Daily.co

```bash
# Executar script de configuração
node scripts/configure-daily-webhook.js

# Ou manualmente via cURL:
curl -X POST https://api.daily.co/v1/webhooks \
  -H "Authorization: Bearer 0642e267ec3735a1f93e22af832e31cf13cd3f138f1fcd13394d4d83994b8137" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://cnvidas.onrender.com/api/webhooks/daily-recording",
    "eventTypes": [
      "recording.started",
      "recording.stopped",
      "recording.ready-to-download",
      "recording.error"
    ]
  }'
```

### 2. Testar com Script Automatizado

```bash
# Teste com webhook simulado
node test-scripts/test-cloud-recording.js
```

### 3. Teste Manual

1. Login como paciente: lucas.canova@hotmail.com (senha: 666666)
2. Criar consulta de emergência
3. Em outra aba, login como médico: dr@lucascanova.com (senha: 666666)
4. Aceitar a consulta de emergência
5. Verificar indicador de gravação (ícone vermelho)
6. Conversar por 30 segundos
7. Finalizar consulta
8. Aguardar 1-2 minutos para processamento
9. Verificar prontuário gerado

### 4. Monitorar Logs

```bash
# Verificar logs do servidor
tail -f server.log | grep -E "(Daily Webhook|AI Processing|Recording)"

# Verificar status das gravações
node scripts/check-recording-status.js
```

## Problemas Conhecidos

1. **room_name NULL**: Gravações antigas não têm o campo room_name preenchido
2. **Webhook não configurado**: Precisa configurar manualmente no Daily.co
3. **Teste local**: Webhook precisa de URL pública (usar ngrok)

## Próximos Passos

1. Configurar webhook no Daily.co produção
2. Testar gravação real com áudio
3. Validar geração de prontuário
4. Implementar retry para falhas
5. Adicionar monitoramento de webhooks