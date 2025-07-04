# Usando Claude Code com Conta Pro/Max no GitHub Codespaces

## O Problema
O Claude Code usa OAuth que precisa abrir um navegador local, mas o Codespaces roda em um container remoto, causando falha na autenticação.

## Solução: Port Forwarding para OAuth

### Método 1: Autenticação via Port Forward (Recomendado)

1. **No Codespaces, instale o Claude Code**:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **Inicie o Claude Code com configuração especial**:
   ```bash
   # Iniciar com callback URL personalizado
   claude-code auth --callback-url http://localhost:5173/callback
   ```

3. **Quando aparecer o link de autenticação**:
   - NÃO clique diretamente no link
   - Copie o link
   - No Codespaces, vá na aba "PORTS"
   - Adicione a porta 5173 se não estiver lá
   - Clique no ícone de globo para abrir em nova aba
   - Cole o resto da URL de autenticação após o domínio do Codespace

### Método 2: Copiar Token de Autenticação

1. **No seu computador LOCAL (não no Codespaces)**:
   ```bash
   # Instalar Claude Code localmente
   npm install -g @anthropic-ai/claude-code
   
   # Fazer login normal
   claude-code auth
   ```

2. **Após autenticar com sucesso, copie o token**:
   ```bash
   # No seu computador local
   cat ~/.claude-code/auth.json
   ```
   
   Você verá algo como:
   ```json
   {
     "token": "seu-token-aqui",
     "refresh_token": "seu-refresh-token",
     "expires_at": "2024-01-01T00:00:00.000Z"
   }
   ```

3. **No Codespaces, crie o arquivo de configuração**:
   ```bash
   # Criar diretório
   mkdir -p ~/.claude-code
   
   # Criar arquivo auth.json
   cat > ~/.claude-code/auth.json << 'EOF'
   {
     "token": "cole-seu-token-aqui",
     "refresh_token": "cole-seu-refresh-token",
     "expires_at": "cole-a-data-de-expiracao"
   }
   EOF
   
   # Dar permissões corretas
   chmod 600 ~/.claude-code/auth.json
   ```

4. **Testar**:
   ```bash
   claude-code
   ```

### Método 3: SSH Tunnel (Avançado)

1. **No Codespaces, inicie o servidor de callback**:
   ```bash
   # Criar um servidor HTTP simples para capturar o callback
   npx http-server -p 5173 &
   ```

2. **No seu computador local, crie um túnel SSH**:
   ```bash
   # Obter o nome do seu Codespace
   gh codespace list
   
   # Criar túnel SSH
   gh codespace ssh -- -L 5173:localhost:5173
   ```

3. **Agora faça a autenticação**:
   ```bash
   # No Codespaces
   claude-code auth --callback-url http://localhost:5173/callback
   ```

### Método 4: Usar GitHub CLI para Port Forward

1. **No seu computador local**:
   ```bash
   # Listar seus codespaces
   gh codespace list
   
   # Port forward do seu codespace
   gh codespace ports forward 5173:5173 -c nome-do-seu-codespace
   ```

2. **No Codespaces**:
   ```bash
   claude-code auth
   ```

## Script Automatizado

Crie um arquivo `setup-claude-pro.sh`:

```bash
#!/bin/bash

echo "🔧 Configurando Claude Code Pro no Codespaces..."

# Instalar Claude Code
npm install -g @anthropic-ai/claude-code

# Verificar se já está autenticado
if [ -f ~/.claude-code/auth.json ]; then
    echo "✅ Já autenticado!"
    claude-code
    exit 0
fi

echo "📋 Instruções para autenticar:"
echo "1. No seu computador LOCAL, execute:"
echo "   npm install -g @anthropic-ai/claude-code"
echo "   claude-code auth"
echo ""
echo "2. Após autenticar, copie o conteúdo de:"
echo "   cat ~/.claude-code/auth.json"
echo ""
echo "3. Cole o conteúdo aqui (Ctrl+D quando terminar):"

# Ler o JSON
mkdir -p ~/.claude-code
cat > ~/.claude-code/auth.json
chmod 600 ~/.claude-code/auth.json

echo "✅ Configuração concluída! Testando..."
claude-code --version

echo "🚀 Use 'claude-code' para iniciar!"
```

## Alternativa: VS Code Desktop com Remote Codespaces

1. **Use VS Code no seu desktop**:
   - Instale a extensão "GitHub Codespaces"
   - Conecte ao seu Codespace remotamente
   - Use o Claude Code localmente enquanto edita no Codespace

2. **Comando para conectar**:
   ```bash
   # No VS Code local
   # Cmd/Ctrl + Shift + P
   # "Codespaces: Connect to Codespace"
   ```

## Dica Pro: Sincronização Automática

Adicione ao seu `.bashrc` no Codespaces:

```bash
# Auto-sync Claude auth
if [ -f ~/claude-auth-backup.json ] && [ ! -f ~/.claude-code/auth.json ]; then
    mkdir -p ~/.claude-code
    cp ~/claude-auth-backup.json ~/.claude-code/auth.json
    chmod 600 ~/.claude-code/auth.json
    echo "✅ Claude Code Pro restaurado!"
fi
```

## Troubleshooting

### "OAuth callback failed"
- Verifique se a porta está forwarded corretamente
- Use `http://localhost:5173` ao invés de `https://`

### "Token expired"
- Refaça o processo de autenticação
- Tokens geralmente duram 30 dias

### "Permission denied"
```bash
chmod 600 ~/.claude-code/auth.json
```

## Recomendação Final

Para melhor experiência com Claude Pro no Codespaces:

1. **Faça auth local primeiro** e copie o token
2. **Use VS Code Desktop** com Remote Codespaces
3. **Configure o token** uma vez e ele durará ~30 dias
4. **Salve o token** em um local seguro para reusar

Isso permite usar seu plano Pro/Max sem depender de API keys!