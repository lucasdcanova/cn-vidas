const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Criar diretório de saída se não existir
const outputDir = './ios-assets';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Logo original
const logoPath = './public/assets/cnvidas-logo.png';

// Função para criar ícone quadrado com padding
async function createAppIcon() {
  console.log('Criando ícone do app...');
  
  // Criar ícone 1024x1024 com fundo branco
  await sharp(logoPath)
    .resize(800, 320, { 
      fit: 'inside',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .extend({
      top: 352,
      bottom: 352,
      left: 112,
      right: 112,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .toFile(path.join(outputDir, 'AppIcon-1024x1024.png'));
    
  console.log('✅ Ícone 1024x1024 criado');
}

// Função para criar splash screen
async function createSplashScreen() {
  console.log('Criando splash screen...');
  
  // Criar splash 2732x2732 com logo centralizado
  await sharp(logoPath)
    .resize(1600, 640, { 
      fit: 'inside',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .extend({
      top: 1046,
      bottom: 1046,
      left: 566,
      right: 566,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .toFile(path.join(outputDir, 'Splash-2732x2732.png'));
    
  console.log('✅ Splash screen 2732x2732 criada');
}

// Função para criar todos os tamanhos de ícones necessários
async function createAllIconSizes() {
  console.log('Criando todos os tamanhos de ícones...');
  
  const sizes = [
    20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180
  ];
  
  for (const size of sizes) {
    await sharp(path.join(outputDir, 'AppIcon-1024x1024.png'))
      .resize(size, size)
      .toFile(path.join(outputDir, `AppIcon-${size}x${size}.png`));
  }
  
  console.log('✅ Todos os tamanhos de ícones criados');
}

// Executar
async function main() {
  try {
    console.log('🚀 Gerando assets para iOS...\n');
    
    await createAppIcon();
    await createSplashScreen();
    await createAllIconSizes();
    
    console.log('\n✅ Todos os assets foram gerados com sucesso!');
    console.log(`📁 Assets salvos em: ${path.resolve(outputDir)}`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar assets:', error);
  }
}

main();