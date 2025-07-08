# Configuração do Apple Wallet para CN Vidas

## Problema Identificado
As variáveis de ambiente necessárias para gerar os passes do Apple Wallet não estão configuradas no Codespaces.

## Variáveis Necessárias

Você precisa adicionar as seguintes variáveis no Codespaces Secrets:

1. **APPLE_PASS_TYPE_ID**
   - Formato: `pass.com.cnvidas.membership`
   - Obtido no Apple Developer Portal

2. **APPLE_TEAM_ID**
   - Formato: `XXXXXXXXXX` (10 caracteres)
   - Obtido no Apple Developer Portal

3. **WALLET_SIGNER_CERT_BASE64**
   - Certificado de assinatura em Base64
   - Gerado no Apple Developer Portal

4. **WALLET_WWDR_BASE64**
   - Certificado WWDR (Apple Worldwide Developer Relations) em Base64
   - Download: https://www.apple.com/certificateauthority/

5. **WALLET_SIGNER_KEY_BASE64**
   - Chave privada do certificado em Base64

6. **APPLE_PASS_KEY_PASSWORD**
   - Senha da chave privada (se houver)

## Como Configurar no Codespaces

1. Vá para: https://github.com/lucasdcanova/CNVidas-updated/settings/secrets/codespaces
2. Clique em "New repository secret"
3. Adicione cada variável acima

## Como Converter Certificados para Base64

### macOS/Linux:
```bash
# Para converter certificado .pem para Base64:
base64 -i signerCert.pem -o signerCert.base64

# Para converter chave .key para Base64:
base64 -i signerKey.key -o signerKey.base64

# Para converter WWDR:
base64 -i AppleWWDRCA.pem -o wwdr.base64
```

### Ou use este comando para copiar direto para clipboard:
```bash
base64 -i arquivo.pem | pbcopy
```

## Estrutura dos Certificados

### 1. Pass Type Certificate
- Criar no Apple Developer Portal
- Certificates, Identifiers & Profiles > Pass Type IDs
- Criar novo Pass Type ID se necessário
- Gerar certificado para este Pass Type ID

### 2. WWDR Certificate
- Download: https://www.apple.com/certificateauthority/
- Baixar "Apple Worldwide Developer Relations Certification Authority"

### 3. Exportar do Keychain (macOS)
1. Abra Keychain Access
2. Encontre o certificado "Pass Type ID: pass.com.cnvidas.membership"
3. Exporte como .p12
4. Converta para .pem:
   ```bash
   openssl pkcs12 -in Certificates.p12 -out signerCert.pem -clcerts -nokeys
   openssl pkcs12 -in Certificates.p12 -out signerKey.key -nocerts -nodes
   ```

## Teste Após Configuração

Após adicionar as variáveis no Codespaces:

1. Reinicie o Codespace
2. Execute o teste:
   ```bash
   node test-wallet.js
   ```

Se tudo estiver correto, você verá:
```
✅ SUCESSO! O sistema de wallet está funcionando corretamente.
```

## Próximos Passos

1. Configure as variáveis no Codespaces Secrets
2. Reinicie o Codespace para carregar as variáveis
3. Execute o teste para verificar
4. Faça build e sincronize com iOS
5. Teste no TestFlight

## Notas Importantes

- Os certificados devem ser válidos e não expirados
- O Pass Type ID deve corresponder ao configurado no Apple Developer Portal
- O Team ID deve ser o ID da sua equipe de desenvolvimento Apple
- Mantenha as chaves privadas seguras e nunca as commite no repositório