# Guia de Setup iOS - CN Vidas

## Status Atual

✅ **Implementado no Repositório:**
- Capacitor instalado e configurado
- Push Notifications implementado (frontend e backend)
- Deep linking configurado
- Modal de permissão de notificações
- Estrutura para APNs (aguardando certificados)
- Placeholders para ícone e splash screen

## Próximos Passos no Mac

### 1. Clonar e Preparar o Projeto
```bash
git clone https://github.com/lucasdcanova/CNVidas-updated.git
cd CNVidas-updated
yarn install
yarn build
npx cap sync ios
```

### 2. Adicionar Ícone e Splash Screen

#### Ícone (1024x1024px):
1. Criar imagem com logo CN Vidas
2. Fundo branco sólido
3. Salvar como `resources/icon.png`

#### Splash Screen (2732x2732px):
1. Logo CN Vidas centralizado
2. Fundo branco ou gradiente da marca
3. Salvar como `resources/splash.png`

#### Gerar assets:
```bash
yarn add -D @capacitor/assets
npx capacitor-assets generate --ios
```

### 3. Abrir no Xcode
```bash
npx cap open ios
```

### 4. Configurações no Xcode

#### General:
- Display Name: CN Vidas
- Bundle ID: com.cnvidas.app
- Version: 1.0.0
- Build: 1

#### Signing & Capabilities:
- Team: [Sua conta developer]
- ✓ Automatically manage signing
- Add Capability: Push Notifications

#### Info.plist - Adicionar:
```xml
<key>NSCameraUsageDescription</key>
<string>CN Vidas precisa acessar a câmera para videochamadas com médicos</string>
<key>NSMicrophoneUsageDescription</key>
<string>CN Vidas precisa acessar o microfone para consultas médicas online</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>CN Vidas precisa acessar suas fotos para enviar documentos médicos</string>
```

### 5. Certificados Push Notifications

#### No Apple Developer:
1. Identifiers → com.cnvidas.app
2. Capabilities → Push Notifications ✓
3. Keys → Create new key
4. Selecionar "Apple Push Notifications service (APNs)"
5. Download do .p8

#### Guardar informações:
- Key ID: XXXXXXXXXX
- Team ID: XXXXXXXXXX
- .p8 file path

### 6. Testar no Dispositivo

1. Conectar iPhone via USB
2. Selecionar dispositivo no Xcode
3. Build and Run (⌘R)
4. Testar:
   - Modal de permissão aparece
   - Push notifications (após implementar APNs)
   - Navegação deep linking
   - Todas funcionalidades do PWA

### 7. Implementar APNs no Backend

Adicionar no `.env`:
```
APNS_KEY_ID=XXXXXXXXXX
APNS_TEAM_ID=XXXXXXXXXX
APNS_KEY_PATH=./path/to/AuthKey_XXXXXXXXXX.p8
APNS_BUNDLE_ID=com.cnvidas.app
```

Instalar biblioteca:
```bash
yarn add apn
```

### 8. Build para App Store

1. Product → Archive
2. Validate App
3. Distribute App → App Store Connect

### 9. App Store Connect

#### Informações Obrigatórias:
- **Nome**: CN Vidas
- **Subtítulo**: Telemedicina ao seu alcance
- **Descrição**: [Copiar do site]
- **Categoria**: Medicina
- **Idade**: 12+ (conteúdo médico)

#### Screenshots (obrigatórios):
- iPhone 6.7" (1290 x 2796)
- iPhone 6.5" (1242 x 2688)
- iPhone 5.5" (1242 x 2208)

#### Políticas:
- URL de Privacidade: https://cnvidas.com.br/privacy
- URL de Termos: https://cnvidas.com.br/terms

## Checklist Final

- [ ] Ícone 1024x1024 adicionado
- [ ] Splash screen 2732x2732 adicionada
- [ ] Assets gerados com capacitor-assets
- [ ] Certificados APNs configurados
- [ ] Info.plist com permissões
- [ ] Teste em dispositivo real
- [ ] Screenshots para App Store
- [ ] Build de produção
- [ ] Upload para App Store Connect

## Notas Importantes

1. **Push Notifications**: Estrutura pronta, falta apenas adicionar certificado .p8 e Key ID
2. **Deep Linking**: Já configurado para abrir telas corretas
3. **PWA**: Continua funcionando 100% na web
4. **Banco de Dados**: Migration device_tokens já criada

## Suporte

Em caso de dúvidas durante o setup no Mac, os arquivos principais são:
- `capacitor.config.ts` - Configurações do Capacitor
- `client/src/services/push-notifications.ts` - Lógica de notificações
- `server/services/push-notification-service.ts` - Backend (adicionar APNs aqui)