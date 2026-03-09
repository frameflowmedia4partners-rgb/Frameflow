from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
import asyncio
import requests
from bs4 import BeautifulSoup
from auth import hash_password, verify_password, create_access_token, get_current_user
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

class BrandRequest(BaseModel):
    name: str
    tone: Optional[str] = None
    colors: Optional[List[str]] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None

class ProjectRequest(BaseModel):
    brand_id: str
    name: str
    type: str

class GenerateContentRequest(BaseModel):
    prompt: str
    brand_id: Optional[str] = None
    project_id: Optional[str] = None
    type: str
    platform: Optional[str] = None
    tone: Optional[str] = None

class GenerateImageRequest(BaseModel):
    prompt: str
    project_id: Optional[str] = None

class GenerateVideoRequest(BaseModel):
    prompt: str
    project_id: Optional[str] = None
    duration: int = 4
    size: str = "1280x720"

class AnalyzeBrandRequest(BaseModel):
    website_url: str
    brand_id: str

class GenerateIdeaRequest(BaseModel):
    brand_id: str
    idea_type: str = "general"

class SaveIdeaRequest(BaseModel):
    brand_id: str
    idea_text: str
    idea_type: str

class CalendarRequest(BaseModel):
    brand_id: str
    days: int = 7

class PlatformContentRequest(BaseModel):
    prompt: str
    brand_id: str
    platform: str
    content_type: str

class RepurposeContentRequest(BaseModel):
    source_content: str
    brand_id: str
    source_type: str

class BatchGenerateRequest(BaseModel):
    brand_id: str
    count: int
    content_type: str

@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "full_name": request.full_name,
        "onboarding_completed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_access_token({"sub": user_id, "email": request.email})
    
    return AuthResponse(
        token=token,
        user={"id": user_id, "email": request.email, "full_name": request.full_name}
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    user = await db.users.find_one({"email": request.email})
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"], "email": user["email"]})
    
    return AuthResponse(
        token=token,
        user={"id": user["id"], "email": user["email"], "full_name": user.get("full_name")}
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/auth/complete-onboarding")
async def complete_onboarding(current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"onboarding_completed": True}}
    )
    return {"success": True}

@api_router.post("/brands")
async def create_brand(request: BrandRequest, current_user: dict = Depends(get_current_user)):
    brand_id = str(uuid.uuid4())
    brand_doc = {
        "id": brand_id,
        "user_id": current_user["user_id"],
        "name": request.name,
        "tone": request.tone,
        "colors": request.colors,
        "industry": request.industry,
        "logo_url": request.logo_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.brands.insert_one(brand_doc)
    brand_doc.pop("_id", None)
    return brand_doc

@api_router.get("/brands")
async def get_brands(current_user: dict = Depends(get_current_user)):
    brands = await db.brands.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    return brands

@api_router.get("/brands/{brand_id}")
async def get_brand(brand_id: str, current_user: dict = Depends(get_current_user)):
    brand = await db.brands.find_one({"id": brand_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand

@api_router.put("/brands/{brand_id}")
async def update_brand(brand_id: str, request: BrandRequest, current_user: dict = Depends(get_current_user)):
    result = await db.brands.update_one(
        {"id": brand_id, "user_id": current_user["user_id"]},
        {"$set": request.model_dump(exclude_unset=True)}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {"success": True}

@api_router.post("/projects")
async def create_project(request: ProjectRequest, current_user: dict = Depends(get_current_user)):
    brand = await db.brands.find_one({"id": request.brand_id, "user_id": current_user["user_id"]})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    project_id = str(uuid.uuid4())
    project_doc = {
        "id": project_id,
        "brand_id": request.brand_id,
        "name": request.name,
        "type": request.type,
        "status": "draft",
        "thumbnail_url": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(project_doc)
    project_doc.pop("_id", None)
    return project_doc

@api_router.get("/projects")
async def get_projects(brand_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if brand_id:
        brand = await db.brands.find_one({"id": brand_id, "user_id": current_user["user_id"]})
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        query["brand_id"] = brand_id
    else:
        user_brands = await db.brands.find({"user_id": current_user["user_id"]}, {"id": 1, "_id": 0}).to_list(100)
        brand_ids = [b["id"] for b in user_brands]
        query["brand_id"] = {"$in": brand_ids}
    
    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    brand = await db.brands.find_one({"id": project["brand_id"], "user_id": current_user["user_id"]})
    if not brand:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return project

@api_router.post("/generate/caption")
async def generate_caption(request: GenerateContentRequest, current_user: dict = Depends(get_current_user)):
    brand_context = ""
    if request.brand_id:
        brand = await db.brands.find_one({"id": request.brand_id, "user_id": current_user["user_id"]}, {"_id": 0})
        if brand:
            brand_context = f"Brand: {brand.get('name')}, Tone: {brand.get('tone', 'professional')}, Industry: {brand.get('industry', 'general')}"
    
    system_message = f"You are a creative marketing copywriter. Generate engaging social media captions. {brand_context}"
    user_prompt = f"Create a {request.platform or 'social media'} caption with a {request.tone or 'engaging'} tone for: {request.prompt}"
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=system_message
    ).with_model("openai", "gpt-5.2")
    
    user_message = UserMessage(text=user_prompt)
    response = await chat.send_message(user_message)
    
    content_id = str(uuid.uuid4())
    content_doc = {
        "id": content_id,
        "project_id": request.project_id,
        "type": "caption",
        "prompt": request.prompt,
        "content_text": response,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.generated_contents.insert_one(content_doc)
    
    return {"caption": response, "content_id": content_id}

@api_router.post("/generate/image")
async def generate_image(request: GenerateImageRequest, current_user: dict = Depends(get_current_user)):
    image_gen = OpenAIImageGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
    
    images = await image_gen.generate_images(
        prompt=request.prompt,
        model="gpt-image-1",
        number_of_images=1
    )
    
    if not images or len(images) == 0:
        raise HTTPException(status_code=500, detail="Image generation failed")
    
    image_base64 = base64.b64encode(images[0]).decode('utf-8')
    
    content_id = str(uuid.uuid4())
    content_doc = {
        "id": content_id,
        "project_id": request.project_id,
        "type": "image",
        "prompt": request.prompt,
        "content_url": f"data:image/png;base64,{image_base64}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.generated_contents.insert_one(content_doc)
    
    return {"image_url": f"data:image/png;base64,{image_base64}", "content_id": content_id}

@api_router.post("/generate/video")
async def generate_video(request: GenerateVideoRequest, current_user: dict = Depends(get_current_user)):
    video_gen = OpenAIVideoGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
    
    video_bytes = await asyncio.to_thread(
        video_gen.text_to_video,
        prompt=request.prompt,
        model="sora-2",
        size=request.size,
        duration=request.duration,
        max_wait_time=600
    )
    
    if not video_bytes:
        raise HTTPException(status_code=500, detail="Video generation failed")
    
    video_base64 = base64.b64encode(video_bytes).decode('utf-8')
    
    content_id = str(uuid.uuid4())
    content_doc = {
        "id": content_id,
        "project_id": request.project_id,
        "type": "video",
        "prompt": request.prompt,
        "content_url": f"data:video/mp4;base64,{video_base64}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.generated_contents.insert_one(content_doc)
    
    return {"video_url": f"data:video/mp4;base64,{video_base64}", "content_id": content_id}

@api_router.get("/contents/{project_id}")
async def get_project_contents(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    brand = await db.brands.find_one({"id": project["brand_id"], "user_id": current_user["user_id"]})
    if not brand:
        raise HTTPException(status_code=403, detail="Access denied")
    
    contents = await db.generated_contents.find({"project_id": project_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return contents

@api_router.get("/templates")
async def get_templates():
    templates = [
        {
            "id": "restaurant-promo",
            "name": "Restaurant Promotion",
            "description": "Promote your daily specials and menu items",
            "type": "image",
            "category": "restaurant",
            "prompt": "Create an engaging social media post promoting our daily special: [dish name]. Highlight fresh ingredients and limited availability. Tone: appetizing and urgent."
        },
        {
            "id": "cafe-reel",
            "name": "Cafe Reel",
            "description": "Showcase your coffee and ambiance",
            "type": "video",
            "category": "cafe",
            "prompt": "Generate a cozy cafe video concept showcasing our coffee-making process. Include shots of latte art, warm ambiance, and happy customers. Tone: warm and inviting."
        },
        {
            "id": "product-launch",
            "name": "Product Launch",
            "description": "Announce your new product with style",
            "type": "image",
            "category": "product",
            "prompt": "Announce our new product launch: [product name]. Emphasize innovation, benefits, and exclusive early access. Tone: exciting and professional."
        },
        {
            "id": "service-ad",
            "name": "Service Ad",
            "description": "Promote your services effectively",
            "type": "video",
            "category": "service",
            "prompt": "Promote our service: [service name]. Focus on solving customer pain points, showcasing results, and including a clear call-to-action. Tone: helpful and trustworthy."
        },
        {
            "id": "limited-promo",
            "name": "Limited-Time Promotion",
            "description": "Create urgency with time-sensitive offers",
            "type": "image",
            "category": "promotion",
            "prompt": "Create a limited-time promotion post. Emphasize scarcity, deadline, and exclusive benefits. Include clear CTA and sense of urgency."
        },
        {
            "id": "educational",
            "name": "Educational Content",
            "description": "Share valuable knowledge with your audience",
            "type": "caption",
            "category": "education",
            "prompt": "Create educational content about [topic]. Break down complex information into digestible tips. Add value and position brand as expert."
        },
        {
            "id": "behind-scenes",
            "name": "Behind-the-Scenes",
            "description": "Show the human side of your brand",
            "type": "video",
            "category": "storytelling",
            "prompt": "Create behind-the-scenes content showing our team, process, or daily operations. Build authentic connection with audience."
        },
        {
            "id": "testimonial",
            "name": "Customer Testimonial",
            "description": "Showcase customer success stories",
            "type": "image",
            "category": "social-proof",
            "prompt": "Create a customer testimonial post featuring real feedback. Highlight transformation, results, and emotional impact."
        },
        {
            "id": "seasonal",
            "name": "Seasonal Promotion",
            "description": "Leverage seasonal trends and holidays",
            "type": "image",
            "category": "seasonal",
            "prompt": "Create seasonal content for [holiday/season]. Connect product/service to seasonal themes and emotions."
        },
        {
            "id": "announcement",
            "name": "Brand Announcement",
            "description": "Share important brand news",
            "type": "caption",
            "category": "news",
            "prompt": "Make an official brand announcement about [news]. Build excitement, explain benefits, and include next steps."
        },
        {
            "id": "event-promo",
            "name": "Event Promotion",
            "description": "Drive attendance to your events",
            "type": "image",
            "category": "event",
            "prompt": "Promote upcoming event: [event name]. Include date, location, what to expect, and registration link. Create FOMO."
        },
        {
            "id": "engagement",
            "name": "Engagement Post",
            "description": "Boost interaction with your audience",
            "type": "caption",
            "category": "engagement",
            "prompt": "Create an engaging post that asks questions, runs polls, or encourages comments. Make it fun and interactive."
        }
    ]
    return templates

@api_router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    user_brands = await db.brands.find({"user_id": current_user["user_id"]}, {"id": 1, "_id": 0}).to_list(100)
    brand_ids = [b["id"] for b in user_brands]
    
    projects_count = await db.projects.count_documents({"brand_id": {"$in": brand_ids}})
    contents_count = await db.generated_contents.count_documents({})
    
    return {
        "brands": len(brand_ids),
        "projects": projects_count,
        "contents_generated": contents_count
    }

@api_router.post("/media/upload")
async def upload_media(file_name: str, file_data: str, file_type: str, brand_id: str, current_user: dict = Depends(get_current_user)):
    brand = await db.brands.find_one({"id": brand_id, "user_id": current_user["user_id"]})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    media_id = str(uuid.uuid4())
    media_doc = {
        "id": media_id,
        "brand_id": brand_id,
        "name": file_name,
        "type": file_type,
        "url": file_data,
        "size": len(file_data),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.media_assets.insert_one(media_doc)
    media_doc.pop("_id", None)
    return media_doc

@api_router.get("/media")
async def get_media(brand_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if brand_id:
        brand = await db.brands.find_one({"id": brand_id, "user_id": current_user["user_id"]})
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        query["brand_id"] = brand_id
    else:
        user_brands = await db.brands.find({"user_id": current_user["user_id"]}, {"id": 1, "_id": 0}).to_list(100)
        brand_ids = [b["id"] for b in user_brands]
        query["brand_id"] = {"$in": brand_ids}
    
    media = await db.media_assets.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return media

@api_router.delete("/media/{media_id}")
async def delete_media(media_id: str, current_user: dict = Depends(get_current_user)):
    media = await db.media_assets.find_one({"id": media_id}, {"_id": 0})
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    brand = await db.brands.find_one({"id": media["brand_id"], "user_id": current_user["user_id"]})
    if not brand:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.media_assets.delete_one({"id": media_id})
    return {"success": True}

@api_router.post("/contents/{content_id}/edit")
async def edit_content(content_id: str, edit_prompt: str, current_user: dict = Depends(get_current_user)):
    content = await db.generated_contents.find_one({"id": content_id}, {"_id": 0})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content["type"] == "caption":
        system_message = f"You are an expert content editor. Apply the following edit instruction: {edit_prompt}"
        original_caption = content["content_text"]
        
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=str(uuid.uuid4()),
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=f"Original caption:\n{original_caption}\n\nEdit instruction: {edit_prompt}")
        edited_caption = await chat.send_message(user_message)
        
        await db.generated_contents.update_one(
            {"id": content_id},
            {"$set": {"content_text": edited_caption}}
        )
        
        return {"edited_content": edited_caption, "content_id": content_id}
    
    raise HTTPException(status_code=400, detail="Only captions can be edited currently")

@api_router.post("/brands/{brand_id}/analyze")
async def analyze_brand_website(brand_id: str, request: AnalyzeBrandRequest, current_user: dict = Depends(get_current_user)):
    brand = await db.brands.find_one({"id": brand_id, "user_id": current_user["user_id"]})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    try:
        response = requests.get(request.website_url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(response.content, 'html.parser')
        
        text_content = soup.get_text()
        text_content = ' '.join(text_content.split())[:5000]
        
        meta_description = soup.find('meta', attrs={'name': 'description'})
        meta_desc = meta_description['content'] if meta_description else ""
        
        analysis_prompt = f"""Analyze this brand's website and extract key marketing information:

Website URL: {request.website_url}
Meta Description: {meta_desc}
Content Sample: {text_content[:2000]}

Extract and provide:
1. Brand Tone (professional, casual, playful, etc.)
2. Value Proposition (what makes them unique)
3. Target Audience (who are their customers)
4. Key Selling Points (3-5 points)
5. Marketing Angles (3-5 potential angles for content)
6. Keywords (10 relevant keywords)

Format as JSON."""
        
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=str(uuid.uuid4()),
            system_message="You are a brand analysis expert. Analyze websites and extract marketing insights in JSON format."
        ).with_model("openai", "gpt-5.2")
        
        analysis = await chat.send_message(UserMessage(text=analysis_prompt))
        
        import json
        try:
            analysis_data = json.loads(analysis)
        except:
            analysis_data = {"raw_analysis": analysis}
        
        await db.brands.update_one(
            {"id": brand_id},
            {"$set": {
                "website_url": request.website_url,
                "brand_analysis": analysis_data,
                "analyzed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"success": True, "analysis": analysis_data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze website: {str(e)}")

@api_router.post("/ideas/generate")
async def generate_idea(request: GenerateIdeaRequest, current_user: dict = Depends(get_current_user)):
    brand = await db.brands.find_one({"id": request.brand_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    brand_context = f"""Brand: {brand.get('name')}
Industry: {brand.get('industry', 'general')}
Tone: {brand.get('tone', 'professional')}"""
    
    if brand.get('brand_analysis'):
        analysis = brand['brand_analysis']
        brand_context += f"""
Value Proposition: {analysis.get('Value Proposition', '')}
Target Audience: {analysis.get('Target Audience', '')}"""
    
    idea_prompts = {
        "ad_hook": "Generate a compelling ad hook that grabs attention in the first 3 seconds.",
        "social_post": "Generate a creative social media post idea that drives engagement.",
        "storytelling": "Generate a storytelling angle that connects emotionally with the audience.",
        "campaign": "Generate a complete marketing campaign idea with theme and execution plan.",
        "promotion": "Generate a product promotion angle that highlights unique benefits.",
        "general": "Generate a creative marketing idea for social media content."
    }
    
    prompt_text = idea_prompts.get(request.idea_type, idea_prompts["general"])
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=f"You are a creative marketing strategist. Generate innovative marketing ideas. {brand_context}"
    ).with_model("openai", "gpt-5.2")
    
    idea = await chat.send_message(UserMessage(text=prompt_text))
    
    idea_id = str(uuid.uuid4())
    idea_doc = {
        "id": idea_id,
        "brand_id": request.brand_id,
        "idea_type": request.idea_type,
        "idea_text": idea,
        "status": "generated",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    return {"idea_id": idea_id, "idea_text": idea, "idea_type": request.idea_type}

@api_router.post("/ideas/save")
async def save_idea(request: SaveIdeaRequest, current_user: dict = Depends(get_current_user)):
    brand = await db.brands.find_one({"id": request.brand_id, "user_id": current_user["user_id"]})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    idea_id = str(uuid.uuid4())
    idea_doc = {
        "id": idea_id,
        "brand_id": request.brand_id,
        "idea_type": request.idea_type,
        "idea_text": request.idea_text,
        "status": "saved",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ideas.insert_one(idea_doc)
    return {"success": True, "idea_id": idea_id}

@api_router.get("/ideas")
async def get_ideas(brand_id: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    
    if brand_id:
        brand = await db.brands.find_one({"id": brand_id, "user_id": current_user["user_id"]})
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        query["brand_id"] = brand_id
    else:
        user_brands = await db.brands.find({"user_id": current_user["user_id"]}, {"id": 1, "_id": 0}).to_list(100)
        brand_ids = [b["id"] for b in user_brands]
        query["brand_id"] = {"$in": brand_ids}
    
    if status:
        query["status"] = status
    
    ideas = await db.ideas.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return ideas

@api_router.post("/calendar/generate")
async def generate_content_calendar(request: CalendarRequest, current_user: dict = Depends(get_current_user)):
    brand = await db.brands.find_one({"id": request.brand_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    brand_context = f"""Brand: {brand.get('name')}
Industry: {brand.get('industry', 'general')}
Tone: {brand.get('tone', 'professional')}"""
    
    prompt = f"""Create a {request.days}-day content calendar for this brand with daily post ideas.
For each day, suggest:
- Post idea/theme
- Content type (image/video/carousel)
- Caption hook
- Best posting time

Format as a structured list."""
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=f"You are a social media strategist creating content calendars. {brand_context}"
    ).with_model("openai", "gpt-5.2")
    
    calendar = await chat.send_message(UserMessage(text=prompt))
    
    return {"calendar": calendar, "days": request.days}

@api_router.post("/generate/platform-content")
async def generate_platform_content(request: PlatformContentRequest, current_user: dict = Depends(get_current_user)):
    brand = await db.brands.find_one({"id": request.brand_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    brand_context = f"""Brand: {brand.get('name')}, Tone: {brand.get('tone', 'professional')}, Industry: {brand.get('industry')}"""
    
    platform_prompts = {
        "instagram": "Create an Instagram post with engaging caption and 5-10 relevant hashtags.",
        "tiktok": "Create a TikTok video concept with a hook, main content description, and trending hashtag suggestions.",
        "youtube": "Create YouTube Short content with attention-grabbing title, description, and video concept.",
        "linkedin": "Create a professional LinkedIn post with value-driven content and call-to-action.",
        "twitter": "Create a Twitter/X thread with 3-5 tweets, each tweet under 280 characters."
    }
    
    platform_instruction = platform_prompts.get(request.platform, platform_prompts["instagram"])
    
    full_prompt = f"""{brand_context}

Topic: {request.prompt}
Platform: {request.platform}
Content Type: {request.content_type}

{platform_instruction}

Format the output clearly with sections."""
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message="You are a platform-specific content creator expert."
    ).with_model("openai", "gpt-5.2")
    
    content = await chat.send_message(UserMessage(text=full_prompt))
    
    content_id = str(uuid.uuid4())
    content_doc = {
        "id": content_id,
        "brand_id": request.brand_id,
        "type": "platform_content",
        "platform": request.platform,
        "prompt": request.prompt,
        "content_text": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.generated_contents.insert_one(content_doc)
    
    return {"content": content, "platform": request.platform, "content_id": content_id}

@api_router.post("/generate/repurpose")
async def repurpose_content(request: RepurposeContentRequest, current_user: dict = Depends(get_current_user)):
    brand = await db.brands.find_one({"id": request.brand_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    brand_context = f"""Brand: {brand.get('name')}, Tone: {brand.get('tone')}, Industry: {brand.get('industry')}"""
    
    platforms = ["instagram", "tiktok", "youtube", "linkedin", "twitter"]
    repurposed_content = {}
    
    for platform in platforms:
        platform_prompts = {
            "instagram": "Adapt this for Instagram with engaging caption and hashtags.",
            "tiktok": "Adapt this for TikTok with hook and trending format.",
            "youtube": "Adapt this for YouTube Short with title and description.",
            "linkedin": "Adapt this for LinkedIn with professional tone.",
            "twitter": "Adapt this for Twitter/X as a thread (3-5 tweets)."
        }
        
        prompt = f"""{brand_context}

Original content: {request.source_content}

{platform_prompts[platform]}

Keep the core message but optimize for {platform}."""
        
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=str(uuid.uuid4()),
            system_message="You are a content repurposing expert."
        ).with_model("openai", "gpt-5.2")
        
        adapted_content = await chat.send_message(UserMessage(text=prompt))
        repurposed_content[platform] = adapted_content
        
        content_id = str(uuid.uuid4())
        content_doc = {
            "id": content_id,
            "brand_id": request.brand_id,
            "type": "repurposed_content",
            "platform": platform,
            "source_content": request.source_content,
            "content_text": adapted_content,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.generated_contents.insert_one(content_doc)
    
    return {"repurposed_content": repurposed_content}

@api_router.post("/generate/batch")
async def batch_generate_content(request: BatchGenerateRequest, current_user: dict = Depends(get_current_user)):
    brand = await db.brands.find_one({"id": request.brand_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    brand_context = f"""Brand: {brand.get('name')}, Tone: {brand.get('tone')}, Industry: {brand.get('industry')}"""
    
    prompt = f"""{brand_context}

Generate {request.count} unique {request.content_type} ideas for this brand.

Each should be:
- Different from the others
- Aligned with brand tone
- Engaging and creative
- Platform-ready

Format as a numbered list with clear separation."""
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message="You are a content strategist creating diverse marketing content."
    ).with_model("openai", "gpt-5.2")
    
    batch_content = await chat.send_message(UserMessage(text=prompt))
    
    content_id = str(uuid.uuid4())
    content_doc = {
        "id": content_id,
        "brand_id": request.brand_id,
        "type": "batch_content",
        "content_type": request.content_type,
        "count": request.count,
        "content_text": batch_content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.generated_contents.insert_one(content_doc)
    
    return {"batch_content": batch_content, "count": request.count, "content_id": content_id}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()