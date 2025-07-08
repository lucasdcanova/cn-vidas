# Configuração de Push Notifications no Render

## Informações da Auth Key

- **Key ID**: 56Q6H6FHB6
- **Team ID**: [Você precisa pegar no Apple Developer → Membership]
- **Bundle ID**: com.cnvidas.app

## Passo a Passo para Configurar no Render

### 1. Converter Auth Key para Base64

No terminal do Codespaces, execute:

```bash
base64 -i certificates/push/AuthKey_56Q6H6FHB6.p8 | tr -d '\n' > auth-key-base64.txt
```

### 2. No Render Dashboard

1. Acesse seu serviço no Render
2. Vá para **Environment** → **Environment Variables**
3. Adicione as seguintes variáveis:

```
APNS_TEAM_ID = [SEU_TEAM_ID]
APNS_KEY_ID = 56Q6H6FHB6
APNS_AUTH_KEY_BASE64 = [conteúdo do arquivo auth-key-base64.txt]
APNS_TOPIC = com.cnvidas.app
```

### 3. Atualizar o Código para Usar Base64

O servidor precisa ser atualizado para decodificar o Base64 em produção. 

**Arquivo**: `server/config/apns-config.ts`

```typescript
// Adicionar função para obter Auth Key
getAuthKey(): string {
  if (process.env.APNS_AUTH_KEY_BASE64) {
    // Em produção, decodificar Base64
    const keyPath = '/tmp/AuthKey.p8';
    const keyContent = Buffer.from(process.env.APNS_AUTH_KEY_BASE64, 'base64');
    fs.writeFileSync(keyPath, keyContent);
    return keyPath;
  }
  // Em desenvolvimento, usar arquivo local
  return this.authKeyPath;
}
```

### 4. Testar no TestFlight

Após configurar:
1. O servidor será reiniciado automaticamente
2. Verifique os logs no Render para confirmar: "✅ Auth Key APNs encontrada"
3. Teste enviando uma notificação push

## Onde Encontrar o Team ID

1. Acesse https://developer.apple.com/account
2. Clique em **Membership** no menu lateral
3. O Team ID aparece no formato: **XXXXXXXXXX** (10 caracteres)

## Segurança

- ✅ Auth Key não expira (ao contrário dos certificados)
- ✅ Funciona para desenvolvimento E produção
- ✅ Não é enviada para o Git (Base64 apenas nas variáveis de ambiente)
- ✅ Render criptografa as variáveis de ambiente

## Troubleshooting

Se as notificações não funcionarem:

1. Verifique os logs do Render
2. Confirme que o Team ID está correto
3. Verifique se o app tem permissão de Push no iOS
4. Teste primeiro com um dispositivo de desenvolvimento