# Configuração do Apple Wallet - CNVidas

## Status Atual

O código para gerar passes do Apple Wallet está **100% implementado**. Falta apenas:
1. Certificados Pass Type ID
2. Assets (ícones e logos)
3. Ativar a rota completa

## Passo a Passo

### 1. Criar Pass Type ID (Apple Developer)

1. Acesse https://developer.apple.com/account
2. Vá para **Certificates, Identifiers & Profiles**
3. Em **Identifiers**, clique em **"+"**
4. Escolha **Pass Type IDs**
5. Use o identificador: `pass.com.cnvidas.membership`
6. Description: "CN Vidas Membership Card"

### 2. Gerar Certificado Pass Type ID

1. Em **Certificates**, clique em **"+"**
2. Escolha **Pass Type ID Certificate**
3. Selecione o Pass Type ID criado
4. Faça upload do CSR (vamos gerar abaixo)
5. Baixe o certificado

### 3. Gerar CSR e Converter Certificados

```bash
# Gerar chave privada e CSR
openssl genrsa -out passkey.key 2048
openssl req -new -key passkey.key -out pass.certSigningRequest -subj "/CN=CN Vidas Pass Certificate/C=BR"

# Após baixar o certificado da Apple (pass_type.cer):
# Converter para PEM
openssl x509 -in pass_type.cer -inform DER -out signerCert.pem -outform PEM

# Criar P12 (se necessário)
openssl pkcs12 -export -out pass_certificate.p12 -inkey passkey.key -in signerCert.pem -passout pass:cnvidas2024

# Extrair chave e certificado do P12
openssl pkcs12 -in pass_certificate.p12 -clcerts -nokeys -out server/wallet/certificates/signerCert.pem -passin pass:cnvidas2024
openssl pkcs12 -in pass_certificate.p12 -nocerts -out server/wallet/certificates/signerKey.key -passin pass:cnvidas2024 -passout pass:cnvidas2024

# Baixar WWDR
curl -O https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer
openssl x509 -in AppleWWDRCAG4.cer -inform DER -out server/wallet/certificates/wwdr.pem -outform PEM
```

### 4. Criar Assets

Você precisa converter o logo SVG para PNG. Use ferramentas online como:
- https://cloudconvert.com/svg-to-png
- https://convertio.co/pt/svg-png/

Tamanhos necessários:
- **icon.png**: 29x29px
- **icon@2x.png**: 58x58px
- **logo.png**: 160x50px (máximo)
- **logo@2x.png**: 320x100px (máximo)

Coloque os arquivos em: `/server/wallet/assets/`

### 5. Configurar Variáveis de Ambiente

No Render, adicione:
```
APPLE_PASS_TYPE_ID=pass.com.cnvidas.membership
APPLE_TEAM_ID=[SEU_TEAM_ID]
APPLE_PASS_KEY_PASSWORD=cnvidas2024
```

### 6. Ativar Rota Completa

Após ter os certificados, edite `/server/routes/index.ts`:
```typescript
// Trocar:
import walletRouter from './wallet-routes-simplified';
// Por:
import walletRouter from './wallet-routes';
```

## Teste Local

1. Coloque os certificados em `/server/wallet/certificates/`
2. Coloque os assets em `/server/wallet/assets/`
3. Reinicie o servidor
4. Teste gerando um pass

## Produção (Render)

Para o Render, converta os certificados para Base64:
```bash
base64 -i server/wallet/certificates/signerCert.pem | tr -d '\n' > signerCert-base64.txt
base64 -i server/wallet/certificates/signerKey.key | tr -d '\n' > signerKey-base64.txt
base64 -i server/wallet/certificates/wwdr.pem | tr -d '\n' > wwdr-base64.txt
```

Adicione como variáveis de ambiente:
- `WALLET_SIGNER_CERT_BASE64`
- `WALLET_SIGNER_KEY_BASE64`
- `WALLET_WWDR_BASE64`

## Verificação

Quando tudo estiver configurado:
1. O usuário poderá baixar o pass do app
2. O pass mostrará o QR code do paciente
3. As cores corresponderão ao plano
4. O pass será adicionado ao Apple Wallet

## Próximos Passos

1. Obter Pass Type ID no Apple Developer
2. Gerar certificados
3. Criar assets PNG
4. Ativar rota completa
5. Testar no TestFlight