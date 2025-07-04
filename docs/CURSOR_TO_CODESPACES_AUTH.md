# Transferindo Autenticação do Cursor para Codespaces

## Situação Atual
Você está usando Claude Code integrado no Cursor (editor) e quer usar a mesma conta Pro/Max no GitHub Codespaces.

## Soluções

### Opção 1: Instalar Claude CLI Separadamente (Recomendado)

Como o Cursor tem sua própria integração, você precisa instalar o Claude CLI standalone:

1. **No seu Mac local (Terminal)**:
```bash
# Instalar o Claude CLI oficial
brew install claude

# OU via npm
npm install -g claude

# Fazer login com sua conta Pro
claude login
```

2. **Após o login bem-sucedido, encontre o token**:
```bash
# O token geralmente fica em:
cat ~/.config/claude/auth.json
# OU
cat ~/.claude/credentials
```

3. **No Codespaces**, crie o arquivo com o token copiado:
```bash
mkdir -p ~/.config/claude
echo 'COLE_O_JSON_AQUI' > ~/.config/claude/auth.json
```

### Opção 2: Usar Cursor Remote SSH

Configure o Codespaces para aceitar conexões SSH e use o Cursor local:

1. **No Codespaces**:
```bash
# Instalar e configurar SSH
sudo apt-get update && sudo apt-get install -y openssh-server
sudo service ssh start
```

2. **No seu Mac**:
```bash
# Conectar ao Codespace via GitHub CLI
gh codespace ssh

# OU usar Cursor com Remote SSH
# File > Remote Explorer > SSH Targets
```

### Opção 3: Extrair Token do Cursor

O Cursor guarda a autenticação em local específico:

1. **Encontrar token do Cursor**:
```bash
# Possíveis localizações no Mac:
cat ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb
# OU
sqlite3 ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb "SELECT * FROM ItemTable WHERE key LIKE '%claude%';"
```

2. **Procurar por campos como**:
- `claude.authToken`
- `anthropic.token`
- `claude.session`

### Opção 4: GitHub Codespaces com VS Code Web

1. Abra seu Codespace no navegador
2. Instale a extensão "Continue" ou "Codeium" que suportam Claude
3. Configure com sua conta Anthropic

### Script Helper

Crie este script no seu Mac para facilitar:

```bash
#!/bin/bash
# save as: extract-claude-token.sh

echo "🔍 Procurando tokens do Claude/Anthropic..."

# Verificar Claude CLI
if [ -f ~/.config/claude/auth.json ]; then
    echo "✅ Token do Claude CLI encontrado:"
    cat ~/.config/claude/auth.json
    exit 0
fi

# Verificar Cursor database
if [ -f ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb ]; then
    echo "📂 Verificando banco do Cursor..."
    sqlite3 ~/Library/Application\ Support/Cursor/User/globalStorage/state.vscdb \
        "SELECT value FROM ItemTable WHERE key LIKE '%claude%' OR key LIKE '%anthropic%';" 2>/dev/null
fi

# Verificar cookies do navegador (se usar login web)
echo "🌐 Para extrair do navegador:"
echo "1. Abra DevTools (F12)"
echo "2. Vá em Application > Cookies"
echo "3. Procure por cookies do claude.ai"
echo "4. Copie o sessionKey ou authToken"
```

### Workaround Temporário

Enquanto configura a autenticação permanente:

1. **Use o Cursor localmente** para editar
2. **Use o terminal do Codespaces** para rodar comandos
3. **Sincronize via Git** frequentemente

```bash
# No Cursor local
git add . && git commit -m "Update" && git push

# No Codespaces
git pull
```

## Recomendação

Para sua situação específica, recomendo:

1. **Instalar o Claude CLI oficial** no Mac (separado do Cursor)
2. **Fazer login** com sua conta Pro
3. **Copiar o token** para o Codespaces
4. **Usar ambos em paralelo**: Cursor para editar, Codespaces para executar

Isso permite manter sua experiência Pro em ambos ambientes!