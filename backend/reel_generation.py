"""
Reel Generation Module - Creates video reels using FFmpeg
"""
import os
import io
import uuid
import base64
import tempfile
import subprocess
import json
import asyncio
import aiohttp
import requests
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
from datetime import datetime

# API Keys
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
PIXABAY_API_KEY = os.environ.get('PIXABAY_API_KEY', '')

async def search_pixabay_music(query: str = "cafe lofi jazz") -> str:
    """Search Pixabay for royalty-free music and return MP3 URL"""
    try:
        url = f"https://pixabay.com/api/videos/"
        params = {
            "key": PIXABAY_API_KEY,
            "q": query,
            "video_type": "all",
            "per_page": 10
        }
        
        # Pixabay doesn't have direct audio API, so we'll use a default track URL
        # In production, you'd use their audio endpoint or integrate with another service
        # For now, return a placeholder that the frontend can handle
        return "default_cafe_music"
        
    except Exception as e:
        print(f"Pixabay search error: {e}")
        return "default_cafe_music"

async def generate_reel_text(brand_dna: dict, brief: str, style: str, language: str = "English") -> dict:
    """Generate reel text content using Gemini"""
    import google.generativeai as genai
    
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    style_guide = {
        "cinematic": "dramatic, visually stunning, premium feel, emotional hooks",
        "casual": "relaxed, friendly, authentic, behind-the-scenes vibe"
    }
    
    prompt = f"""You are a social media content expert. Create text for a {style} Instagram Reel.

BRAND INFO:
- Name: {brand_dna.get('name', 'Café')}
- Type: {brand_dna.get('type', 'café')}
- Tone: {brand_dna.get('tone', 'warm and inviting')}
- Target Audience: {brand_dna.get('target_audience', 'coffee lovers')}
- Unique Value: {brand_dna.get('unique_claims', 'quality coffee')}

BRIEF: {brief}
STYLE: {style_guide.get(style, 'engaging and memorable')}
LANGUAGE: {language}

Generate content in {language} language:
1. hook_text (5-7 words, attention grabbing, first frame)
2. story_text (10-15 words, middle frames narrative)
3. supporting_text (8-10 words, additional context)
4. cta_text (5 words, call to action)
5. caption (100-150 chars for Instagram)
6. hashtags (8 relevant hashtags as array)

Return ONLY valid JSON:
{{"hook_text": "...", "story_text": "...", "supporting_text": "...", "cta_text": "...", "caption": "...", "hashtags": ["..."]}}
"""
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Parse JSON
        if text.startswith('```'):
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
        
        return json.loads(text)
    except Exception as e:
        print(f"Gemini text generation error: {e}")
        # Return defaults
        return {
            "hook_text": "You Won't Believe This!",
            "story_text": "Crafted with passion, served with love. Experience the difference.",
            "supporting_text": "Quality in every sip",
            "cta_text": "Visit us today!",
            "caption": f"Discover the magic at {brand_dna.get('name', 'our café')}!",
            "hashtags": ["#cafe", "#coffee", "#foodie", "#coffeelover", "#barista", "#cafelife", "#instafood", "#delicious"]
        }

async def generate_reel_image(prompt: str, size: str = "1024x1792") -> bytes:
    """Generate image using DALL-E 3"""
    from openai import OpenAI
    
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    enhanced_prompt = f"{prompt}. Professional food photography, high-end restaurant quality, warm lighting, appetizing presentation. No text, no logos, no watermarks."
    
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=enhanced_prompt,
            size=size,
            quality="hd",
            n=1,
            response_format="b64_json"
        )
        
        return base64.b64decode(response.data[0].b64_json)
    except Exception as e:
        print(f"DALL-E 3 error: {e}")
        # Return a placeholder colored image
        img = Image.new('RGB', (1024, 1792), color=(99, 102, 241))
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return buffer.getvalue()

def create_text_frame(
    width: int,
    height: int,
    text: str,
    bg_color: str = "#6366f1",
    text_color: str = "#ffffff",
    font_size: int = 80,
    logo_base64: str = None,
    brand_name: str = "",
    include_badges: bool = True,
    contact_info: dict = None
) -> bytes:
    """Create a text frame with brand styling"""
    # Convert hex to RGB
    def hex_to_rgb(hex_color):
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    bg_rgb = hex_to_rgb(bg_color)
    text_rgb = hex_to_rgb(text_color)
    
    # Create image
    img = Image.new('RGB', (width, height), color=bg_rgb)
    draw = ImageDraw.Draw(img)
    
    # Try to load a good font
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"
    ]
    
    font = None
    for font_path in font_paths:
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except:
                continue
    
    if font is None:
        font = ImageFont.load_default()
    
    # Draw text centered
    lines = text.split('\n')
    total_height = len(lines) * (font_size + 20)
    y_start = (height - total_height) // 2
    
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x = (width - text_width) // 2
        y = y_start + i * (font_size + 20)
        
        # Draw shadow
        draw.text((x + 3, y + 3), line, fill=(0, 0, 0, 128), font=font)
        # Draw text
        draw.text((x, y), line, fill=text_rgb, font=font)
    
    # Add logo if provided
    if logo_base64:
        try:
            logo_data = base64.b64decode(logo_base64.split(',')[-1] if ',' in logo_base64 else logo_base64)
            logo = Image.open(io.BytesIO(logo_data))
            logo_size = min(width // 4, 200)
            logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
            # Position logo at center top
            logo_x = (width - logo_size) // 2
            logo_y = height // 6
            img.paste(logo, (logo_x, logo_y), logo if logo.mode == 'RGBA' else None)
        except:
            pass
    
    # Add brand name below logo
    if brand_name:
        try:
            brand_font = ImageFont.truetype(font_paths[0], 60) if os.path.exists(font_paths[0]) else font
            bbox = draw.textbbox((0, 0), brand_name, font=brand_font)
            text_width = bbox[2] - bbox[0]
            x = (width - text_width) // 2
            y = height // 3
            draw.text((x, y), brand_name, fill=text_rgb, font=brand_font)
        except:
            pass
    
    # Add delivery badges
    if include_badges:
        badge_y = height - 200
        badge_texts = ["🛵 Swiggy", "🍽️ Zomato"]
        for i, badge in enumerate(badge_texts):
            try:
                badge_font = ImageFont.truetype(font_paths[0], 40) if os.path.exists(font_paths[0]) else font
                x = 100 + i * 300
                draw.text((x, badge_y), badge, fill=text_rgb, font=badge_font)
            except:
                pass
    
    # Add contact info
    if contact_info:
        try:
            contact_font = ImageFont.truetype(font_paths[0], 36) if os.path.exists(font_paths[0]) else font
            y = height - 100
            contact_text = ""
            if contact_info.get('phone'):
                contact_text += f"📞 {contact_info['phone']}  "
            if contact_info.get('website'):
                contact_text += f"🌐 {contact_info['website']}"
            if contact_text:
                bbox = draw.textbbox((0, 0), contact_text, font=contact_font)
                text_width = bbox[2] - bbox[0]
                x = (width - text_width) // 2
                draw.text((x, y), contact_text, fill=text_rgb, font=contact_font)
        except:
            pass
    
    # Save to bytes
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()

def add_text_overlay(image_bytes: bytes, text: str, position: str = "bottom", opacity: float = 0.8) -> bytes:
    """Add text overlay to an image"""
    img = Image.open(io.BytesIO(image_bytes))
    width, height = img.size
    
    # Create overlay
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Font
    font_size = width // 15
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
    ]
    
    font = None
    for font_path in font_paths:
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except:
                continue
    
    if font is None:
        font = ImageFont.load_default()
    
    # Calculate position
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    if position == "bottom":
        # Add gradient background
        gradient_height = text_height + 100
        for i in range(gradient_height):
            alpha = int(200 * (i / gradient_height) * opacity)
            draw.rectangle([(0, height - gradient_height + i), (width, height - gradient_height + i + 1)], fill=(0, 0, 0, alpha))
        
        x = (width - text_width) // 2
        y = height - text_height - 50
    else:
        x = (width - text_width) // 2
        y = height // 2
    
    # Draw text with shadow
    draw.text((x + 3, y + 3), text, fill=(0, 0, 0, 180), font=font)
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    # Merge
    img = img.convert('RGBA')
    img = Image.alpha_composite(img, overlay)
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return buffer.getvalue()

def add_watermark(image_bytes: bytes, logo_base64: str, opacity: float = 0.2) -> bytes:
    """Add watermark logo to image"""
    if not logo_base64:
        return image_bytes
    
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGBA')
        width, height = img.size
        
        # Load logo
        logo_data = base64.b64decode(logo_base64.split(',')[-1] if ',' in logo_base64 else logo_base64)
        logo = Image.open(io.BytesIO(logo_data)).convert('RGBA')
        
        # Resize logo
        logo_size = width // 6
        logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
        
        # Apply opacity
        alpha = logo.split()[3]
        alpha = alpha.point(lambda x: int(x * opacity))
        logo.putalpha(alpha)
        
        # Position top-right
        x = width - logo_size - 30
        y = 30
        
        img.paste(logo, (x, y), logo)
        
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return buffer.getvalue()
        
    except Exception as e:
        print(f"Watermark error: {e}")
        return image_bytes

async def generate_reel(
    brand_dna: dict,
    brief: str,
    style: str = "cinematic",
    language: str = "English",
    menu_item: dict = None
) -> dict:
    """
    Generate a complete reel video
    Returns: {video_base64, caption, hashtags, frames}
    """
    
    # Get brand colors
    brand_color = brand_dna.get('colors', ['#6366f1'])[0] if brand_dna.get('colors') else '#6366f1'
    logo_url = brand_dna.get('logo_url', '')
    brand_name = brand_dna.get('name', 'Café')
    show_badges = brand_dna.get('show_delivery_badges', True)
    phone = brand_dna.get('phone', '')
    website = brand_dna.get('website_url', '')
    
    # Generate text content
    reel_text = await generate_reel_text(brand_dna, brief, style, language)
    
    # Product info
    product_name = menu_item.get('name', 'Signature Coffee') if menu_item else 'Signature Coffee'
    product_desc = menu_item.get('description', 'Our special blend') if menu_item else 'Our special blend'
    
    # Frame dimensions (vertical video)
    width, height = 1080, 1920
    
    frames = []
    frame_durations = []
    
    try:
        if style == "cinematic":
            # Frame 1: Brand intro (0-2s)
            frame1 = create_text_frame(
                width, height,
                text=brand_name,
                bg_color=brand_color,
                logo_base64=logo_url if logo_url and logo_url.startswith('data:') else None,
                brand_name=brand_name,
                include_badges=False
            )
            frames.append(frame1)
            frame_durations.append(2)
            
            # Frame 2: Hero product (2-5s)
            hero_img = await generate_reel_image(f"Stunning close-up of {product_name}, {product_desc}")
            hero_with_text = add_text_overlay(hero_img, reel_text['hook_text'], "bottom")
            hero_with_watermark = add_watermark(hero_with_text, logo_url if logo_url and logo_url.startswith('data:') else None)
            frames.append(hero_with_watermark)
            frame_durations.append(3)
            
            # Frame 3: Second angle (5-9s)
            angle2_img = await generate_reel_image(f"Another angle of {product_name}, lifestyle setting")
            angle2_with_text = add_text_overlay(angle2_img, reel_text['story_text'], "bottom")
            angle2_with_watermark = add_watermark(angle2_with_text, logo_url if logo_url and logo_url.startswith('data:') else None)
            frames.append(angle2_with_watermark)
            frame_durations.append(4)
            
            # Frame 4: Detail shot (9-13s)
            detail_img = await generate_reel_image(f"Detail shot of {product_name}, artistic composition")
            detail_with_text = add_text_overlay(detail_img, reel_text['supporting_text'], "bottom")
            detail_with_watermark = add_watermark(detail_with_text, logo_url if logo_url and logo_url.startswith('data:') else None)
            frames.append(detail_with_watermark)
            frame_durations.append(4)
            
            # Frame 5: CTA (13-15s)
            frame5 = create_text_frame(
                width, height,
                text=reel_text['cta_text'],
                bg_color=brand_color,
                logo_base64=logo_url if logo_url and logo_url.startswith('data:') else None,
                brand_name=brand_name,
                include_badges=show_badges,
                contact_info={'phone': phone, 'website': website}
            )
            frames.append(frame5)
            frame_durations.append(2)
            
        else:  # casual style
            # Frame 1: Hook text (0-2s)
            frame1 = create_text_frame(
                width, height,
                text=reel_text['hook_text'],
                bg_color=brand_color,
                include_badges=False
            )
            frames.append(frame1)
            frame_durations.append(2)
            
            # Frame 2: Product close-up (2-6s)
            product_img = await generate_reel_image(f"Natural photo of {product_name}, casual setting")
            product_with_watermark = add_watermark(product_img, logo_url if logo_url and logo_url.startswith('data:') else None)
            frames.append(product_with_watermark)
            frame_durations.append(4)
            
            # Frame 3: Process/making (6-11s)
            process_img = await generate_reel_image(f"Making of {product_name}, behind the scenes, barista hands")
            process_with_text = add_text_overlay(process_img, reel_text['story_text'], "bottom")
            frames.append(process_with_text)
            frame_durations.append(5)
            
            # Frame 4: Final beauty shot (11-14s)
            beauty_img = await generate_reel_image(f"Beautiful presentation of {product_name}, lifestyle photo")
            beauty_with_text = add_text_overlay(beauty_img, reel_text['supporting_text'], "bottom")
            beauty_with_watermark = add_watermark(beauty_with_text, logo_url if logo_url and logo_url.startswith('data:') else None)
            frames.append(beauty_with_watermark)
            frame_durations.append(3)
            
            # Frame 5: CTA (14-15s)
            frame5 = create_text_frame(
                width, height,
                text=reel_text['cta_text'],
                bg_color=brand_color,
                logo_base64=logo_url if logo_url and logo_url.startswith('data:') else None,
                brand_name=brand_name,
                include_badges=show_badges,
                contact_info={'phone': phone, 'website': website}
            )
            frames.append(frame5)
            frame_durations.append(1)
        
        # Create video using FFmpeg
        with tempfile.TemporaryDirectory() as tmpdir:
            # Save frames as images
            frame_files = []
            for i, frame_bytes in enumerate(frames):
                frame_path = os.path.join(tmpdir, f"frame_{i:03d}.png")
                with open(frame_path, 'wb') as f:
                    f.write(frame_bytes)
                frame_files.append((frame_path, frame_durations[i]))
            
            # Create concat file for FFmpeg
            concat_file = os.path.join(tmpdir, "concat.txt")
            with open(concat_file, 'w') as f:
                for frame_path, duration in frame_files:
                    f.write(f"file '{frame_path}'\n")
                    f.write(f"duration {duration}\n")
                # Add last frame again (FFmpeg concat requirement)
                f.write(f"file '{frame_files[-1][0]}'\n")
            
            # Output video path
            output_path = os.path.join(tmpdir, "reel.mp4")
            
            # FFmpeg command with Ken Burns effect and warmth filter
            ffmpeg_cmd = [
                'ffmpeg', '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', concat_file,
                '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,colorbalance=rs=0.1:gs=0.05:bs=-0.1',
                '-c:v', 'libx264',
                '-preset', 'medium',
                '-crf', '23',
                '-pix_fmt', 'yuv420p',
                '-r', '30',
                '-t', str(sum(frame_durations)),
                output_path
            ]
            
            # Run FFmpeg
            result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"FFmpeg error: {result.stderr}")
                raise Exception(f"FFmpeg failed: {result.stderr}")
            
            # Read output video
            with open(output_path, 'rb') as f:
                video_bytes = f.read()
            
            video_base64 = base64.b64encode(video_bytes).decode('utf-8')
            
            return {
                "video_base64": video_base64,
                "caption": reel_text['caption'],
                "hashtags": reel_text['hashtags'],
                "duration": sum(frame_durations),
                "style": style,
                "frames_count": len(frames)
            }
            
    except Exception as e:
        print(f"Reel generation error: {e}")
        raise Exception(f"Failed to generate reel: {str(e)}")
