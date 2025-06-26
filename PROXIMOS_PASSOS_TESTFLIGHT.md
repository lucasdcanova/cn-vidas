# 🚀 Próximos Passos para Publicar no TestFlight

## 1. App Store Connect (Fazer AGORA)

### Acesse: https://appstoreconnect.apple.com

1. **Criar o App:**
   - My Apps > "+" > New App
   - Platform: iOS
   - Name: **CN Vidas**
   - Primary Language: **Portuguese (Brazil)**
   - Bundle ID: **com.cnvidas.app**
   - SKU: **cnvidas-app-2025**
   - Category: **Medical**

2. **Preencher informações básicas:**
   - Subtitle: "Telemedicina e Saúde Digital"
   - Privacy Policy URL: https://cnvidas.com.br/privacy (atualizar depois)
   - Category: Medical
   - Age Rating: 12+ (Medical/Treatment Information)

## 2. Preparar o Build (No Terminal)

```bash
# Execute na raiz do projeto
./prepare-testflight.sh
```

## 3. No Xcode

1. **Abrir o projeto:**
```bash
cd ios/App
open App.xcworkspace
```

2. **Configurações importantes:**
   - Selecione "Any iOS Device (arm64)" como destino
   - Verifique em Signing & Capabilities:
     - Team: Lucas Canova (9D7X84MT44)
     - Bundle ID: com.cnvidas.app
     - Signing: Automatic

3. **Criar Archive:**
   - Product > Clean Build Folder (⇧⌘K)
   - Product > Archive (aguarde ~5-10 min)

4. **Upload:**
   - Na janela Organizer que abre:
   - "Validate App" primeiro
   - Se validar OK: "Distribute App"
   - App Store Connect > Upload
   - Next > Next > Upload

## 4. Configurar TestFlight

### Após ~15-30 min do upload:

1. **Teste Interno (Imediato):**
   - TestFlight > Internal Testing
   - Add Internal Testers (você + equipe dev)
   - Máximo 100 pessoas

2. **Informações de Compliance:**
   - Export Compliance: No (já configuramos no Info.plist)
   - Content Rights: Yes
   - Advertising ID: No

3. **Para Beta Público (Requer aprovação):**
   - External Testing > Add External Group
   - Test Information:
     ```
     What to Test:
     - Login com email e senha
     - Agendamento de consultas
     - Videochamadas
     - Navegação geral do app
     
     Test Account (se necessário):
     Email: teste@cnvidas.com
     Senha: (criar conta de teste)
     ```

## 5. Mensagem para Testadores

```
Bem-vindo ao beta do CN Vidas!

Por favor, teste:
1. Processo de login/cadastro
2. Agendamento de consultas
3. Qualidade das videochamadas
4. Performance geral

Reporte bugs pelo TestFlight ou email: suporte@cnvidas.com.br

Obrigado por nos ajudar a melhorar!
```

## 6. Monitoramento

- **Crashes**: Aparecem em TestFlight > Crashes
- **Feedback**: TestFlight > Feedback
- **Métricas**: App Analytics (após aprovação)

## ⚠️ Importante

1. **Sempre incremente o build number** para cada upload
2. **Teste no dispositivo real** antes de enviar
3. **Mantenha o Xcode atualizado**
4. **Backup do .ipa** em Organizer

## 🎯 Timeline Esperada

- Upload: ~10-15 min
- Processamento Apple: ~15-30 min
- Teste Interno: Imediato após processamento
- Beta Review (externo): 24-48h
- Publicação final: 1-7 dias após submissão

Boa sorte! 🍀