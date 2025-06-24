const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Tamanhos necessários para PWA
const sizes = [
  16, 32, 72, 96, 128, 144, 152, 167, 180, 192, 384, 512
];

// Tamanhos específicos para iOS splash screens
const splashSizes = [
  { width: 640, height: 1136, name: 'splash-640x1136.png' },
  { width: 750, height: 1334, name: 'splash-750x1334.png' },
  { width: 1242, height: 2208, name: 'splash-1242x2208.png' },
  { width: 1125, height: 2436, name: 'splash-1125x2436.png' }
];

async function generateIcons() {
  const inputPath = './attached_assets/CNVIDAS_transparent.png';
  const outputDir = './public';
  
  try {
    // Criar diretório se não existir
    await fs.mkdir(outputDir, { recursive: true });
    
    // Gerar ícones quadrados
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Gerado: icon-${size}x${size}.png`);
      
      // Criar favicons específicos
      if (size === 32) {
        await sharp(inputPath)
          .resize(32, 32, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png()
          .toFile(path.join(outputDir, 'favicon-32x32.png'));
        console.log('✓ Gerado: favicon-32x32.png');
      }
      
      if (size === 16) {
        await sharp(inputPath)
          .resize(16, 16, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png()
          .toFile(path.join(outputDir, 'favicon-16x16.png'));
        console.log('✓ Gerado: favicon-16x16.png');
      }
    }
    
    // Gerar favicon.ico
    await sharp(inputPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFile(path.join(outputDir, 'favicon.ico'));
    console.log('✓ Gerado: favicon.ico');
    
    // Gerar splash screens para iOS
    for (const splash of splashSizes) {
      const outputPath = path.join(outputDir, splash.name);
      
      // Criar um canvas branco com o logo centralizado
      const logoSize = Math.min(splash.width, splash.height) * 0.3;
      
      await sharp({
        create: {
          width: splash.width,
          height: splash.height,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .composite([{
        input: await sharp(inputPath)
          .resize(Math.round(logoSize), Math.round(logoSize), {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .toBuffer(),
        gravity: 'center'
      }])
      .png()
      .toFile(outputPath);
      
      console.log(`✓ Gerado: ${splash.name}`);
    }
    
    // Criar página offline
    const offlineHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CN Vidas - Offline</title>
    <style>
        body {
            font-family: -apple-system, system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #f3f4f6;
            text-align: center;
        }
        .container {
            max-width: 400px;
            padding: 2rem;
        }
        .logo {
            width: 120px;
            margin-bottom: 2rem;
        }
        h1 {
            color: #1f2937;
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        p {
            color: #6b7280;
            line-height: 1.6;
        }
        .retry-btn {
            margin-top: 2rem;
            padding: 0.75rem 1.5rem;
            background: #0ea5e9;
            color: white;
            border: none;
            border-radius: 0.375rem;
            font-size: 1rem;
            cursor: pointer;
        }
        .retry-btn:hover {
            background: #0284c7;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="/icon-192x192.png" alt="CN Vidas" class="logo">
        <h1>Você está offline</h1>
        <p>Parece que você está sem conexão com a internet. Verifique sua conexão e tente novamente.</p>
        <button class="retry-btn" onclick="window.location.reload()">Tentar Novamente</button>
    </div>
</body>
</html>`;
    
    await fs.writeFile(path.join(outputDir, 'offline.html'), offlineHtml);
    console.log('✓ Gerado: offline.html');
    
    console.log('\n✅ Todos os ícones foram gerados com sucesso!');
    
  } catch (error) {
    console.error('Erro ao gerar ícones:', error);
  }
}

// Verificar se sharp está instalado
try {
  require.resolve('sharp');
  generateIcons();
} catch (e) {
  console.log('⚠️  Sharp não está instalado. Instalando...');
  const { execSync } = require('child_process');
  execSync('npm install sharp', { stdio: 'inherit' });
  console.log('✓ Sharp instalado. Executando geração de ícones...');
  generateIcons();
}