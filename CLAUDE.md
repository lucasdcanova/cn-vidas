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
- Chave pública: `pk_live_51RAOnMKOsPzrrDErXaDRtMivvPi3iVD7socexHWBbvb5BEjeUuDBxhC3WTrBRC9NLJ1IASrSAI8SGQj8ZF9uZA8F002np3ZUCz`
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

### iOS - Desenvolvimento Local + Xcode Cloud

O Xcode está instalado localmente. Use os comandos de sync antes de commitar.

**Fluxo de desenvolvimento iOS:**
```bash
# 1. Faça suas mudanças no código

# 2. Build do projeto web
npm run build

# 3. Sincronizar com iOS (OBRIGATÓRIO antes de commitar)
npx cap sync ios

# 4. Commit e push
git add .
git commit -m "sua mensagem"
git push origin main

# 5. O Xcode Cloud compila e envia para TestFlight automaticamente
```

**Comandos iOS disponíveis:**
```bash
npx cap sync ios      # Sincroniza web assets e plugins com iOS
npx cap copy ios      # Copia apenas web assets (sem plugins)
npx cap open ios      # Abre projeto no Xcode
pod install           # Instala dependências CocoaPods (rodar em ios/App/)
```

**O que o Xcode Cloud faz automaticamente:**
1. Detecta push para `main`
2. Executa `ci_post_clone.sh` (build + cap sync + pod install)
3. Compila app iOS
4. Publica no TestFlight

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
├── ios/             # Projeto iOS (gerenciado pelo Xcode Cloud)
├── android/         # Projeto Android (Android Studio)
└── capacitor.config.ts  # Configuração do Capacitor
```

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
# iOS
npx cap sync ios      # Sincroniza web assets e plugins
npx cap copy ios      # Copia apenas web assets
npx cap open ios      # Abre no Xcode

# Android
npx cap sync android
npx cap copy android
npx cap open android  # Abre Android Studio

# Adicionar plugins (sincronizar ambas plataformas)
npm install @capacitor/[plugin-name]
npx cap sync ios && npx cap sync android
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

**Para desenvolvimento web/geral:**
1. **Desenvolver localmente ou no Codespaces**
2. **Testar no navegador** (`npm run dev`)
3. **Commit e push** (`git add . && git commit && git push`)
4. **Deploy automático** para homologação (www.homologacao.cnvidas.com.br)

**Para desenvolvimento mobile:**
1. **Desenvolver e testar** no navegador (`npm run dev`)
2. **Build do projeto web** (`npm run build`)
3. **Sincronizar com iOS** (`npx cap sync ios`) - OBRIGATÓRIO antes de commitar
4. **Commit e push** para GitHub
5. **Build automático iOS** via Xcode Cloud → TestFlight
6. **Build automático Android** via GitHub Actions → Firebase App Distribution
7. **Testar** no TestFlight (iOS) ou Firebase (Android)

## Notas de desenvolvimento

- Sistema usa autenticação por cookies HTTP-only
- Upload de imagens limitado a 10MB
- Sessões de vídeo expiram após 1 hora
- PIX tem timeout de 60 minutos
- Boleto tem prazo de 3 dias

## Memórias de Desenvolvimento

### Workflow Mobile
- ✅ Executar `npx cap sync ios` localmente antes de commitar (Xcode instalado)
- ✅ Build web (`npm run build`) antes de sync
- ✅ Xcode Cloud compila e publica no TestFlight automaticamente após push

### Certificados e Publicação
- Lembre dos certificados antes de pedirmos publicação na App Store
- Lembre de certificados APNs para notificações antes de enviar para Apple
- Certificados de produção necessários para notificações push funcionarem

### Arquivos a NUNCA Commitar
- Arquivos duplicados do macOS (sufixo " 2", " 3", " 4")
- PDFs e contratos na raiz do projeto
- Logos de trabalho na raiz
- Diretório `social-media-posts/`
- Diretório `ios/App/dist/` (gerado automaticamente)
- Assets compilados em `ios/App/App/public/assets/*.js` e `*.css`
- O `.gitignore` já está configurado para ignorar estes arquivos

### Geral
- Sempre responda em português do Brasil
- Git estava lento devido a arquivos duplicados commitados acidentalmente (resolvido em 25/01/2026)

## Problemas Conhecidos e Soluções

### Git muito lento, operações demorando muito
**Causa:** Arquivos grandes ou duplicados commitados acidentalmente
**Solução:**
- Verificar `git status` e remover arquivos grandes com `git rm`
- O `.gitignore` foi atualizado para prevenir isso
- Evitar commitar PDFs, logos grandes, ou diretórios de marketing

### Arquivos duplicados aparecem (sufixo " 2", " 3")
**Causa:** macOS Finder cria esses arquivos ao duplicar
**Solução:** O `.gitignore` agora ignora esses padrões automaticamente

## Deploy

O projeto está configurado para deploy automático:
- **URL do sistema (homologação e produção)**: https://www.homologacao.cnvidas.com.br
- **URL da landing page (site institucional)**: https://www.cnvidas.com.br
- **Deploy automático**: Após cada `git push` para a branch `main`

IMPORTANTE: 
- NUNCA use URLs como cnvidas.onrender.com
- O sistema SEMPRE roda em www.homologacao.cnvidas.com.br (mesmo em produção)
- cnvidas.com.br é apenas a landing page, NÃO é o sistema

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
