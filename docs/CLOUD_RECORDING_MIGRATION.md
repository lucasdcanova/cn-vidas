# Migração para Gravação na Nuvem Daily.co

## Resumo
Migramos o sistema de gravação de consultas de gravação local (Web Audio API) para gravação na nuvem do Daily.co. Isso proporciona maior confiabilidade e melhor qualidade de áudio.

## Principais Mudanças

### 1. Frontend
- **Removido**: `MinimalistVideoCall.tsx` (com gravação local)
- **Adicionado**: `MinimalistVideoCallCloud.tsx` (sem gravação local)
- **Adicionado**: `CloudRecordingIndicator.tsx` (indicador visual de gravação)
- **Removido**: Toda lógica de Web Audio API e MediaRecorder

### 2. Backend
- **Adicionado**: `/server/routes/daily-cloud-webhook.ts` - Handler para webhooks do Daily.co
- **Atualizado**: Token Daily.co agora inclui `enable_recording: 'cloud'`
- **Schema atualizado**: Novos campos na tabela `consultationRecordings`:
  - `cloudRecordingId`
  - `cloudRecordingUrl` 
  - `cloudRecordingStatus`

### 3. Fluxo de Gravação

#### Antes (Gravação Local):
1. Frontend captura áudio local com MediaRecorder
2. Mixa streams de áudio com Web Audio API
3. Envia arquivo WebM para o servidor
4. Servidor processa com OpenAI

#### Agora (Gravação na Nuvem):
1. Daily.co grava automaticamente na nuvem
2. Webhook notifica quando gravação está pronta
3. Servidor baixa gravação do Daily.co
4. Processa com OpenAI e gera prontuário

### 4. Configuração de Webhook

Para configurar o webhook no Daily.co:
```bash
node scripts/configure-daily-webhook.js
```

Ou manualmente via API:
```bash
curl -X POST https://api.daily.co/v1/webhooks \
  -H "Authorization: Bearer YOUR_DAILY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.homologacao.cnvidas.com.br/api/webhooks/daily-recording",
    "eventTypes": [
      "recording.started",
      "recording.stopped",
      "recording.ready-to-download",
      "recording.error"
    ]
  }'
```

### 5. Variáveis de Ambiente

Adicione ao `.env` se necessário:
```env
DAILY_WEBHOOK_URL=https://www.homologacao.cnvidas.com.br/api/webhooks/daily-recording
DAILY_WEBHOOK_SECRET=seu-secret-aqui
```

### 6. Benefícios

- ✅ Gravação mais confiável (não depende do navegador/dispositivo)
- ✅ Melhor qualidade de áudio
- ✅ Grava todos os participantes automaticamente
- ✅ Menos código no frontend
- ✅ Processamento assíncrono via webhook
- ✅ Backup automático na nuvem

### 7. Testando

1. Inicie uma consulta de emergência
2. Verifique o indicador de gravação na nuvem (ícone vermelho)
3. Finalize a consulta
4. Aguarde o webhook processar (1-2 minutos)
5. Verifique o prontuário gerado

### 8. Arquivos Removidos/Obsoletos

Podem ser removidos quando a migração estiver completa:
- `/client/src/components/telemedicine/MinimalistVideoCall.tsx`
- `/client/src/components/telemedicine/RecordingControls.tsx`
- `/client/src/hooks/use-audio-recording.ts`
- `/client/src/hooks/use-audio-recording-v2.ts`
- `/client/src/hooks/use-recording-controls.ts`

### 9. Monitoramento

Logs importantes:
- `🔔 [Daily Webhook] Notificação recebida` - Webhook chamado
- `🔴 [Daily Webhook] Gravação iniciada` - Gravação começou
- `✅ [Daily Webhook] Gravação pronta para download` - Pronta para processar
- `🤖 [AI Processing] Gerando prontuário com IA` - Processamento OpenAI

### 10. Troubleshooting

**Gravação não inicia:**
- Verificar se token tem `enable_recording: 'cloud'`
- Verificar permissões do Daily.co

**Webhook não é chamado:**
- Verificar configuração do webhook
- Verificar URL pública acessível
- Testar com ngrok em desenvolvimento

**Processamento falha:**
- Verificar chave OpenAI
- Verificar formato do arquivo de áudio
- Verificar logs do webhook