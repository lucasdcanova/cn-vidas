# Guia de Teste - Console Remoto CNVidas

## 🎯 O que é o Console Remoto?

O Console Remoto permite capturar logs do app iOS em tempo real e visualizá-los no painel administrativo web. É útil para:
- Debug de problemas em produção
- Monitorar erros no TestFlight
- Rastrear comportamento do usuário
- Diagnosticar problemas específicos de dispositivos

## 🚀 Como Ativar

### No App iOS (TestFlight):

1. **Login como Admin**
   - Email: lucas.canova@icloud.com
   - Senha: sua senha

2. **Ativar Console Remoto**
   - Menu → Admin → Ativar Console Remoto
   - Ative o switch
   - Toque em "Enviar Log de Teste"

3. **Recarregar o App**
   - Force o fechamento do app
   - Abra novamente
   - Você verá: "[RemoteConsole] Ativado!"

### No Painel Web:

1. **Acessar Console**
   - https://www.homologacao.cnvidas.com.br (produção)
   - http://localhost:3000 (desenvolvimento)
   - Login como admin

2. **Visualizar Logs**
   - Menu Admin → Console Remoto
   - Selecione a sessão do dispositivo
   - Veja logs em tempo real

## 📝 Tipos de Logs Capturados

### Automáticos:
- **Inicialização**: "[App] Iniciando..."
- **Login/Logout**: Eventos de autenticação
- **Navegação**: Mudanças de tela
- **API Calls**: Requisições HTTP
- **Erros**: Exceções e falhas
- **Performance**: Tempos de carregamento

### Manuais (para teste):
```javascript
console.log('Teste básico');
console.info('Informação importante');
console.warn('Aviso de teste');
console.error('Erro simulado');
```

## 🔍 Filtros Disponíveis

- **Por Nível**: All, Log, Info, Warn, Error
- **Por Sessão**: Cada dispositivo tem ID único
- **Por Texto**: Busca em mensagens
- **Por Tempo**: Logs em tempo real

## 🧪 Cenários de Teste

### 1. **Teste Básico**
- Ative o console remoto
- Navegue pelo app
- Verifique se logs aparecem no web

### 2. **Teste de Erro**
- Tente fazer algo que gera erro (ex: login inválido)
- Verifique se o erro aparece no console

### 3. **Teste de Performance**
- Abra telas pesadas
- Verifique logs de tempo de carregamento

### 4. **Teste Offline**
- Desative internet no dispositivo
- Faça ações no app
- Reconecte e veja se logs são enviados

## 🛠️ Troubleshooting

### Logs não aparecem?

1. **Verifique ativação**:
   - Settings → enableRemoteConsole deve ser "true"
   - Recarregue o app após ativar

2. **Verifique conexão**:
   - App precisa de internet
   - Servidor deve estar rodando

3. **Verifique sessão**:
   - Sessão pode ter expirado
   - Faça logout e login novamente

### Muitos logs?

- Use filtros por nível
- Busque por palavras específicas
- Exporte logs importantes

## 📊 Informações Técnicas

### Dados Capturados:
- **sessionId**: ID único da sessão
- **userId**: ID do usuário (se logado)
- **level**: Nível do log
- **message**: Mensagem do log
- **timestamp**: Hora do log
- **userAgent**: Informações do dispositivo
- **platform**: iOS/Android/Web
- **appVersion**: Versão do app
- **stack**: Stack trace (para erros)
- **metadata**: Dados adicionais

### Limites:
- Buffer: 50 logs
- Flush: A cada 5 segundos
- Retenção: 7 dias

## 🔒 Segurança

- Apenas admins podem ver logs
- Dados sensíveis são filtrados
- Logs expiram automaticamente
- HTTPS em produção

## 💡 Dicas

1. **Para debug específico**:
   - Use console.log com prefixo: `console.log('[Feature] Mensagem')`
   
2. **Para rastrear fluxo**:
   - Adicione logs em pontos chave do código
   
3. **Para performance**:
   - Use `console.time()` e `console.timeEnd()`

4. **Para dados estruturados**:
   - Use `console.info('Dados:', { objeto })`

## 🚨 Importante

- Console remoto impacta levemente a performance
- Desative após debug em produção
- Não logue dados sensíveis (senhas, tokens)
- Use com moderação em produção