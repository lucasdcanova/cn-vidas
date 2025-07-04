# Solução Alternativa: Claude no Codespaces sem API Key

Como o Claude Code está integrado ao Cursor e não expõe facilmente o token de autenticação, aqui estão as melhores alternativas:

## Opção 1: Continue com Codespaces + Extensão (Recomendado)

Use o Codespaces com uma extensão que suporte Claude:

1. **No Codespaces (navegador ou VS Code)**:
   - Instale a extensão "Continue" (suporta Claude)
   - Ou "Codeium" (tem funcionalidades similares)

2. **Configure o Continue com Claude**:
   ```json
   // .continue/config.json
   {
     "models": [
       {
         "title": "Claude 3.5 Sonnet",
         "provider": "anthropic",
         "model": "claude-3-5-sonnet-20241022",
         "apiKey": "seu-session-key-aqui"
       }
     ]
   }
   ```

## Opção 2: VS Code Desktop + Remote Codespaces

Esta é a melhor opção para manter sua experiência atual:

1. **No VS Code Desktop (não Cursor)**:
   ```bash
   # Instalar extensões
   code --install-extension GitHub.codespaces
   code --install-extension Continue.continue
   ```

2. **Conectar ao Codespace**:
   - Cmd/Ctrl + Shift + P
   - "Codespaces: Connect to Codespace"
   - Escolha seu codespace

3. **Usar Continue/Claude no VS Code local** enquanto edita arquivos no Codespace remoto

## Opção 3: Proxy Local para Codespaces

Crie um proxy local que redireciona requisições do Codespaces para seu Claude local:

1. **No seu Mac, crie o proxy**:
   ```bash
   # proxy-claude.js
   const express = require('express');
   const { exec } = require('child_process');
   const app = express();
   
   app.use(express.json());
   
   app.post('/claude', (req, res) => {
     const { prompt } = req.body;
     exec(`claude "${prompt}"`, (error, stdout, stderr) => {
       if (error) {
         res.status(500).json({ error: stderr });
         return;
       }
       res.json({ response: stdout });
     });
   });
   
   app.listen(3333, () => {
     console.log('Claude proxy running on port 3333');
   });
   ```

2. **Execute o proxy**:
   ```bash
   node proxy-claude.js
   ```

3. **No Codespaces, use ngrok ou similar**:
   ```bash
   ngrok http 3333
   ```

## Opção 4: Extrair Session do Navegador

Se você usa o Claude.ai no navegador:

1. **Abra claude.ai no navegador**
2. **F12 > Application > Cookies**
3. **Procure por**:
   - `sessionKey`
   - `__session`
   - `auth_token`

4. **Use em requisições HTTP**:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "Cookie: sessionKey=SEU_SESSION_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "claude-3-5-sonnet-20241022",
       "messages": [{"role": "user", "content": "Hello!"}]
     }'
   ```

## Opção 5: GitHub Copilot como Alternativa

Já que você tem acesso ao Codespaces, provavelmente tem GitHub Copilot:

1. **No Codespaces**:
   - Copilot já vem pré-instalado
   - Use Ctrl+I para chat inline
   - Copilot Chat na barra lateral

## Script Helper para Encontrar Tokens

```bash
#!/bin/bash
# find-claude-tokens.sh

echo "🔍 Procurando possíveis tokens do Claude..."

# Verificar processos
ps aux | grep -i claude | grep -v grep

# Verificar variáveis de ambiente
env | grep -i claude

# Procurar em arquivos de configuração comuns
find ~ -maxdepth 3 -name "*claude*" -type f 2>/dev/null | while read file; do
    echo "📄 Arquivo: $file"
    grep -i "token\|key\|auth" "$file" 2>/dev/null | head -5
done

# Verificar localStorage do Cursor
CURSOR_STORAGE=~/Library/Application\ Support/Cursor
if [ -d "$CURSOR_STORAGE" ]; then
    echo "📦 Verificando storage do Cursor..."
    find "$CURSOR_STORAGE" -name "*.json" -exec grep -l "anthropic\|claude" {} \; 2>/dev/null
fi
```

## Recomendação Final

Para sua situação específica:

1. **Continue usando Cursor localmente** para desenvolvimento com Claude
2. **Use Codespaces para execução** e testes
3. **Sincronize via Git** frequentemente
4. **Ou migre para VS Code** com Continue extension + Codespaces

O Cursor protege a autenticação do Claude de forma que não é facilmente transferível, então essas são as melhores alternativas sem usar API key.