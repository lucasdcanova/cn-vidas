import os
from PIL import Image, ImageDraw, ImageOps
import math

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_gradient(width, height, angle, stops):
    # Stops is a list of (offset, color_rgb)
    # Angle is in degrees. 165deg.
    # Create a new image for the gradient
    base = Image.new('RGB', (width, height), (0, 0, 0))
    draw = ImageDraw.Draw(base)
    
    # Simple interpolation for each pixel is too slow in python loops.
    # We can create a larger linear gradient and rotate it.
    # Or just use numpy if available, but I can't rely on numpy being installed in the environment unless I check.
    # The environment has standard libraries. PIL is usually available (Pillow).
    # Let's verify Pillow is available first or assume it is (standard in most agent envs).
    
    # Faster approach: Generate a vertical gradient and rotate it?
    # Or just iterate since 1024x1024 is small enough for a one-off script?
    # 1 million pixels. Python loop might take a few seconds. That's acceptable.
    
    # Let's try to do it efficiently.
    # Calculate gradient vector
    angle_rad = math.radians(angle)
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)
    
    # We want to map pixel (x,y) to a position along the gradient line.
    # Project (x,y) onto the vector (cos, sin).
    # d = x * cos(all) + y * sin(all) --- wait, angle is usually from vertical or horizontal?
    # CSS 165deg is clockwise from top (usually).
    # 0deg = top (up), 90deg = right, 180deg = bottom.
    # 165deg is bottom-right-ish.
    
    # Define start and end points of the gradient box to cover rotation
    # Actually, simpler: create a vertical gradient image that is large enough to cover the rotated canvas.
    diag = int(math.sqrt(width**2 + height**2))
    grad_img = Image.new('RGB', (1, diag))
    
    # Draw vertical gradient on 1xDiag image
    # Stops: 0.0 -> #18c2b3, 0.55 -> #0d9488, 1.0 -> #0b6b64
    stops = sorted(stops, key=lambda x: x[0])
    
    pixels = []
    
    for y in range(diag):
        pos = y / diag
        # Find segment
        c1 = stops[0][1]
        c2 = stops[-1][1]
        t = 0
        
        for i in range(len(stops) - 1):
            if stops[i][0] <= pos <= stops[i+1][0]:
                s1 = stops[i]
                s2 = stops[i+1]
                local_t = (pos - s1[0]) / (s2[0] - s1[0])
                c1 = s1[1]
                c2 = s2[1]
                t = local_t
                break
        
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        grad_img.putpixel((0, y), (r, g, b))
        
    grad_img = grad_img.resize((width, diag)) # Stretch to width
    
    # Now rotate/crop? No, linear gradient logic is specific.
    # A linear gradient at 165deg means colors change along the line.
    
    # CSS linear-gradient(165deg, ...)
    # 0deg is Bottom to Top in CSS? No 180deg is Top to Bottom.
    # Let's stick to a simpler approximation or just generate a vertical one and rotate it.
    # A vertical gradient (top to bottom) is 180deg.
    # We want 165deg. That's -15 deg from vertical.
    
    # Create large canvas, draw vertical gradient, rotate by -15 deg, crop center.
    # Canvas size: diag * 2 to be safe.
    
    large_size = diag * 2
    g_img = Image.new('RGB', (large_size, large_size))
    # Fill with vertical gradient (stops)
    # We construct the vertical gradient strip first.
    strip = Image.new('RGB', (large_size, large_size))
    # We construct 1xN strip then resize
    one_strip = Image.new('RGB', (1, large_size))
    for y in range(large_size):
        pos = y / large_size
        # ... logic for color interpolation ...
        # (Copied from above but adjusted for size)
        c1 = stops[0][1]; c2 = stops[-1][1]; t = 0
        for i in range(len(stops) - 1):
            if stops[i][0] <= pos <= stops[i+1][0]:
                 s1, s2 = stops[i], stops[i+1]
                 t = (pos - s1[0]) / (s2[0] - s1[0])
                 c1, c2 = s1[1], s2[1]
                 break
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        one_strip.putpixel((0, y), (r, g, b))
    
    strip = one_strip.resize((large_size, large_size))
    
    # Rotate
    # 180deg = Top->Bottom. We want 165deg. 
    # Difference is 15 degrees counter-clockwise? Or clockwise?
    # 180 is down. 90 is right. 165 is down-right.
    # So we rotate the vertical gradient (which goes down) by 15 deg?
    # Actually, let's just rotate -15 deg (or 345) or 15.
    # Let's try 15 deg.
    rotated = strip.rotate(15, expand=False) # 15 deg
    
    # Crop center 1024x1024
    cx, cy = large_size // 2, large_size // 2
    left = cx - width // 2
    top = cy - height // 2
    return rotated.crop((left, top, left + width, top + height))


def process_icons():
    # Colors
    c1 = hex_to_rgb("#18c2b3")
    c2 = hex_to_rgb("#0d9488")
    c3 = hex_to_rgb("#0b6b64")
    stops = [(0.0, c1), (0.55, c2), (1.0, c3)]
    
    # 1. Create Master Base (Gradient)
    size = 1024
    print("Creating gradient background...")
    background = create_gradient(size, size, 165, stops)
    
    # 2. Open Logo
    logo_path = "/Users/lucascanova/Documents/CN Vidas/CNVidas-updated/public/Logo hospital triunfo quadrado sem fundo.png"
    print(f"Loading logo from {logo_path}")
    logo = Image.open(logo_path).convert("RGBA")
    
    # Resize logo to fit nicely. E.g. 70% of canvas.
    # The logo is rectangular (3659 x 2732). width > height.
    # We want it to fit within 70% of 1024 = ~716px width.
    target_logo_width = int(size * 0.75)
    ratio = target_logo_width / logo.width
    target_logo_height = int(logo.height * ratio)
    
    logo = logo.resize((target_logo_width, target_logo_height), Image.Resampling.LANCZOS)
    
    # Center logo
    offset = ((size - logo.width) // 2, (size - logo.height) // 2)
    
    # Composite
    print("Compositing logo...")
    background.paste(logo, offset, logo)
    
    # Save Master
    master_path = "public/icon-master-teal.png"
    background.save(master_path)
    print(f"Saved master icon to {master_path}")
    
    # 3. Generate Android Icons
    android_res = "android/app/src/main/res"
    if os.path.exists(android_res):
        print("Generating Android icons...")
        densities = {
            "mipmap-mdpi": 48,
            "mipmap-hdpi": 72,
            "mipmap-xhdpi": 96,
            "mipmap-xxhdpi": 144,
            "mipmap-xxxhdpi": 192
        }
        for folder, dim in densities.items():
            path_dir = os.path.join(android_res, folder)
            if not os.path.exists(path_dir):
                os.makedirs(path_dir)
            
            # Square
            icon = background.resize((dim, dim), Image.Resampling.LANCZOS)
            icon.save(os.path.join(path_dir, "ic_launcher.png"))
            
            # Round (Circle)
            # Create mask
            mask = Image.new('L', (dim, dim), 0)
            draw = ImageDraw.Draw(mask)
            draw.ellipse((0, 0, dim, dim), fill=255)
            
            # Apply mask
            round_icon = Image.new('RGBA', (dim, dim), (0,0,0,0))
            round_icon.paste(icon, (0,0), mask=mask) # Paste text onto clear background with mask? 
            # No, paste icon onto clear with mask?
            # Easiest: create composite
            output_round = ImageOps.fit(icon, mask.size, centering=(0.5, 0.5))
            output_round.putalpha(mask)
            
            output_round.save(os.path.join(path_dir, "ic_launcher_round.png"))
            print(f"Saved {folder}")
            
    # 4. Generate iOS Icons
    ios_assets = "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    if os.path.exists(ios_assets):
        print("Generating iOS icons...")
        # Define sizes from Contents.json or standard
        # Standard sizes for file naming from directory listing
        ios_files = {
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
        }
        
        for name, dim in ios_files.items():
            icon = background.resize((dim, dim), Image.Resampling.LANCZOS)
            icon.save(os.path.join(ios_assets, name))
            print(f"Saved {name}")

    # 5. Generate PWA Public Icons (simple subset)
    pwa_sizes = [16, 32, 64, 128, 192, 256, 512]
    for s in pwa_sizes:
        icon = background.resize((s, s), Image.Resampling.LANCZOS)
        icon.save(f"public/icon-{s}x{s}.png")
        if s == 32:
            icon.save("public/favicon-32x32.png")
        if s == 16:
            icon.save("public/favicon-16x16.png")
            
    # Favicon.ico
    background.resize((32,32), Image.Resampling.LANCZOS).save("public/favicon.ico")
    
    print("Done.")

if __name__ == "__main__":
    try:
        process_icons()
    except Exception as e:
        print(f"Error: {e}")
