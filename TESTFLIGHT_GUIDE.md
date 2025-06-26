# Guia de Publicação no TestFlight - CNVidas

## 📋 Checklist Pré-Publicação

### 1. Verificações no Código
- [ ] Remover todos os `console.log` de debug
- [ ] Verificar URLs de produção (não localhost)
- [ ] Testar funcionalidades críticas no dispositivo físico
- [ ] Verificar permissões (câmera, notificações, etc.)

### 2. Configurações do Projeto

#### Bundle Identifier
- **Atual**: `com.cnvidas.app`
- **Team ID**: `9D7X84MT44`

#### Versão e Build
Atualizar em `ios/App/App.xcodeproj/project.pbxproj`:
- Version: 1.0.0 (para primeira versão)
- Build: 1 (incrementar a cada upload)

### 3. Preparação no App Store Connect

#### Criar o App
1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Clique em "My Apps" > "+"
3. Preencha:
   - **Platform**: iOS
   - **Name**: CN Vidas
   - **Primary Language**: Portuguese (Brazil)
   - **Bundle ID**: com.cnvidas.app
   - **SKU**: cnvidas-app-2025

#### Informações Obrigatórias
- **Category**: Medical
- **Content Rights**: Confirmar que possui direitos do conteúdo
- **Age Rating**: 12+ (devido a informações médicas)

### 4. Preparar Screenshots e Metadados

#### Screenshots Obrigatórios (use simulador):
- iPhone 6.7" (1290 x 2796) - iPhone 15 Pro Max
- iPhone 6.5" (1242 x 2688) - iPhone 11 Pro Max
- iPhone 5.5" (1242 x 2208) - iPhone 8 Plus
- iPad 12.9" (2048 x 2732) - iPad Pro

#### Descrição do App
```
CN Vidas - Telemedicina e Saúde Digital

Acesso completo à saúde digital para você e sua família:

• Consultas médicas por vídeo 24/7
• Agendamento com especialistas
• Prontuário eletrônico seguro
• Planos familiares com descontos
• Rede de parceiros com benefícios exclusivos

Cuide da sua saúde com praticidade e segurança.
```

#### Palavras-chave
```
telemedicina, consulta online, médico online, saúde digital, prontuário eletrônico
```

### 5. Build e Upload

#### No Xcode:
1. Selecione "Any iOS Device (arm64)" como destino
2. Product > Archive
3. Aguarde o build completar
4. Na janela Organizer:
   - Validate App (verificar problemas)
   - Distribute App > App Store Connect > Upload

#### Informações para Beta:
- **What to Test**: "Funcionalidades de login, agendamento de consultas e videochamadas"
- **Beta App Description**: "App de telemedicina com consultas online e gestão de saúde"

### 6. Configurar TestFlight

#### Teste Interno:
1. Em App Store Connect > TestFlight
2. Adicionar testadores internos (até 100)
3. Build fica disponível imediatamente

#### Teste Externo:
1. Criar grupo de teste externo
2. Adicionar build ao grupo
3. Preencher informações de teste
4. Aguardar aprovação (24-48h)

### 7. Certificados e Provisioning

Verificar em Xcode:
- Signing & Capabilities > Automatically manage signing ✓
- Team: Lucas Canova (9D7X84MT44)
- Bundle Identifier: com.cnvidas.app

### 8. Problemas Comuns

#### "Missing Compliance"
- Adicionar em Info.plist:
```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

#### Ícones
Verificar em `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- Todos os tamanhos necessários
- Sem transparência
- Formato PNG

### 9. Comandos Úteis

```bash
# Limpar build
cd ios/App
rm -rf ~/Library/Developer/Xcode/DerivedData

# Atualizar pods
pod install --repo-update

# Build via linha de comando
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release
```

### 10. Após Upload

1. Aguardar processamento (15-30 min)
2. Build aparece em TestFlight
3. Para teste externo: Submit for Beta App Review
4. Monitorar feedback dos testadores

## 📱 Contatos Importantes

- **Suporte Apple Developer**: developer.apple.com/contact
- **TestFlight Help**: testflight.apple.com/help

## ⚠️ Importante

- Sempre teste no dispositivo real antes de enviar
- Mantenha backup do arquivo .ipa
- Documente mudanças entre versões
- Configure notificações de crash reports