# 🧪 Teste Manual de Upload de Foto

## Passo 1: Abrir o teste no navegador

1. **No Desktop (Chrome/Safari):**
   ```bash
   open test-upload-browser.html
   ```

2. **No iOS Simulator:**
   - Abra o Safari no iOS Simulator
   - Digite: `file:///Users/lucascanova/CN Vidas - dev/CNVidas - 1.0 WEB/CNVidas-updated/test-upload-browser.html`

## Passo 2: Fazer login

1. Verifique se o email está correto: `lucas.canova@hotmail.com`
2. Digite sua senha atual (a senha no script pode estar desatualizada)
3. Clique em "Fazer Login"

## Passo 3: Testar upload

1. Após o login bem-sucedido, selecione uma imagem
2. Clique em "Fazer Upload"
3. Observe os logs para ver se há erros

## Passo 4: Verificar resultado

1. Clique em "Verificar Perfil"
2. A imagem deve aparecer se o upload foi bem-sucedido

## 📊 Checklist de Verificação

### Na Web (Desktop):
- [ ] Login funciona?
- [ ] Seleção de arquivo funciona?
- [ ] Upload retorna sucesso (200)?
- [ ] URL da imagem é retornada?
- [ ] Imagem aparece no perfil?

### No iOS (Simulator ou Device):
- [ ] Login funciona?
- [ ] Câmera/Galeria abre corretamente?
- [ ] Upload usa fetch nativo (verificar logs)?
- [ ] Upload retorna sucesso (200)?
- [ ] Imagem aparece no perfil?

## 🔍 Logs Importantes para Verificar

No console do navegador (F12), procure por:

1. **Detecção de FormData:**
   ```
   [httpRequestInternal] Tipo de dados: {isFormData: true, ...}
   ```

2. **Uso de fetch nativo:**
   ```
   [Web Fetch] Usando fetch normal para: /api/upload-image
   ```

3. **Endpoint correto:**
   ```
   POST https://www.homologacao.cnvidas.com.br/api/upload-image
   ```
   (Não deve ser `/api/profile/upload-image`)

4. **Resposta do servidor:**
   - Status: 200 = sucesso
   - Status: 404 = rota não encontrada
   - Status: 401 = não autenticado
   - Status: 500 = erro no servidor

## 🚨 Problemas Comuns e Soluções

### Erro 404:
- **Causa:** Ainda está usando a rota antiga
- **Solução:** Limpar cache (Cmd+Shift+R) e recarregar

### Erro 401:
- **Causa:** Token expirou ou senha incorreta
- **Solução:** Fazer login novamente com a senha correta

### Upload não funciona no iOS:
- **Causa:** FormData não sendo detectado
- **Solução:** Verificar se os logs mostram "isFormData: true"

### Imagem não aparece:
- **Causa:** S3 pode estar com problema
- **Solução:** Verificar logs do servidor no Render

## 📱 Teste Rápido via cURL

Se você souber sua senha atual, pode testar rapidamente:

```bash
# 1. Fazer login e salvar token
TOKEN=$(curl -s -X POST "https://www.homologacao.cnvidas.com.br/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"lucas.canova@hotmail.com","password":"SUA_SENHA_AQUI"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Verificar se pegou o token
echo "Token: $TOKEN"

# 3. Fazer upload (precisa ter um arquivo test.jpg)
curl -X POST "https://www.homologacao.cnvidas.com.br/api/upload-image" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Auth-Token: $TOKEN" \
  -F "profileImage=@test.jpg" \
  -v
```