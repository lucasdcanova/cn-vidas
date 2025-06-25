# Configuração dos Certificados Apple Wallet

## Arquivos necessários

Para gerar passes do Apple Wallet, você precisa colocar os seguintes arquivos nesta pasta:

1. **wwdr.pem** - Apple Worldwide Developer Relations Certification Authority
   - Baixe de: https://developer.apple.com/certificationauthority/AppleWWDRCA.cer
   - Converta para PEM: `openssl x509 -in AppleWWDRCA.cer -inform DER -out wwdr.pem -outform PEM`

2. **signerCert.pem** - Seu certificado Pass Type ID
   - Gerado no Apple Developer Portal para seu Pass Type ID

3. **signerKey.key** - Chave privada do certificado
   - Gerada junto com o certificado

## Como obter os certificados

1. Acesse o [Apple Developer Portal](https://developer.apple.com)
2. Vá para Certificates, Identifiers & Profiles
3. Em Identifiers, crie um Pass Type ID (ex: pass.com.cnvidas.membership)
4. Em Certificates, crie um Pass Type ID Certificate
5. Baixe o certificado e exporte do Keychain Access como .p12
6. Converta o .p12 para .pem e .key:

```bash
# Extrair certificado
openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -out signerCert.pem

# Extrair chave privada
openssl pkcs12 -in Certificates.p12 -nocerts -out signerKey.key
```

## Variáveis de ambiente

Configure no arquivo .env:

```env
APPLE_PASS_TYPE_ID=pass.com.cnvidas.membership
APPLE_TEAM_ID=SEU_TEAM_ID
APPLE_PASS_KEY_PASSWORD=senha_da_chave_se_houver
```

## Estrutura esperada

```
server/wallet/certificates/
├── README.md (este arquivo)
├── wwdr.pem
├── signerCert.pem
└── signerKey.key
```

## Segurança

⚠️ **IMPORTANTE**: Nunca faça commit dos arquivos de certificado (.pem, .key) no Git!

O arquivo .gitignore já está configurado para ignorar estes arquivos.