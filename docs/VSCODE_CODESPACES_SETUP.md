# Configurando VS Code com GitHub Codespaces - Passo a Passo

## 1. Verificar Pré-requisitos

✅ VS Code instalado
✅ Extensão GitHub Codespaces instalada
- GitHub CLI (opcional mas recomendado)

Se não tem o GitHub CLI:
```bash
brew install gh
gh auth login
```

## 2. Conectar ao Codespace

### Método 1: Pela Paleta de Comandos (Recomendado)

1. **Abra o VS Code**

2. **Abra a Paleta de Comandos**
   - Mac: `Cmd + Shift + P`
   - Windows/Linux: `Ctrl + Shift + P`

3. **Digite e selecione**:
   ```
   Codespaces: Connect to Codespace
   ```

4. **Escolha seu Codespace**
   - Vai aparecer uma lista dos seus Codespaces
   - Procure por: `CNVidas-updated`
   - Clique para conectar

### Método 2: Pela Barra Lateral

1. **Clique no ícone do Remote Explorer**
   - Fica na barra lateral esquerda (ícone de monitor com seta)

2. **Selecione "GitHub Codespaces"** no dropdown

3. **Clique com botão direito** no seu Codespace

4. **Selecione** "Connect to Codespace"

### Método 3: Via GitHub CLI

1. **No terminal do VS Code**:
   ```bash
   # Listar seus codespaces
   gh codespace list
   
   # Conectar ao codespace
   gh codespace code -c NOME-DO-SEU-CODESPACE
   ```

## 3. Após Conectar

Quando conectado, você verá:
- No canto inferior esquerdo: `Codespace: CNVidas-updated`
- Terminal integrado rodando no Codespace
- Todos os arquivos do projeto

## 4. Configurar Continue para Claude

1. **Instale a extensão Continue**:
   - Abra Extensions (`Cmd+Shift+X`)
   - Busque: "Continue"
   - Instale a extensão da Continue.dev

2. **Configure o Continue**:
   - Clique no ícone do Continue na barra lateral
   - Clique em "Configure"
   - Selecione "Add Model"
   - Escolha "Claude 3.5 Sonnet"

3. **Faça login com sua conta Anthropic**:
   - O Continue vai pedir para autenticar
   - Use sua conta Claude Pro

## 5. Comandos Úteis no Codespace

```bash
# Verificar se está no Codespace
echo $CODESPACES

# Instalar dependências
npm install

# Rodar o projeto
npm run dev

# Ver logs
tail -f server.log
```

## 6. Dicas de Produtividade

### Atalhos Importantes
- `Cmd+Shift+P`: Paleta de comandos
- `Cmd+P`: Buscar arquivos
- `Cmd+Shift+E`: Explorer
- `Cmd+J`: Toggle terminal

### Sincronização de Settings
O VS Code pode sincronizar suas configurações:
1. `Cmd+Shift+P` > "Settings Sync: Turn On"
2. Faça login com GitHub
3. Suas extensões e configs serão sincronizadas

### Port Forwarding
Quando rodar o servidor:
1. Vá na aba "PORTS" no terminal
2. O VS Code detecta automaticamente portas abertas
3. Clique no globo para abrir no navegador

## 7. Troubleshooting

### "Connection refused"
```bash
# Reiniciar o Codespace
gh codespace restart -c NOME-DO-CODESPACE
```

### "Codespace not found"
```bash
# Verificar se está logado
gh auth status

# Re-autenticar se necessário
gh auth login
```

### Performance lenta
- Aumente os recursos do Codespace em github.com
- Settings > Codespaces > Machine type

## 8. Workflow Recomendado

1. **Edite no VS Code** conectado ao Codespace
2. **Use Continue/Claude** para assistência de código
3. **Terminal integrado** para comandos
4. **Preview no navegador** via port forwarding
5. **Commit/Push** direto do VS Code

## 9. Extensões Recomendadas

Instale estas extensões no VS Code local:
```bash
code --install-extension Continue.continue
code --install-extension GitHub.copilot
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension Prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
```

## 10. Próximos Passos

1. ✅ Conectar ao Codespace
2. ✅ Instalar Continue
3. ✅ Configurar Claude no Continue
4. ✅ Rodar `npm install` no terminal
5. ✅ Iniciar servidor com `npm run dev`
6. ✅ Começar a desenvolver!

---

💡 **Dica**: Salve este documento nos favoritos para referência rápida!