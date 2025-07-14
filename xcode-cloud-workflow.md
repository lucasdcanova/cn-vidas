# Configuração do Xcode Cloud para CNVidas

## 📋 Pré-requisitos

1. **Apple Developer Account** com acesso ao App Store Connect
2. **Certificados e Provisioning Profiles** configurados
3. **Repositório GitHub** conectado ao Xcode Cloud
4. **Bundle ID**: `com.cnvidas.app`

## 🚀 Passos para Configurar o Xcode Cloud

### 1. Abrir o Projeto no Xcode

```bash
# No terminal do macOS
cd /path/to/CNVidas-updated
yarn cap:ios  # ou npm run cap:ios
```

### 2. Conectar ao Xcode Cloud

1. No Xcode, vá para **Product > Xcode Cloud > Create Workflow**
2. Selecione o repositório GitHub `CNVidas-updated`
3. Autorize o acesso do Xcode Cloud ao GitHub se solicitado

### 3. Configurar Workflow Básico

#### Workflow de CI (Integração Contínua)

**Nome**: `CI - Build e Teste`

**Trigger**:
- Branch: `main`
- Eventos: Push e Pull Request

**Environment**:
- Xcode Version: Latest Release
- macOS Version: Latest

**Actions**:
1. **Archive** - Build do app
2. **Test** (se tiver testes unitários)

#### Workflow de Deploy para TestFlight

**Nome**: `Deploy - TestFlight`

**Trigger**:
- Tag: `v*` (ex: v1.0.0)

**Environment**:
- Xcode Version: Latest Release
- macOS Version: Latest

**Actions**:
1. **Archive** - Build do app
2. **TestFlight Internal Testing** - Deploy automático

### 4. Variáveis de Ambiente

No Xcode Cloud, configure as seguintes variáveis:

```bash
# Secrets (Configurar como "Secret")
CI_STRIPE_PUBLIC_KEY=pk_live_REDACTED_STRIPE_PUBLISHABLE
CI_DAILY_API_KEY=<sua_daily_api_key>

# Environment Variables
CI_API_URL=https://www.homologacao.cnvidas.com.br
NODE_ENV=production
```

### 5. Scripts Customizados

Os scripts CI já foram criados em `/ci_scripts/`:

- **`ci_post_clone.sh`** - Configura o ambiente após clone
- **`ci_pre_xcodebuild.sh`** - Instala dependências e builda o web app
- **`ci_post_xcodebuild.sh`** - Ações pós-build

### 6. Configurar Build Settings no Xcode

1. Selecione o target `App`
2. Vá para **Build Settings**
3. Certifique-se de que:
   - **Code Signing Identity**: Automatic
   - **Development Team**: Sua equipe
   - **Provisioning Profile**: Automatic

### 7. Esquema de Build

Se não existir, crie um esquema compartilhado:

1. **Product > Scheme > Manage Schemes**
2. Selecione o esquema `App`
3. Marque **Shared**
4. Configure:
   - **Build**: Archive habilitado
   - **Run**: Release configuration
   - **Archive**: Release configuration

## 🔧 Troubleshooting

### Erro: "No shared schemes"

1. Crie um esquema compartilhado (veja seção 7)
2. Commit o arquivo `.xcscheme` no repositório

### Erro: "Pod not found"

O script `ci_pre_xcodebuild.sh` já instala os pods automaticamente.

### Erro: "Node/npm not found"

Adicione ao `ci_pre_xcodebuild.sh`:

```bash
# Instalar Node.js via Homebrew
if ! command -v node &> /dev/null; then
    brew install node
fi
```

## 📱 Fluxo de Deploy Completo

1. **Desenvolvimento Local**:
   ```bash
   yarn dev  # Desenvolvimento
   yarn build  # Build de produção
   yarn cap:sync  # Sincronizar com iOS
   ```

2. **Push para GitHub**:
   ```bash
   ./push-and-sync.sh  # Script que faz push e sync
   ```

3. **Xcode Cloud** (automático):
   - Build é triggered no push
   - Scripts CI preparam o ambiente
   - App é buildado e arquivado

4. **Deploy para TestFlight**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## 🔑 Certificados e Provisioning

### Configuração Automática (Recomendado)

1. No Xcode Cloud, vá para **Settings > Signing**
2. Selecione **Automatic**
3. Xcode Cloud gerenciará certificados automaticamente

### Configuração Manual

Se precisar configurar manualmente:

1. Gere certificados no Apple Developer Portal
2. Crie Provisioning Profiles para:
   - Development
   - App Store Distribution
3. No Xcode Cloud, faça upload dos certificados

## 📊 Monitoramento

### Notificações

Configure notificações em **Settings > Notifications**:
- Build failures
- TestFlight submissions
- App Store submissions

### Logs

Acesse logs detalhados:
1. App Store Connect > Xcode Cloud
2. Selecione o build
3. Veja logs de cada step

## 🚨 Importante

- **Sempre teste localmente** antes de fazer push
- **Use tags semânticas** para releases (v1.0.0, v1.0.1, etc)
- **Monitore os custos** do Xcode Cloud (25h grátis/mês)
- **Configure branch protection** no GitHub para a `main`

## 📚 Recursos Adicionais

- [Documentação Oficial Xcode Cloud](https://developer.apple.com/xcode-cloud/)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [CI/CD Best Practices](https://developer.apple.com/documentation/xcode/configuring-xcode-cloud)