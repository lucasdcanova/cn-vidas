# Guia para Criar Assets do Apple Wallet

## Assets Necessários

O Apple Wallet requer imagens PNG específicas:

### 1. Ícones (aparecem na lista de passes)
- **icon.png**: 29x29 pixels
- **icon@2x.png**: 58x58 pixels
- **icon@3x.png**: 87x87 pixels (opcional)

### 2. Logos (aparecem no topo do pass)
- **logo.png**: 160x50 pixels (máximo)
- **logo@2x.png**: 320x100 pixels (máximo)
- **logo@3x.png**: 480x150 pixels (opcional)

## Como Criar os Assets

### Opção 1: Ferramentas Online
1. Acesse uma ferramenta de conversão SVG para PNG:
   - https://cloudconvert.com/svg-to-png
   - https://convertio.co/pt/svg-png/
   - https://svgtopng.com/

2. Faça upload do logo: `client/public/cnvidas-logo-white.svg`

3. Crie as versões necessárias:
   - Para ícones: exporte em 58x58 e 29x29
   - Para logos: exporte em 320x100 e 160x50

### Opção 2: Canva (Gratuito)
1. Acesse https://www.canva.com
2. Crie designs customizados nos tamanhos:
   - 58x58 para icon@2x.png
   - 320x100 para logo@2x.png
3. Use fundo transparente
4. Importe o logo CNVidas
5. Exporte como PNG

### Opção 3: Apps iOS
- **Prepo**: App gratuito que redimensiona imagens para todos os tamanhos iOS
- **Icon Set Creator**: Cria automaticamente todos os tamanhos necessários

## Cores Recomendadas
- Use o logo branco sobre fundo transparente
- O fundo colorido será aplicado dinamicamente baseado no plano

## Onde Colocar os Arquivos
Após criar, coloque em: `/server/wallet/assets/`

```
server/wallet/assets/
├── icon.png (29x29)
├── icon@2x.png (58x58)
├── logo.png (160x50)
└── logo@2x.png (320x100)
```

## Dica para iPad
No iPad, você pode usar:
1. **Keynote** ou **Pages** para criar os PNGs
2. Definir o tamanho do slide/página
3. Inserir o logo
4. Exportar como imagem

## Verificação
O pass funcionará mesmo sem os assets, mas ficará sem logo. É recomendado adicionar pelo menos:
- icon@2x.png
- logo@2x.png