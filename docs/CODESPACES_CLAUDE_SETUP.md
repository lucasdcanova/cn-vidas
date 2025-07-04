# Configurando Claude Code no GitHub Codespaces

## Problema
O Claude Code usa autenticação OAuth que pode não funcionar diretamente no terminal do Codespaces devido a limitações de redirecionamento de URLs.

## Soluções

### Opção 1: Usar API Key (Recomendado)

1. **Obter sua API Key da Anthropic**
   - Acesse: https://console.anthropic.com/
   - Vá em API Keys
   - Crie ou copie uma chave existente

2. **No Codespaces, configure a API Key**
   ```bash
   # Instalar Claude Code globalmente
   npm install -g @anthropic-ai/claude-code
   
   # Configurar a API key como variável de ambiente
   export ANTHROPIC_API_KEY="sua-api-key-aqui"
   
   # Adicionar ao .bashrc para persistir
   echo 'export ANTHROPIC_API_KEY="sua-api-key-aqui"' >> ~/.bashrc
   
   # Recarregar o bashrc
   source ~/.bashrc
   ```

3. **Usar Claude Code com a API Key**
   ```bash
   # Iniciar Claude Code
   claude-code --api-key $ANTHROPIC_API_KEY
   ```

### Opção 2: Configurar Secrets do Codespaces

1. **Adicionar Secret no GitHub**
   - Vá em: Settings do seu repositório
   - Secrets and variables > Codespaces
   - New repository secret
   - Nome: `ANTHROPIC_API_KEY`
   - Valor: sua API key

2. **Reiniciar o Codespace**
   - O secret estará disponível como variável de ambiente

3. **Usar Claude Code**
   ```bash
   claude-code --api-key $ANTHROPIC_API_KEY
   ```

### Opção 3: Usar Extensão do VS Code (Se disponível)

1. **No Codespaces VS Code**
   - Abra a paleta de comandos (Cmd/Ctrl + Shift + P)
   - Digite: "Extensions: Install Extensions"
   - Procure por "Claude" ou "Anthropic"
   - Instale a extensão oficial se disponível

### Opção 4: Túnel SSH (Avançado)

Se você precisar usar OAuth:

1. **No seu computador local**
   ```bash
   # Fazer autenticação local primeiro
   claude-code auth
   
   # Copiar o token de autenticação
   cat ~/.claude/config.json
   ```

2. **No Codespaces**
   ```bash
   # Criar diretório de configuração
   mkdir -p ~/.claude
   
   # Criar arquivo de configuração com o token
   echo '{
     "token": "seu-token-aqui",
     "apiKey": "sua-api-key-opcional"
   }' > ~/.claude/config.json
   
   # Dar permissões corretas
   chmod 600 ~/.claude/config.json
   ```

## Script de Configuração Automática

Crie um arquivo `.devcontainer/setup-claude.sh`:

```bash
#!/bin/bash

# Instalar Claude Code
npm install -g @anthropic-ai/claude-code

# Verificar se API key existe
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  ANTHROPIC_API_KEY não encontrada!"
    echo "Configure em: Settings > Secrets > Codespaces"
    exit 1
fi

# Criar alias para facilitar
echo 'alias claude="claude-code --api-key $ANTHROPIC_API_KEY"' >> ~/.bashrc

echo "✅ Claude Code configurado! Use 'claude' para iniciar."
```

## Alternativas

### 1. Continue usando localmente
- Mantenha o Cursor/VS Code local para edição com Claude
- Use Codespaces para outras tarefas

### 2. Use a API diretamente
```javascript
// exemplo-claude-api.js
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function askClaude(prompt) {
  const message = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });
  
  console.log(message.content);
}

askClaude('Como configurar PostgreSQL no Docker?');
```

### 3. Use GitHub Copilot
- Já integrado nativamente no Codespaces
- Ative em Settings > GitHub Copilot

## Troubleshooting

### Erro: "OAuth redirect failed"
- Use API Key ao invés de OAuth
- Verifique se está usando HTTPS no Codespace

### Erro: "Command not found"
```bash
# Verificar se está instalado
npm list -g @anthropic-ai/claude-code

# Reinstalar se necessário
npm uninstall -g @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code
```

### Erro: "Invalid API Key"
- Verifique se copiou a key completa
- Confirme que a key tem permissões corretas
- Teste a key: `curl -H "x-api-key: $ANTHROPIC_API_KEY" https://api.anthropic.com/v1/messages`

## Configuração do .devcontainer.json

Adicione ao seu `.devcontainer/devcontainer.json`:

```json
{
  "name": "CNVidas Dev Container",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:20",
  
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "Prisma.prisma"
      ]
    }
  },
  
  "postCreateCommand": "npm install && npm install -g @anthropic-ai/claude-code",
  
  "secrets": {
    "ANTHROPIC_API_KEY": {
      "description": "API Key for Claude AI"
    }
  }
}
```

## Recomendação

Para o melhor fluxo de trabalho com CNVidas:

1. **Use API Key** - Mais simples e confiável
2. **Configure como Secret do Codespaces** - Seguro e persistente
3. **Crie aliases** - Para comandos mais rápidos
4. **Mantenha backup local** - Continue podendo usar Cursor quando necessário

## Links Úteis

- [Anthropic Console](https://console.anthropic.com/)
- [Claude Code Docs](https://docs.anthropic.com/claude-code)
- [GitHub Codespaces Secrets](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-encrypted-secrets-for-your-codespaces)