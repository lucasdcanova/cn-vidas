# Scripts de Teste - CNVidas

Este diretório contém scripts de teste automatizados para o sistema CNVidas.

## Scripts Disponíveis

### 1. test-video-consultation.js
Testa o fluxo completo de videochamada entre médico e paciente usando Puppeteer.

**Funcionalidades testadas:**
- Login de médico e paciente
- Criação de consulta de emergência
- Entrada do médico na videochamada
- Simulação de consulta
- Redirecionamento para prontuário

**Como executar:**
```bash
npm install puppeteer
node test-scripts/test-video-consultation.js
```

### 2. test-medical-record-generation.js
Testa a geração automática de prontuário com IA após consulta.

**Funcionalidades testadas:**
- Login via API
- Criação de consulta de emergência
- Upload de gravação simulada
- Processamento assíncrono da gravação
- Geração de prontuário com GPT-4
- Verificação do prontuário gerado

**Como executar:**
```bash
npm install axios form-data
node test-scripts/test-medical-record-generation.js
```

## Credenciais de Teste

- **Médico:** dr@lucascanova.com / 666666
- **Paciente:** lucas.canova@hotmail.com / 666666

## Pré-requisitos

1. O servidor deve estar rodando (`yarn dev`)
2. As credenciais da OpenAI devem estar configuradas
3. O banco de dados deve estar populado com os usuários de teste

## Notas Importantes

- Os scripts simulam gravações de áudio para teste
- O processamento de IA pode levar alguns minutos
- Verifique os logs do servidor para debug detalhado
- O prontuário gerado é baseado na transcrição simulada

## Troubleshooting

### Erro de login
- Verifique se os usuários existem no banco
- Confirme que o servidor está rodando

### Erro na geração do prontuário
- Verifique a chave da OpenAI no .env
- Confirme que o serviço de processamento está ativo
- Verifique os logs em `/api/consultation-recordings/status/{id}`

### Timeout no processamento
- Aumente o `maxAttempts` no script
- Verifique se a rota de processamento está funcionando
- Confirme que o Whisper e GPT-4 estão respondendo