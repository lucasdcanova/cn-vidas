# Guia de Configuração de Notificações Push (APNs)

## Visão Geral

O CNVidas já possui toda a infraestrutura de código pronta para notificações push no iOS. O que falta configurar são os certificados APNs (Apple Push Notification Service).

## Estrutura Atual do Código

### 1. Backend - Serviços Implementados

#### Push Notification Service (`server/services/push-notification-service.ts`)
- Serviço principal para envio de notificações
- Suporta envio para usuário específico ou múltiplos usuários
- Notificações de emergência e consultas agendadas
- Gerenciamento de tokens de dispositivo

#### APNs Service (`server/services/apns-service.ts`)
- Integração com Apple Push Notification Service
- Suporta autenticação por certificado ou token (recomendado)
- Provider configurado para produção/desenvolvimento

#### Configuração APNs (`server/config/apns-config.ts`)
- Configuração centralizada dos certificados
- Validação automática de certificados
- Suporte a variáveis de ambiente

### 2. Rotas da API

#### Push Notifications Routes (`server/routes/push-notifications-routes.ts`)
- POST `/api/push-notifications/register` - Registra token do dispositivo
- POST `/api/push-notifications/unregister` - Remove token
- GET `/api/push-notifications/status` - Verifica status
- DELETE `/api/push-notifications/tokens/:platform` - Remove token específico

### 3. Banco de Dados

Tabela `device_tokens` já criada com:
- userId
- platform (ios/android/web)
- token
- deviceInfo
- isActive
- lastUsedAt

## O Que Falta Configurar

### 1. Certificados APNs

Você precisa criar e configurar os certificados no Apple Developer Portal:

#### Opção A: Autenticação por Token (Recomendado)
1. No Apple Developer Portal, vá em "Keys"
2. Crie uma nova chave com permissão "Apple Push Notifications service (APNs)"
3. Baixe o arquivo `.p8`
4. Anote o Key ID e Team ID

#### Opção B: Certificados SSL
1. No Apple Developer Portal, vá em "Certificates"
2. Crie um certificado "Apple Push Notification service SSL"
3. Escolha o App ID correto (com.cnvidas.app)
4. Gere e baixe o certificado
5. Converta para formato .pem

### 2. Configurar no Servidor

#### Criar diretório de certificados:
```bash
mkdir -p certificates
```

#### Para Autenticação por Token:
1. Coloque o arquivo AuthKey_XXXXXXXXXX.p8 em `certificates/`
2. Configure as variáveis de ambiente:
```env
APNS_TEAM_ID=XXXXXXXXXX
APNS_KEY_ID=XXXXXXXXXX
APNS_AUTH_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
APNS_TOPIC=com.cnvidas.app
NODE_ENV=production
```

#### Para Certificados SSL:
1. Converta o certificado para .pem:
```bash
openssl x509 -in aps.cer -inform der -out apns-cert.pem
openssl pkcs12 -in Certificates.p12 -out apns-key.pem -nodes
```

2. Coloque os arquivos em `certificates/`:
   - `apns-cert.pem`
   - `apns-key.pem`

3. Configure as variáveis de ambiente:
```env
APNS_CERT_PATH=/path/to/apns-cert.pem
APNS_KEY_PATH=/path/to/apns-key.pem
APNS_TOPIC=com.cnvidas.app
NODE_ENV=production
```

### 3. Configurar no Codespaces

Como você está usando Codespaces, adicione as variáveis de ambiente nos Secrets:

1. Vá em Settings → Secrets → Codespaces
2. Adicione os seguintes secrets:
   - `APNS_TEAM_ID`
   - `APNS_KEY_ID`
   - `APNS_AUTH_KEY_PATH`
   - `APNS_TOPIC`

### 4. Testar as Notificações

Após configurar os certificados, você pode testar:

```javascript
// Exemplo de envio de notificação
import { pushNotificationService } from './server/services/push-notification-service';

// Enviar notificação de teste
await pushNotificationService.sendToUser(userId, {
  title: 'Teste CNVidas',
  body: 'Notificação push funcionando!',
  badge: 1,
  sound: 'default'
});
```

## Tipos de Notificações Implementadas

### 1. Notificações de Emergência
- Título: "🚨 Consulta de Emergência"
- Som customizado: emergency.wav
- Alta prioridade

### 2. Notificações de Consulta
- Lembrete: 30 minutos antes
- Confirmação de agendamento
- Cancelamento de consulta

### 3. Notificações Gerais
- Atualizações do sistema
- Mensagens do chat
- Resultados de exames

## Checklist de Implementação

- [ ] Criar certificados no Apple Developer Portal
- [ ] Baixar certificados/chave
- [ ] Converter para formato apropriado (se necessário)
- [ ] Criar pasta `certificates/` no projeto
- [ ] Adicionar certificados ao .gitignore (já está configurado)
- [ ] Configurar variáveis de ambiente no Codespaces
- [ ] Testar envio de notificação
- [ ] Configurar sons customizados (opcional)

## Segurança

- ✅ Certificados já estão no .gitignore
- ✅ Usar variáveis de ambiente para caminhos
- ✅ Nunca commitar certificados no repositório
- ✅ Rotacionar certificados anualmente

## Troubleshooting

### Erro: "APNs provider não inicializado"
- Verifique se os certificados existem no caminho especificado
- Confirme que as variáveis de ambiente estão configuradas

### Erro: "Invalid token"
- Token expirou ou é inválido
- Dispositivo pode ter reinstalado o app

### Notificações não chegam
- Verifique se o app tem permissão para notificações
- Confirme que está usando o ambiente correto (produção/desenvolvimento)
- Verifique o Bundle ID no certificado

## Próximos Passos

Após configurar os certificados:

1. **Frontend iOS**: Já está implementado com Capacitor Push Notifications
2. **Testes**: Use o TestFlight para testar em ambiente real
3. **Monitoramento**: Implemente logs para acompanhar entregas
4. **Android**: Configurar FCM quando adicionar suporte Android

## Referências

- [Apple Developer - APNs](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [node-apn Documentation](https://github.com/node-apn/node-apn)