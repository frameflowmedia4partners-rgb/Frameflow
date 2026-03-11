"""
AI Generation Module for Frameflow
Uses Gemini 2.0 Flash for text, Emergent OpenAI Image Gen for images, Pillow for compositing
"""
import os
import base64
import json
import asyncio
import aiohttp
import re
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from pathlib import Path
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import google.generativeai as genai
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

# Initialize APIs
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
PIXABAY_API_KEY = os.environ.get('PIXABAY_API_KEY')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Initialize Emergent image generator
image_generator = None
if EMERGENT_LLM_KEY:
    image_generator = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)

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

async def generate_image_dalle(prompt: str, size: str = "1024x1024", retries: int = 3) -> bytes:
    """Generate image using Emergent OpenAI Image Generation with retry logic"""
    if not image_generator:
        print("Emergent image generator not initialized")
        return None
    
    for attempt in range(retries):
        try:
            print(f"Image generation attempt {attempt + 1}/{retries}")
            images = await image_generator.generate_images(
                prompt=prompt,
                model="gpt-image-1",
                number_of_images=1
            )
            if images and len(images) > 0:
                print(f"Image generated successfully, size: {len(images[0])} bytes")
                return images[0]
            else:
                print("No image returned from generator")
        except Exception as e:
            print(f"DALL-E error (attempt {attempt + 1}): {e}")
            if attempt < retries - 1:
                await asyncio.sleep(2)  # Wait before retry
    
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
    try:
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    except:
        return (99, 102, 241)  # Default indigo

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
    """
    try:
        if not background_image:
            # Create a colored background if no image
            bg = Image.new('RGBA', size, hex_to_rgb(brand_color) + (255,))
        else:
            # Load background image
            bg = Image.open(BytesIO(background_image)).convert('RGBA')
            bg = bg.resize(size, Image.Resampling.LANCZOS)
        
        width, height = size
        
        # Layer 2: Mood color overlay (25-35% opacity)
        mood_color = hex_to_rgb(brand_color)
        overlay = Image.new('RGBA', size, (*mood_color, 70))
        bg = Image.alpha_composite(bg, overlay)
        
        # Layer 3: Bottom gradient (transparent to 60% black, bottom 35%)
        bottom_height = int(height * 0.35)
        bottom_gradient = create_gradient(
            width, bottom_height,
            (0, 0, 0, 0),
            (0, 0, 0, 153)
        )
        gradient_layer = Image.new('RGBA', size, (0, 0, 0, 0))
        gradient_layer.paste(bottom_gradient, (0, height - bottom_height))
        bg = Image.alpha_composite(bg, gradient_layer)
        
        # Layer 4: Top gradient (dark, top 15%)
        top_height = int(height * 0.15)
        top_gradient = create_gradient(
            width, top_height,
            (0, 0, 0, 100),
            (0, 0, 0, 0)
        )
        top_layer = Image.new('RGBA', size, (0, 0, 0, 0))
        top_layer.paste(top_gradient, (0, 0))
        bg = Image.alpha_composite(bg, top_layer)
        
        draw = ImageDraw.Draw(bg)
        
        # Layer 5: Brand logo top-right (18% canvas width)
        if logo_url:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(logo_url, timeout=10) as resp:
                        if resp.status == 200:
                            logo_data = await resp.read()
                            logo = Image.open(BytesIO(logo_data)).convert('RGBA')
                            logo_width = int(width * 0.18)
                            aspect = logo.height / logo.width
                            logo_height = int(logo_width * aspect)
                            logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)
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
        words = headline.split() if headline else []
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
        
        for i, line in enumerate(lines[:2]):
            draw.text((40, headline_y + i * 70), line, fill=(255, 255, 255, 255), font=font_headline)
        
        # Layer 7: Tagline (elegant, smaller, cream)
        tagline_y = headline_y + len(lines[:2]) * 70 + 20
        if tagline:
            draw.text((40, tagline_y), tagline[:80], fill=(255, 253, 240, 255), font=font_tagline)
        
        # Layer 8: Delivery badges bottom-left
        if show_delivery_badges:
            badge_y = height - 60
            draw.text((40, badge_y), "Swiggy  •  Zomato", fill=(255, 255, 255, 200), font=font_small)
        
        # Layer 9: Contact info bottom-right
        if contact_info:
            contact_y = height - 60
            contact_text = ""
            if contact_info.get("phone"):
                contact_text += f"{contact_info['phone']}  "
            if contact_info.get("website"):
                domain = urlparse(contact_info['website']).netloc or contact_info['website']
                contact_text += domain
            if contact_text:
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
        # Return a colored placeholder
        placeholder = Image.new('RGB', size, hex_to_rgb(brand_color))
        draw = ImageDraw.Draw(placeholder)
        try:
            font = ImageFont.truetype(FONT_BOLD, 48)
        except:
            font = ImageFont.load_default()
        if headline:
            draw.text((40, size[1] - 150), headline[:30], fill=(255, 255, 255), font=font)
        output = BytesIO()
        placeholder.save(output, format='PNG')
        output.seek(0)
        return output.read()

async def scrape_website_for_dna(url: str) -> dict:
    """
    Comprehensive website scraper for Brand DNA auto-extraction
    Extracts: brand name, colors, logo, description, phone, address, social links, products with images
    """
    result = {
        "name": "",
        "tagline": "",
        "description": "",
        "phone": "",
        "address": "",
        "website_url": url,
        "colors": [],
        "logo_url": "",
        "social_links": {},
        "products": [],
        "images": [],
        "scraped_at": None,
        "error": None
    }
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        import ssl
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        async with aiohttp.ClientSession(connector=connector) as session:
            # Scrape main page
            async with session.get(url, headers=headers, timeout=20) as resp:
                if resp.status != 200:
                    result["error"] = f"Failed to fetch website: HTTP {resp.status}"
                    return result
                
                html = await resp.text()
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract brand name
        # Try various sources: title, h1, meta og:title, brand class elements
        title_tag = soup.find('title')
        if title_tag:
            title_text = title_tag.get_text().strip()
            # Remove common suffixes
            for suffix in [' | ', ' - ', ' – ', ' :: ']:
                if suffix in title_text:
                    title_text = title_text.split(suffix)[0].strip()
            result["name"] = title_text
        
        # Try og:title
        og_title = soup.find('meta', property='og:title')
        if og_title and og_title.get('content'):
            result["name"] = og_title['content'].strip()
        
        # Extract description/tagline
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            result["description"] = meta_desc['content'].strip()[:500]
        
        og_desc = soup.find('meta', property='og:description')
        if og_desc and og_desc.get('content'):
            result["tagline"] = og_desc['content'].strip()[:200]
        
        # Extract logo
        # Try: link[rel*=icon], img[class*=logo], img[alt*=logo], og:image
        for link in soup.find_all('link', rel=lambda x: x and 'icon' in x):
            if link.get('href'):
                logo_href = link['href']
                if not logo_href.startswith('http'):
                    logo_href = urljoin(url, logo_href)
                result["logo_url"] = logo_href
                break
        
        # Try img with logo in class/alt
        for img in soup.find_all('img'):
            img_class = ' '.join(img.get('class', []))
            img_alt = img.get('alt', '')
            img_src = img.get('src') or img.get('data-src', '')
            
            if 'logo' in img_class.lower() or 'logo' in img_alt.lower():
                if img_src:
                    if not img_src.startswith('http'):
                        img_src = urljoin(url, img_src)
                    result["logo_url"] = img_src
                    break
        
        # Try og:image as fallback
        if not result["logo_url"]:
            og_image = soup.find('meta', property='og:image')
            if og_image and og_image.get('content'):
                result["logo_url"] = og_image['content']
        
        # Extract colors from CSS
        colors = set()
        for style in soup.find_all('style'):
            style_text = str(style)
            hex_colors = re.findall(r'#[0-9a-fA-F]{6}', style_text)
            colors.update(hex_colors[:10])
        
        # Also check inline styles
        for tag in soup.find_all(style=True):
            style_text = tag.get('style', '')
            hex_colors = re.findall(r'#[0-9a-fA-F]{6}', style_text)
            colors.update(hex_colors[:5])
        
        # Filter out common colors (white, black, grays)
        filtered_colors = [c for c in colors if c.lower() not in ['#ffffff', '#000000', '#333333', '#666666', '#999999', '#cccccc', '#f0f0f0', '#eeeeee']]
        result["colors"] = filtered_colors[:5]
        
        # Extract phone numbers
        text_content = soup.get_text()
        phone_patterns = [
            r'\+91[\s-]?\d{10}',
            r'\d{10}',
            r'\d{3}[\s-]?\d{3}[\s-]?\d{4}',
            r'\+\d{1,3}[\s-]?\d{6,12}'
        ]
        for pattern in phone_patterns:
            matches = re.findall(pattern, text_content)
            if matches:
                result["phone"] = matches[0].strip()
                break
        
        # Extract address
        address_keywords = ['address', 'location', 'find us', 'visit us', 'located at']
        for keyword in address_keywords:
            elements = soup.find_all(string=re.compile(keyword, re.I))
            for elem in elements:
                parent = elem.find_parent()
                if parent:
                    full_text = parent.get_text()
                    if len(full_text) > 20 and len(full_text) < 300:
                        result["address"] = full_text.strip()
                        break
        
        # Extract social links
        social_patterns = {
            'instagram': r'instagram\.com/([^/?]+)',
            'facebook': r'facebook\.com/([^/?]+)',
            'twitter': r'twitter\.com/([^/?]+)',
            'linkedin': r'linkedin\.com/in/([^/?]+)'
        }
        for link in soup.find_all('a', href=True):
            href = link['href']
            for platform, pattern in social_patterns.items():
                if platform in href.lower():
                    match = re.search(pattern, href)
                    if match:
                        result["social_links"][platform] = href
        
        # Extract ALL product/food images
        images_found = []
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src', '')
            alt = img.get('alt', '')
            
            if not src:
                continue
            
            # Skip tiny images, icons, logos
            width = img.get('width', '')
            height = img.get('height', '')
            try:
                if width and int(width) < 100:
                    continue
                if height and int(height) < 100:
                    continue
            except:
                pass
            
            # Skip common non-product images
            skip_patterns = ['icon', 'logo', 'avatar', 'button', 'arrow', 'social', 'facebook', 'twitter', 'instagram', 'whatsapp']
            if any(pattern in src.lower() or pattern in alt.lower() for pattern in skip_patterns):
                continue
            
            if not src.startswith('http'):
                src = urljoin(url, src)
            
            images_found.append({
                "url": src,
                "alt": alt,
                "filename": alt.lower().replace(' ', '_')[:30] if alt else urlparse(src).path.split('/')[-1]
            })
        
        result["images"] = images_found[:30]  # Limit to 30 images
        
        # Extract products from menu/product sections
        products = []
        
        # Look for product cards/items
        product_selectors = [
            'product', 'menu-item', 'food-item', 'dish', 'item-card',
            'product-card', 'menu-card', 'item'
        ]
        
        for selector in product_selectors:
            for element in soup.find_all(class_=re.compile(selector, re.I)):
                product = {"name": "", "description": "", "price": "", "image_url": ""}
                
                # Find product name (h1-h6, .title, .name)
                for heading in element.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
                    if heading.get_text().strip():
                        product["name"] = heading.get_text().strip()[:100]
                        break
                
                if not product["name"]:
                    title_elem = element.find(class_=re.compile(r'(title|name)', re.I))
                    if title_elem:
                        product["name"] = title_elem.get_text().strip()[:100]
                
                # Find description
                desc_elem = element.find(class_=re.compile(r'(desc|description|detail)', re.I))
                if desc_elem:
                    product["description"] = desc_elem.get_text().strip()[:200]
                
                # Find price
                price_elem = element.find(class_=re.compile(r'(price|cost)', re.I))
                if price_elem:
                    product["price"] = price_elem.get_text().strip()
                
                # Find image
                img = element.find('img')
                if img:
                    img_src = img.get('src') or img.get('data-src', '')
                    if img_src:
                        if not img_src.startswith('http'):
                            img_src = urljoin(url, img_src)
                        product["image_url"] = img_src
                
                if product["name"]:
                    products.append(product)
        
        # Deduplicate products by name
        seen_names = set()
        unique_products = []
        for p in products:
            if p["name"].lower() not in seen_names:
                seen_names.add(p["name"].lower())
                unique_products.append(p)
        
        result["products"] = unique_products[:20]  # Limit to 20 products
        
        # Import datetime for timestamp
        from datetime import datetime, timezone
        result["scraped_at"] = datetime.now(timezone.utc).isoformat()
        
        return result
        
    except asyncio.TimeoutError:
        result["error"] = "Website took too long to respond"
        return result
    except Exception as e:
        result["error"] = f"Scraping error: {str(e)}"
        return result

async def generate_content_swipe(brand_dna: dict, menu_items: list, count: int = 3, language: str = "English", user_preferences: list = None, use_real_images: bool = True) -> list:
    """Generate multiple creatives for Content Swipe feature with AI learning"""
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
    
    # Add learning context from user preferences
    preference_context = ""
    if user_preferences and len(user_preferences) > 0:
        saved_styles = [p for p in user_preferences if p.get('action') == 'save']
        discarded_styles = [p for p in user_preferences if p.get('action') == 'discard']
        
        if saved_styles:
            saved_colors = list(set([p.get('style') for p in saved_styles if p.get('style')]))[:3]
            preference_context = f"""
USER PREFERENCES (learn from these):
- Preferred colors: {', '.join(saved_colors) if saved_colors else 'warm tones'}
- User tends to save content with: emotional appeal, clear CTA
"""
    
    # Get scraped images from brand DNA for use as real product images
    scraped_images = brand_dna.get('scraped_data', {}).get('images', []) if brand_dna.get('scraped_data') else []
    
    for i in range(count):
        try:
            # Pick a menu item (cycle through)
            item = menu_items[i % len(menu_items)] if menu_items else {"name": "Signature Coffee", "description": "Our special blend"}
            
            # Generate text with Gemini
            text_prompt = f"""
{brand_context}
{preference_context}

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
                json_match = text_response[text_response.find('{'):text_response.rfind('}')+1]
                content_data = json.loads(json_match)
            except:
                content_data = {
                    "headline": item.get('name', 'Special Today'),
                    "tagline": "Crafted with love, served with care",
                    "mood_color": brand_dna.get('colors', ['#6366f1'])[0] if brand_dna.get('colors') else '#6366f1',
                    "caption": f"Try our amazing {item.get('name', 'special')}!",
                    "hashtags": ["#cafe", "#coffee", "#foodie"]
                }
            
            # Try to use real product image first
            image_data = None
            used_real_image = False
            
            # Check if menu item has an image
            if use_real_images and item.get('image_url'):
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(item['image_url'], timeout=10) as resp:
                            if resp.status == 200:
                                image_data = await resp.read()
                                used_real_image = True
                                print(f"Using real product image for {item.get('name')}")
                except Exception as e:
                    print(f"Failed to fetch product image: {e}")
            
            # Try scraped images as fallback
            if not image_data and use_real_images and scraped_images and i < len(scraped_images):
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(scraped_images[i]['url'], timeout=10) as resp:
                            if resp.status == 200:
                                image_data = await resp.read()
                                used_real_image = True
                                print(f"Using scraped image for {item.get('name')}")
                except Exception as e:
                    print(f"Failed to fetch scraped image: {e}")
            
            # Generate with DALL-E if no real image available
            if not image_data:
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
                    "format": "1080x1080",
                    "used_real_image": used_real_image
                })
            
        except Exception as e:
            print(f"Creative generation error: {e}")
            import traceback
            traceback.print_exc()
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
    
    # Try to find a real image from brand's scraped data
    image_data = None
    scraped_images = brand_dna.get('scraped_data', {}).get('images', []) if brand_dna.get('scraped_data') else []
    
    if scraped_images:
        # Try to find an image matching the product
        for img in scraped_images:
            if product.lower() in img.get('alt', '').lower():
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(img['url'], timeout=10) as resp:
                            if resp.status == 200:
                                image_data = await resp.read()
                                print(f"Using scraped image for concept: {product}")
                                break
                except:
                    pass
    
    # Generate image with DALL-E if no real image
    if not image_data:
        image_prompt = f"Professional food photography: {product}. {brief}. High-end restaurant marketing style, warm lighting, no text or logos."
        image_data = await generate_image_dalle(image_prompt)
    
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
    
    return {**content_data, "error": "Failed to generate image"}

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
    for msg in chat_history[-10:]:
        role = "User" if msg.get('role') == 'user' else "Assistant"
        conversation += f"{role}: {msg.get('content', '')}\n"
    
    conversation += f"User: {message}\nAssistant:"
    
    response = await generate_text_gemini(conversation)
    return response
