# 🔧 Configuração AWS no Render

## Variáveis de Ambiente Necessárias

Adicione estas variáveis de ambiente no painel do Render:

### 1. Credenciais AWS
```
AWS_ACCESS_KEY_ID=sua_access_key_aqui
AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui
AWS_REGION=sa-east-1
```

### 2. Buckets S3 (opcional - já tem defaults)
```
S3_BUCKET_PROFILE=cnvidas-profile-images
S3_BUCKET_MEDICAL=cnvidas-medical-records
S3_BUCKET_RECORDINGS=cnvidas-consultations
S3_BUCKET_SENSITIVE=cnvidas-sensitive-docs
```

### 3. KMS Key (opcional - para criptografia adicional)
```
AWS_KMS_KEY_ID=sua_kms_key_id_aqui
```

## Como Adicionar no Render

1. Acesse o dashboard do Render
2. Vá para o serviço `cnvidas-web`
3. Clique em "Environment"
4. Adicione cada variável acima
5. Clique em "Save Changes"
6. O deploy será reiniciado automaticamente

## Verificar Configuração

Após configurar, teste novamente:

```bash
node test-upload-photo.mjs
```

## Permissões IAM Necessárias

A chave AWS precisa ter as seguintes permissões:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:GetObjectAcl",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::cnvidas-*/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::cnvidas-*"
    }
  ]
}
```

## Teste Local (opcional)

Para testar localmente, crie um arquivo `.env` com:

```env
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=sa-east-1
```

## 🚨 Importante

- **NUNCA** commite as credenciais AWS no Git
- Use sempre variáveis de ambiente
- Rotacione as chaves regularmente
- Configure alertas de uso no AWS CloudWatch