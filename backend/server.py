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
            "category": "restaurant"
        },
        {
            "id": "cafe-reel",
            "name": "Cafe Reel",
            "description": "Showcase your coffee and ambiance",
            "type": "video",
            "category": "cafe"
        },
        {
            "id": "product-launch",
            "name": "Product Launch",
            "description": "Announce your new product with style",
            "type": "image",
            "category": "product"
        },
        {
            "id": "service-ad",
            "name": "Service Ad",
            "description": "Promote your services effectively",
            "type": "video",
            "category": "service"
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