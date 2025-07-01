# Debug - Problema de Gravação Não Criada Automaticamente

## Resumo do Problema
Após encerrar consultas de emergência, o prontuário médico não está sendo criado automaticamente porque a gravação da consulta não está sendo salva.

## Análise Realizada

### 1. Consulta 204
- **Status**: completed
- **Tipo**: emergency (provavelmente)
- **Gravação**: ❌ Não encontrada
- **Prontuário**: ❌ Não criado
- **Configurações**: ✅ Paciente e médico permitem gravação

### 2. Fluxo Esperado
1. Médico entra na consulta → `MinimalistVideoCall` é renderizado
2. `RecordingControls` é renderizado com `autoStart=true`
3. Após 5 segundos, a gravação inicia automaticamente
4. Ao encerrar a consulta, a gravação é enviada para o servidor
5. Servidor processa com OpenAI (Whisper + GPT-4)
6. Prontuário é criado automaticamente

### 3. Possíveis Causas

#### A. Frontend - Gravação não iniciada
- RecordingControls não renderizado
- Permissões do navegador negadas
- Erro JavaScript impedindo execução

#### B. Frontend - Upload falhou
- Erro de rede durante upload
- Timeout no envio
- Erro de autenticação

#### C. Backend - Processamento falhou
- Validação rejeitou o upload
- Erro ao salvar no banco
- Falha no processamento com OpenAI

## Logs Adicionados

### Frontend
1. **RecordingControls.tsx**
   - Log ao renderizar componente
   - Log ao verificar permissões
   - Log detalhado de erros
   - Log do progresso de upload

2. **MinimalistVideoCall.tsx**
   - Log ao renderizar RecordingControls
   - Log das condições de autoStart

3. **use-audio-recording.ts**
   - Logs do processo de gravação

### Backend
1. **consultation-recording-routes-drizzle.ts**
   - Log de headers e body recebidos
   - Log de dados do arquivo
   - Log de autenticação

## Como Debugar

### 1. Durante uma Nova Consulta

**No Console do Navegador (F12):**
```javascript
// Filtrar logs do RecordingControls
console.log('%c=== LOGS DE GRAVAÇÃO ===', 'color: red; font-weight: bold');

// Procurar por:
// 🎯 [RecordingControls] Componente renderizado
// 🎙️ [RecordingControls] Iniciando gravação automática
// 📤 [RecordingControls] Iniciando upload
// ✅ [RecordingControls] Upload concluído
```

**Na Aba Network:**
1. Filtrar por "consultation-recordings"
2. Verificar requisição POST para `/api/consultation-recordings/upload`
3. Ver status da resposta (200, 400, 500)
4. Verificar payload enviado

### 2. No Servidor

**Logs do Terminal:**
```bash
# Procurar por:
# 📼 [Recording Upload] Iniciando upload
# 📋 [Recording Upload] Dados recebidos
# ✅ [Recording Upload] Gravação salva
```

### 3. Verificações Importantes

1. **RecordingControls está visível?**
   - Deve aparecer um indicador vermelho pulsante durante a gravação
   - Verificar se aparece no header da videochamada

2. **Permissões do navegador:**
   - Verificar se o navegador tem permissão para microfone
   - Console mostrará: "🔐 [RecordingControls] Status da permissão: granted"

3. **Upload está sendo feito?**
   - Network deve mostrar requisição POST
   - Console deve mostrar progresso: "📈 [RecordingControls] Progresso do upload: X%"

## Solução Temporária

Enquanto investigamos, o médico pode:
1. Criar o prontuário manualmente após a consulta
2. Usar o botão "Gravar" manualmente se o autoStart falhar

## Próximos Passos

1. Acompanhar uma nova consulta com console aberto
2. Capturar todos os logs
3. Verificar se o componente está sendo renderizado
4. Confirmar se as permissões estão sendo concedidas
5. Verificar se o upload está chegando ao servidor

## Comandos Úteis para Verificação

```bash
# Verificar consultas recentes sem gravação
node check-consultation-204-detailed.js

# Verificar logs do servidor
tail -f logs/server.log | grep "Recording Upload"

# Verificar se arquivos estão sendo salvos
ls -la uploads/recordings/
```