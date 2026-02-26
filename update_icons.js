const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generate() {
    console.log("Starting icon generation...");

    const logoPath = 'public/Logo hospital triunfo quadrado sem fundo.png';
    const outputPath = 'public/icon-master-teal.png';
    const size = 1024;

    // 1. Create Background using SVG Gradient
    // 165deg. 0deg is vertical up? CSS 180 is down.
    // 165 is down and slightly right.
    // Let's use x1="0.2" y1="0" x2="0.8" y2="1" roughly.
    // Colors: #18c2b3 0%, #0d9488 55%, #0b6b64 100%
    
    // Note: Sharp SVG support depends on librsvg. Usually standard.
    const svgBackground = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0.2" y1="0" x2="0.8" y2="1">
                <stop offset="0%" stop-color="#18c2b3"/>
                <stop offset="55%" stop-color="#0d9488"/>
                <stop offset="100%" stop-color="#0b6b64"/>
            </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#grad)"/>
    </svg>
    `;

    // 2. Load Logo and Resize
    // We want the logo to be about 70-75% of the icon size
    const logoSize = Math.round(size * 0.75);
    
    const logoBuffer = await sharp(logoPath)
        .resize({
            width: logoSize,
            height: logoSize,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

    // 3. Composite
    const masterBuffer = await sharp(Buffer.from(svgBackground))
        .composite([{ input: logoBuffer, gravity: 'center' }])
        .png()
        .toBuffer();
    
    // Save master
    fs.writeFileSync(outputPath, masterBuffer);
    console.log("Saved master icon.");

    // 4. Android Icons
    // android/app/src/main/res/mipmap-*
    const androidRes = 'android/app/src/main/res';
    if (fs.existsSync(androidRes)) {
        console.log("Generating Android icons...");
        const dens = {
            'mipmap-mdpi': 48,
            'mipmap-hdpi': 72,
            'mipmap-xhdpi': 96,
            'mipmap-xxhdpi': 144,
            'mipmap-xxxhdpi': 192
        };

        for (const [folder, dim] of Object.entries(dens)) {
            const dir = path.join(androidRes, folder);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            // Square
            await sharp(masterBuffer)
                .resize(dim, dim)
                .toFile(path.join(dir, 'ic_launcher.png'));

            // Round
            // Create a circle mask
            const mask = Buffer.from(
                `<svg width="${dim}" height="${dim}"><circle cx="${dim/2}" cy="${dim/2}" r="${dim/2}" fill="white"/></svg>`
            );
            
            await sharp(masterBuffer)
                .resize(dim, dim)
                .composite([{ input: mask, blend: 'dest-in' }])
                .toFile(path.join(dir, 'ic_launcher_round.png'));
            
            console.log(`Saved ${folder}`);
        }
    }

    // 5. iOS Icons
    const iosDir = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';
    if (fs.existsSync(iosDir)) {
        console.log("Generating iOS icons...");
        // Mapping filename to size
        const iosFiles = {
            "AppIcon-20@1x.png": 20,
            "AppIcon-20@2x.png": 40,
            "AppIcon-20@3x.png": 60,
            "AppIcon-29@1x.png": 29,
            "AppIcon-29@2x.png": 58,
            "AppIcon-29@3x.png": 87,
            "AppIcon-40@1x.png": 40,
            "AppIcon-40@2x.png": 80,
            "AppIcon-40@3x.png": 120,
            "AppIcon-60@2x.png": 120,
            "AppIcon-60@3x.png": 180,
            "AppIcon-76x76.png": 76,
            "AppIcon-152x152.png": 152,
            "AppIcon-167x167.png": 167,
            "AppIcon-1024x1024.png": 1024
        };

        for (const [name, dim] of Object.entries(iosFiles)) {
             await sharp(masterBuffer)
                .resize(dim, dim)
                .toFile(path.join(iosDir, name));
             console.log(`Saved ${name}`);
        }
    }

    // 6. Public PWA Icons
    console.log("Generating PWA icons...");
    const pwaSizes = [16, 32, 64, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512];
    for (const s of pwaSizes) {
        await sharp(masterBuffer)
            .resize(s, s)
            .toFile(`public/icon-${s}x${s}.png`);
        
        if (s === 32) await sharp(masterBuffer).resize(32, 32).toFile('public/favicon-32x32.png');
        if (s === 16) await sharp(masterBuffer).resize(16, 16).toFile('public/favicon-16x16.png');
    }
    await sharp(masterBuffer).resize(32, 32).toFile('public/favicon.ico');

    console.log("Done.");
}

generate().catch(err => console.error(err));
