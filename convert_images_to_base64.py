import base64
import os

html_file = 'post-beneficio-1-seguro.html'
image1_path = 'public/logo_cn_vidas_transparent.png'
image2_path = 'public/assets/triunfo-logo-white.png'

def image_to_base64(path):
    with open(path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        # Determine mime type based on extension
        if path.endswith('.png'):
            mime = 'image/png'
        elif path.endswith('.jpg') or path.endswith('.jpeg'):
            mime = 'image/jpeg'
        elif path.endswith('.svg'):
            mime = 'image/svg+xml'
        else:
            mime = 'application/octet-stream'
        return f"data:{mime};base64,{encoded_string}"

try:
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Image 1
    if os.path.exists(image1_path):
        print(f"Converting {image1_path}...")
        b64_img1 = image_to_base64(image1_path)
        html_content = html_content.replace('src="public/logo_cn_vidas_transparent.png"', f'src="{b64_img1}"')
    else:
        print(f"Warning: {image1_path} not found")

    # Image 2
    if os.path.exists(image2_path):
        print(f"Converting {image2_path}...")
        b64_img2 = image_to_base64(image2_path)
        html_content = html_content.replace('src="public/assets/triunfo-logo-white.png"', f'src="{b64_img2}"')
    else:
        print(f"Warning: {image2_path} not found")

    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"Successfully updated {html_file} with base64 images.")

except Exception as e:
    print(f"An error occurred: {e}")
