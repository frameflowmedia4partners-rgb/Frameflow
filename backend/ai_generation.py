"""
AI Generation Module for Frameflow
Uses Gemini 2.0 Flash for text, DALL-E 3 for images, Pillow for compositing
"""
import os
import base64
import json
import asyncio
import aiohttp
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import google.generativeai as genai
from openai import AsyncOpenAI

# Initialize APIs
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
PIXABAY_API_KEY = os.environ.get('PIXABAY_API_KEY')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

openai_client = None
if OPENAI_API_KEY:
    openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Font paths
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

async def generate_text_gemini(prompt: str, system_context: str = "") -> str:
    """Generate text using Gemini 2.0 Flash"""
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        full_prompt = f"{system_context}\n\n{prompt}" if system_context else prompt
        response = await asyncio.to_thread(
            model.generate_content,
            full_prompt
        )
        return response.text
    except Exception as e:
        print(f"Gemini error: {e}")
        return ""

async def generate_image_dalle(prompt: str, size: str = "1024x1024") -> bytes:
    """Generate image using DALL-E 3"""
    if not openai_client:
        print("OpenAI client not initialized")
        return None
    try:
        response = await openai_client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size,
            quality="standard",
            n=1,
            response_format="b64_json"
        )
        image_data = base64.b64decode(response.data[0].b64_json)
        return image_data
    except Exception as e:
        print(f"DALL-E error: {e}")
        return None

async def get_pixabay_music(query: str = "cafe background") -> dict:
    """Get royalty-free music from Pixabay"""
    try:
        async with aiohttp.ClientSession() as session:
            url = f"https://pixabay.com/api/videos/?key={PIXABAY_API_KEY}&q={query}&video_type=film"
            async with session.get(url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get("hits"):
                        return data["hits"][0]
    except Exception as e:
        print(f"Pixabay error: {e}")
    return None

def hex_to_rgb(hex_color: str) -> tuple:
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_gradient(width: int, height: int, start_color: tuple, end_color: tuple, direction: str = "vertical") -> Image.Image:
    """Create a gradient image"""
    gradient = Image.new('RGBA', (width, height))
    draw = ImageDraw.Draw(gradient)
    
    if direction == "vertical":
        for y in range(height):
            ratio = y / height
            r = int(start_color[0] + (end_color[0] - start_color[0]) * ratio)
            g = int(start_color[1] + (end_color[1] - start_color[1]) * ratio)
            b = int(start_color[2] + (end_color[2] - start_color[2]) * ratio)
            a = int(start_color[3] + (end_color[3] - start_color[3]) * ratio) if len(start_color) > 3 else 255
            draw.line([(0, y), (width, y)], fill=(r, g, b, a))
    else:
        for x in range(width):
            ratio = x / width
            r = int(start_color[0] + (end_color[0] - start_color[0]) * ratio)
            g = int(start_color[1] + (end_color[1] - start_color[1]) * ratio)
            b = int(start_color[2] + (end_color[2] - start_color[2]) * ratio)
            a = int(start_color[3] + (end_color[3] - start_color[3]) * ratio) if len(start_color) > 3 else 255
            draw.line([(x, 0), (x, height)], fill=(r, g, b, a))
    
    return gradient

async def composite_post_image(
    background_image: bytes,
    headline: str,
    tagline: str,
    logo_url: str = None,
    brand_color: str = "#6366f1",
    show_delivery_badges: bool = True,
    contact_info: dict = None,
    size: tuple = (1080, 1080)
) -> bytes:
    """
    Composite a branded post image using Pillow
    Layers:
    1. DALL-E image full bleed background
    2. Mood color overlay 25-35% opacity
    3. Bottom gradient transparent→60% black, bottom 35%
    4. Top gradient dark, top 15%
    5. Brand logo top-right, white filter, 18% canvas width
    6. Headline bold serif large white
    7. Tagline elegant smaller cream
    8. Swiggy + Zomato badges bottom-left
    9. Phone + website bottom-right small white
    """
    try:
        # Load background image
        bg = Image.open(BytesIO(background_image)).convert('RGBA')
        bg = bg.resize(size, Image.Resampling.LANCZOS)
        width, height = size
        
        # Layer 2: Mood color overlay (25-35% opacity)
        mood_color = hex_to_rgb(brand_color)
        overlay = Image.new('RGBA', size, (*mood_color, 70))  # ~28% opacity
        bg = Image.alpha_composite(bg, overlay)
        
        # Layer 3: Bottom gradient (transparent to 60% black, bottom 35%)
        bottom_height = int(height * 0.35)
        bottom_gradient = create_gradient(
            width, bottom_height,
            (0, 0, 0, 0),  # transparent
            (0, 0, 0, 153)  # 60% black
        )
        gradient_layer = Image.new('RGBA', size, (0, 0, 0, 0))
        gradient_layer.paste(bottom_gradient, (0, height - bottom_height))
        bg = Image.alpha_composite(bg, gradient_layer)
        
        # Layer 4: Top gradient (dark, top 15%)
        top_height = int(height * 0.15)
        top_gradient = create_gradient(
            width, top_height,
            (0, 0, 0, 100),  # semi-dark
            (0, 0, 0, 0)  # transparent
        )
        top_layer = Image.new('RGBA', size, (0, 0, 0, 0))
        top_layer.paste(top_gradient, (0, 0))
        bg = Image.alpha_composite(bg, top_layer)
        
        draw = ImageDraw.Draw(bg)
        
        # Layer 5: Brand logo top-right (18% canvas width)
        if logo_url:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(logo_url) as resp:
                        if resp.status == 200:
                            logo_data = await resp.read()
                            logo = Image.open(BytesIO(logo_data)).convert('RGBA')
                            logo_width = int(width * 0.18)
                            aspect = logo.height / logo.width
                            logo_height = int(logo_width * aspect)
                            logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
                            # Apply white filter
                            logo = logo.convert('LA').convert('RGBA')
                            logo_x = width - logo_width - 40
                            logo_y = 40
                            bg.paste(logo, (logo_x, logo_y), logo)
            except Exception as e:
                print(f"Logo error: {e}")
        
        # Load fonts
        try:
            font_headline = ImageFont.truetype(FONT_BOLD, 64)
            font_tagline = ImageFont.truetype(FONT_REGULAR, 36)
            font_small = ImageFont.truetype(FONT_REGULAR, 24)
        except:
            font_headline = ImageFont.load_default()
            font_tagline = ImageFont.load_default()
            font_small = ImageFont.load_default()
        
        # Layer 6: Headline (bold, large, white)
        headline_y = height - int(height * 0.30)
        # Word wrap headline
        words = headline.split()
        lines = []
        current_line = ""
        for word in words:
            test_line = f"{current_line} {word}".strip()
            bbox = draw.textbbox((0, 0), test_line, font=font_headline)
            if bbox[2] - bbox[0] < width - 80:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)
        
        for i, line in enumerate(lines[:2]):  # Max 2 lines
            draw.text((40, headline_y + i * 70), line, fill=(255, 255, 255, 255), font=font_headline)
        
        # Layer 7: Tagline (elegant, smaller, cream)
        tagline_y = headline_y + len(lines[:2]) * 70 + 20
        draw.text((40, tagline_y), tagline[:80], fill=(255, 253, 240, 255), font=font_tagline)
        
        # Layer 8: Delivery badges bottom-left
        if show_delivery_badges:
            badge_y = height - 60
            # Draw simple text badges
            draw.text((40, badge_y), "🛵 Swiggy  •  Zomato", fill=(255, 255, 255, 200), font=font_small)
        
        # Layer 9: Contact info bottom-right
        if contact_info:
            contact_y = height - 60
            contact_text = ""
            if contact_info.get("phone"):
                contact_text += f"📞 {contact_info['phone']}  "
            if contact_info.get("website"):
                contact_text += f"🌐 {contact_info['website']}"
            bbox = draw.textbbox((0, 0), contact_text, font=font_small)
            contact_x = width - (bbox[2] - bbox[0]) - 40
            draw.text((contact_x, contact_y), contact_text, fill=(255, 255, 255, 200), font=font_small)
        
        # Convert to bytes
        output = BytesIO()
        bg.save(output, format='PNG', quality=95)
        output.seek(0)
        return output.read()
        
    except Exception as e:
        print(f"Composite error: {e}")
        return background_image  # Return original if composite fails

async def generate_content_swipe(brand_dna: dict, menu_items: list, count: int = 3, language: str = "English") -> list:
    """Generate multiple creatives for Content Swipe feature"""
    creatives = []
    
    # Build brand context
    brand_context = f"""
Brand: {brand_dna.get('name', 'Café')}
Type: {brand_dna.get('type', 'Café')}
Tone: {brand_dna.get('tone', 'warm and inviting')}
Colors: {', '.join(brand_dna.get('colors', ['#6366f1']))}
Target Audience: {brand_dna.get('target_audience', 'coffee lovers')}
Unique Value: {brand_dna.get('unique_claims', 'quality coffee')}
Language: {language}
Use Emojis: {brand_dna.get('use_emojis', True)}
"""
    
    for i in range(count):
        try:
            # Pick a menu item (cycle through)
            item = menu_items[i % len(menu_items)] if menu_items else {"name": "Signature Coffee", "description": "Our special blend"}
            
            # Generate text with Gemini
            text_prompt = f"""
{brand_context}

Create social media post content for: {item.get('name', 'Special Item')}
Description: {item.get('description', '')}

Generate in {language} language:
1. headline (max 6 words, catchy, memorable)
2. tagline (max 12 words, emotional appeal)
3. mood_color (hex code that matches the food/drink mood)
4. caption (engaging, 150-200 chars with CTA)
5. hashtags (10 relevant hashtags)

Return as JSON only, no other text:
{{"headline": "...", "tagline": "...", "mood_color": "#...", "caption": "...", "hashtags": ["...", "..."]}}
"""
            
            text_response = await generate_text_gemini(text_prompt)
            
            # Parse JSON from response
            try:
                # Extract JSON from response
                json_match = text_response[text_response.find('{'):text_response.rfind('}')+1]
                content_data = json.loads(json_match)
            except:
                content_data = {
                    "headline": item.get('name', 'Special Today'),
                    "tagline": "Crafted with love, served with care",
                    "mood_color": brand_dna.get('colors', ['#6366f1'])[0],
                    "caption": f"Try our amazing {item.get('name', 'special')}! 🎉",
                    "hashtags": ["#cafe", "#coffee", "#foodie"]
                }
            
            # Generate image with DALL-E 3
            image_prompt = f"""Professional food photography of {item.get('name', 'coffee')}: {item.get('description', 'delicious beverage')}.
Style: high-end restaurant marketing, warm lighting, shallow depth of field, appetizing presentation.
Setting: modern café ambiance, clean composition.
Do NOT include any text, logos, or watermarks in the image."""
            
            image_data = await generate_image_dalle(image_prompt)
            
            if image_data:
                # Composite the final image
                final_image = await composite_post_image(
                    background_image=image_data,
                    headline=content_data.get('headline', 'Special Today'),
                    tagline=content_data.get('tagline', 'Crafted with love'),
                    logo_url=brand_dna.get('logo_url'),
                    brand_color=content_data.get('mood_color', '#6366f1'),
                    show_delivery_badges=brand_dna.get('show_delivery_badges', True),
                    contact_info={
                        "phone": brand_dna.get('phone'),
                        "website": brand_dna.get('website_url')
                    }
                )
                
                creatives.append({
                    "id": str(i),
                    "headline": content_data.get('headline'),
                    "tagline": content_data.get('tagline'),
                    "mood_color": content_data.get('mood_color'),
                    "caption": content_data.get('caption'),
                    "hashtags": content_data.get('hashtags', []),
                    "image_base64": base64.b64encode(final_image).decode('utf-8'),
                    "menu_item": item.get('name'),
                    "format": "1080x1080"
                })
            
        except Exception as e:
            print(f"Creative generation error: {e}")
            continue
    
    return creatives

async def generate_concept_post(
    brand_dna: dict,
    product: str,
    format_size: str,
    angle: str,
    brief: str = "",
    language: str = "English"
) -> dict:
    """Generate a single concept post"""
    
    size_map = {
        "feed": (1080, 1080),
        "story": (1080, 1920),
        "reel_cover": (1080, 1080)
    }
    size = size_map.get(format_size, (1080, 1080))
    
    brand_context = f"""
Brand: {brand_dna.get('name', 'Café')}
Tone: {brand_dna.get('tone', 'warm')}
Target: {brand_dna.get('target_audience', 'food lovers')}
"""
    
    # Generate text
    text_prompt = f"""
{brand_context}
Product: {product}
Angle: {angle}
Brief: {brief}
Language: {language}

Generate post content:
1. headline (catchy, max 6 words)
2. tagline (emotional, max 12 words)  
3. mood_color (hex matching the mood)
4. caption (engaging, 150-200 chars)
5. hashtags (10 relevant)

Return JSON only:
{{"headline": "...", "tagline": "...", "mood_color": "#...", "caption": "...", "hashtags": [...]}}
"""
    
    text_response = await generate_text_gemini(text_prompt)
    
    try:
        json_match = text_response[text_response.find('{'):text_response.rfind('}')+1]
        content_data = json.loads(json_match)
    except:
        content_data = {
            "headline": product,
            "tagline": "Made with love",
            "mood_color": "#6366f1",
            "caption": f"Check out our {product}!",
            "hashtags": ["#food", "#cafe"]
        }
    
    # Generate image
    image_prompt = f"Professional food photography: {product}. {brief}. High-end restaurant marketing style, warm lighting, no text or logos."
    image_data = await generate_image_dalle(image_prompt, f"{size[0]}x{size[1]}" if size[0] == size[1] else "1024x1024")
    
    if image_data:
        final_image = await composite_post_image(
            background_image=image_data,
            headline=content_data.get('headline'),
            tagline=content_data.get('tagline'),
            logo_url=brand_dna.get('logo_url'),
            brand_color=content_data.get('mood_color'),
            show_delivery_badges=brand_dna.get('show_delivery_badges', True),
            contact_info={"phone": brand_dna.get('phone'), "website": brand_dna.get('website_url')},
            size=size
        )
        
        return {
            **content_data,
            "image_base64": base64.b64encode(final_image).decode('utf-8'),
            "format": format_size,
            "size": f"{size[0]}x{size[1]}"
        }
    
    return content_data

async def generate_variations(original_post: dict, brand_dna: dict, count: int = 3) -> list:
    """Generate variations of an existing post"""
    variations = []
    
    angles = ["discount", "announcement", "testimonial", "behind-scenes", "seasonal"]
    
    for i in range(count):
        angle = angles[i % len(angles)]
        
        text_prompt = f"""
Original headline: {original_post.get('headline', '')}
Original tagline: {original_post.get('tagline', '')}

Create a {angle} variation:
1. headline (new angle, max 6 words)
2. tagline (fresh perspective, max 12 words)
3. mood_color (different hex color)
4. caption (new CTA, 150-200 chars)

Return JSON only:
{{"headline": "...", "tagline": "...", "mood_color": "#...", "caption": "..."}}
"""
        
        text_response = await generate_text_gemini(text_prompt)
        
        try:
            json_match = text_response[text_response.find('{'):text_response.rfind('}')+1]
            content_data = json.loads(json_match)
        except:
            content_data = {
                "headline": f"{angle.title()} Special",
                "tagline": "Don't miss out!",
                "mood_color": "#ec4899",
                "caption": "Limited time offer!"
            }
        
        variations.append({
            "id": str(i),
            "angle": angle,
            **content_data
        })
    
    return variations

async def chat_with_ai(message: str, brand_dna: dict, chat_history: list = []) -> str:
    """AI Chat Assistant using Gemini"""
    
    brand_context = f"""
You are an AI marketing assistant for {brand_dna.get('name', 'a café')}.
Brand Type: {brand_dna.get('type', 'Café')}
Tone: {brand_dna.get('tone', 'friendly')}
Target Audience: {brand_dna.get('target_audience', 'food lovers')}
Menu Items: {', '.join([item.get('name', '') for item in brand_dna.get('menu_items', [])])}

Help with:
- Content ideas and captions
- Marketing strategy
- Social media tips
- Answering questions about their brand

Be helpful, creative, and on-brand. Use emojis if the brand allows.
"""
    
    # Build conversation
    conversation = brand_context + "\n\nConversation:\n"
    for msg in chat_history[-10:]:  # Last 10 messages
        role = "User" if msg.get('role') == 'user' else "Assistant"
        conversation += f"{role}: {msg.get('content', '')}\n"
    
    conversation += f"User: {message}\nAssistant:"
    
    response = await generate_text_gemini(conversation)
    return response
