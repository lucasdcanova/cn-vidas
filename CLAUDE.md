# Claude Code Instructions

## Projeto CNVidas

Sistema de telemedicina desenvolvido com React, TypeScript, Node.js e PostgreSQL.

## Comandos importantes

### Frontend
```bash
# Instalar dependências
yarn install

# Rodar em desenvolvimento
yarn dev

# Build para produção
yarn build

# Verificar tipos
yarn typecheck

# Lint
yarn lint
```

### Backend
```bash
# O servidor roda junto com o frontend em desenvolvimento
# Porta padrão: 3001
```

## Estrutura do projeto

```
/
├── client/          # Frontend React + Vite
├── server/          # Backend Node.js + Express
├── db/             # Configurações e migrations do banco
└── uploads/        # Arquivos enviados pelos usuários
```

## Tecnologias principais

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Banco de dados**: PostgreSQL com Drizzle ORM
- **Autenticação**: JWT
- **Pagamentos**: Stripe
- **Upload de arquivos**: Multer
- **Video chamadas**: Daily.co

## Informações importantes

### Stripe
- PIX precisa ser ativado no dashboard do Stripe
- Chave pública: `pk_live_REDACTED_STRIPE_PUBLISHABLE`
- Métodos de pagamento: cartão, PIX, boleto

### Planos de assinatura
- basic (Básico)
- standard (Padrão)
- premium (Premium)
- family_basic (Familiar Básico)
- family_plus (Familiar Plus)
- ultra_family (Ultra Familiar)
- medical (Plano Médico - gratuito)

### Funcionalidades principais
- Agendamento de consultas
- Videochamadas
- Chat em tempo real
- Prontuário eletrônico
- Sistema de notificações
- Upload de documentos médicos
- Consultas de emergência

## Padrões de código

- Usar TypeScript strict mode
- Seguir convenções do projeto existente
- Componentes React funcionais com hooks
- Tailwind para estilização
- Shadcn/ui para componentes de UI
- Tratamento de erros com try/catch
- Logs detalhados no console para debugging

## Antes de commitar

1. Verificar tipos: `yarn typecheck`
2. Rodar lint: `yarn lint`
3. Testar funcionalidades afetadas
4. Verificar console por erros

## Desenvolvimento Mobile

### iOS

Para fazer push e sincronizar automaticamente com o iOS:
```bash
./push-and-sync.sh
```

Este script faz o push para o GitHub e, se bem-sucedido, executa a sincronização com o iOS automaticamente.

### Android

Para sincronizar com Android após mudanças:
```bash
./sync-android.sh
```

Ou manualmente:
```bash
npm run build
npx cap sync android
```

### Estrutura Mobile
```
/
├── ios/             # Projeto iOS (Xcode)
├── android/         # Projeto Android (Android Studio)
└── capacitor.config.ts  # Configuração do Capacitor
```

### Desenvolvimento Mobile sem Computador Local

#### iOS - Xcode Cloud
Já configurado no projeto. Builds automáticos após push.

#### Android - GitHub Actions / CI/CD

O projeto tem workflows configurados para build automático:

1. **Build de Debug** (`.github/workflows/android-build.yml`)
   - Ativado em push para `main`
   - Gera APK de debug
   - Download via GitHub Actions

2. **Firebase App Distribution** (`.github/workflows/android-firebase-deploy.yml`)
   - Distribui para testers
   - Similar ao TestFlight

3. **Deploy Play Store** (`.github/workflows/android-play-store.yml`)
   - Ativado por tags `v*`
   - Publica na Play Store

#### Configurar CI/CD Android

1. **Ativar GitHub Actions**
   - Vá em Settings → Actions → Enable

2. **Configurar Secrets** (Settings → Secrets → Actions):
   ```
   FIREBASE_APP_ID         # ID do app no Firebase
   FIREBASE_CREDENTIALS    # JSON de credenciais Firebase
   ANDROID_KEYSTORE       # Keystore base64 (para release)
   KEYSTORE_PASSWORD      # Senha do keystore
   KEY_ALIAS             # Alias da chave
   KEY_PASSWORD          # Senha da chave
   PLAY_STORE_CREDENTIALS # JSON para upload Play Store
   ```

3. **Firebase Setup**:
   - Criar projeto no Firebase Console
   - Baixar `google-services.json`
   - Colocar em `/android/app/`

### Comandos Úteis Mobile

```bash
# Verificar status
npx cap doctor

# Sincronizar ambas plataformas
npx cap sync

# Apenas copiar assets (mais rápido)
npx cap copy ios
npx cap copy android

# Abrir IDEs
npx cap open ios      # Abre Xcode
npx cap open android  # Abre Android Studio

# Adicionar plugins
npm install @capacitor/[plugin-name]
npx cap sync
```

### Permissões Android Configuradas

O `AndroidManifest.xml` já inclui:
- Internet e rede
- Câmera e armazenamento
- Notificações (push e locais)
- Biometria
- Áudio/vídeo (chamadas)
- Localização (emergências)
- Wake lock

### Fluxo de Desenvolvimento Recomendado

1. **Desenvolver no Codespaces**
2. **Testar no navegador** (`npm run dev`)
3. **Build e sync** (`npm run build && npx cap sync`)
4. **Push para GitHub**
5. **Build automático** via Xcode Cloud (iOS) ou GitHub Actions (Android)
6. **Testar via TestFlight** (iOS) ou Firebase App Distribution (Android)

## Notas de desenvolvimento

- Sistema usa autenticação por cookies HTTP-only
- Upload de imagens limitado a 10MB
- Sessões de vídeo expiram após 1 hora
- PIX tem timeout de 60 minutos
- Boleto tem prazo de 3 dias

## Memórias de Desenvolvimento

- sempre sincronizar o ios apos um push
- lembre dos certificados antes de pedirmos a publicacao na app store
- lembre de certificados apns para notificacoes antes de mandarmps para apple
- sempre responda em portugues do brasil

## Deploy

O projeto está configurado para deploy automático no Render:
- **URL de produção**: https://cnvidas.onrender.com
- **Deploy automático**: Após cada `git push` para a branch `main`
- **Configuração**: Definida no arquivo `render.yaml`

## Integração VIDaaS - Certificação Digital de Médicos (A IMPLEMENTAR)

### Objetivo
Integrar certificado digital VIDaaS (ICP-Brasil) para validar identidade dos médicos usando certificado e-CPF do CFM.

### Contatos para Cadastro
- **Email**: suportecorp.certificadora@valid.com
- **Telefone**: 3004-3454 (SP) ou 0800-725-4565 (outras localidades)
- **Solicitar**: Cadastro de aplicação cliente para integração VIDaaS/PSC

### Ambientes VIDaaS
- **Produção**: https://certificado.vidaas.com.br
- **Homologação**: https://hml-certificado.vidaas.com.br
- **Demonstração**: https://demo-certificado.vidaas.com.br

### Arquitetura Planejada

#### 1. Banco de Dados
Nova tabela `doctor_digital_certificates`:
- userId (FK)
- certificateData
- validatedAt
- expiresAt
- certificateType
- certificateMetadata (JSON)

#### 2. Backend (Node.js)
**Novo serviço**: `server/services/vidaas-service.ts`
- Descoberta de usuário (CPF)
- Geração de QR Code para autorização
- Validação OAuth 2.0 com PKCE
- Obtenção e validação do certificado

**Novos endpoints**:
- POST `/api/doctors/certificate/initiate` - Inicia processo
- POST `/api/doctors/certificate/validate` - Valida após autorização
- GET `/api/doctors/certificate/status` - Status da certificação

#### 3. Frontend/iOS
**Fluxo de certificação**:
1. Médico informa CPF
2. Sistema verifica se CPF tem certificado no VIDaaS
3. Gera QR Code para autorização
4. Médico usa app VIDaaS para autorizar
5. Sistema recebe callback e valida certificado
6. Armazena status de verificação

**Componentes necessários**:
- Tela de verificação de identidade
- Componente QR Code
- Deep linking para retorno do VIDaaS
- Status de verificação no perfil

### Implementação iOS
- Configurar deep links no Capacitor
- Handler para OAuth callback
- Armazenamento seguro com @capacitor/secure-storage

### Segurança
- OAuth 2.0 com PKCE obrigatório
- Tokens com expiração curta
- Validação periódica do certificado
- Logs de auditoria completos

### Benefícios
- Validação legal ICP-Brasil
- Integração com certificado gratuito CFM
- Permite assinatura digital de documentos
- Conformidade com telemedicina

### Passos para Implementação
1. Solicitar cadastro no Valid PSC (client_id/secret)
2. Implementar serviço VIDaaS no backend
3. Criar fluxo de onboarding com certificação
4. Integrar deep linking no iOS
5. Testes em ambiente de homologação
6. Deploy para produção

### Referências
- [Documentação VIDaaS](https://www.digiforte.com.br/pt/docs/vidaas/vidaas)
- [API PSC Valid](https://validcertificadora.com.br/pages/psc-integracao-via-api)

## Workflow de Desenvolvimento

- Entenda o workflow: estou programando no Codespaces WEB pelo ipad com o claude code no terminal do codespaces web no ipad. O deploy está sendo feito automaticamente para xcode claude e os teste estao sendo feito principalmente pelo test flight com testes interno.

## Secrets

- as variaveis do ambiente estao salvas no codespaces secrets

## Memórias

- lembre-se de sempre procurar os screenshots na pasta temp-screenshots na raiz do projeto, que vai ser onde eu vou colocar arquivos temporarios para voce ler.

## Memórias de Desenvolvimento

- lembre de ver por que os scripts nao estao sendo executados para podermos tirar essa quantidade todas de arquivos do git
