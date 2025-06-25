# Assets do Apple Wallet Pass

## Arquivos necessários

Coloque os seguintes arquivos de imagem nesta pasta:

### Ícones (obrigatórios)
- **icon.png** - 29x29 pixels
- **icon@2x.png** - 58x58 pixels
- **icon@3x.png** - 87x87 pixels (opcional)

### Logos (obrigatórios)
- **logo.png** - 160x50 pixels máximo
- **logo@2x.png** - 320x100 pixels máximo
- **logo@3x.png** - 480x150 pixels máximo (opcional)

### Imagens de fundo (opcionais)
- **background.png** - 180x220 pixels
- **background@2x.png** - 360x440 pixels

### Strip (opcional)
- **strip.png** - 320x123 pixels
- **strip@2x.png** - 640x246 pixels

## Requisitos das imagens

- Formato: PNG
- Cor: RGB (não CMYK)
- Fundo transparente recomendado para ícones e logos
- Use o logo branco do CN Vidas para melhor contraste

## Exemplo de estrutura

```
server/wallet/assets/
├── README.md (este arquivo)
├── icon.png
├── icon@2x.png
├── logo.png
└── logo@2x.png
```

## Gerando os assets

Você pode usar o logo do CN Vidas localizado em:
- `/client/public/cnvidas-logo-white.svg`

Para converter SVG para PNG nas resoluções necessárias, use ferramentas como:
- ImageMagick: `convert -resize 58x58 cnvidas-logo-white.svg icon@2x.png`
- Ferramentas online de conversão SVG para PNG