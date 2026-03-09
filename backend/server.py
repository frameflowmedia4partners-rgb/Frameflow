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

class MetaAdsConnectRequest(BaseModel):
    access_token: str
    instagram_account_id: Optional[str] = None
    facebook_page_id: Optional[str] = None

class AdCampaignRequest(BaseModel):
    brand_id: str
    campaign_goal: str
    target_audience: str
    daily_budget: float
    promotion_type: str
    location: str

# Admin Models
class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    cafe_name: str

class AdminUpdateUserRequest(BaseModel):
    is_active: Optional[bool] = None
    cafe_name: Optional[str] = None

class AdminResetPasswordRequest(BaseModel):
    new_password: str

# Helper function to check if user is admin
async def get_admin_user(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

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
    
    # Check if user is active (admins and demo accounts are always active)
    if user.get("role") != "admin" and not user.get("is_demo_account") and user.get("is_active") == False:
        raise HTTPException(status_code=403, detail="Account is deactivated. Please contact support.")
    
    token = create_access_token({"sub": user["id"], "email": user["email"]})
    
    return AuthResponse(
        token=token,
        user={
            "id": user["id"], 
            "email": user["email"], 
            "full_name": user.get("full_name"),
            "role": user.get("role", "user")
        }
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure role is included
    if "role" not in user:
        user["role"] = "user"
    
    return user

@api_router.put("/auth/complete-onboarding")
async def complete_onboarding(current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"onboarding_completed": True}}
    )
    return {"success": True}

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/users")
async def admin_get_users(admin_user: dict = Depends(get_admin_user)):
    """Get all users (admin only)"""
    users = await db.users.find(
        {"role": {"$ne": "admin"}},  # Exclude admin users from list
        {"_id": 0, "password_hash": 0}
    ).to_list(500)
    
    # Add brand info for each user
    for user in users:
        brand = await db.brands.find_one({"user_id": user["id"]}, {"_id": 0})
        user["brand"] = brand
    
    return users

@api_router.post("/admin/users")
async def admin_create_user(request: AdminCreateUserRequest, admin_user: dict = Depends(get_admin_user)):
    """Create a new café user (admin only)"""
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "full_name": request.cafe_name,
        "role": "user",
        "is_active": True,
        "onboarding_completed": False,
        "created_by_admin": admin_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create default brand for the café
    brand_id = str(uuid.uuid4())
    brand_doc = {
        "id": brand_id,
        "user_id": user_id,
        "name": request.cafe_name,
        "tone": "warm and inviting",
        "industry": "café",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.brands.insert_one(brand_doc)
    
    return {
        "success": True,
        "user": {
            "id": user_id,
            "email": request.email,
            "full_name": request.cafe_name,
            "is_active": True
        },
        "brand_id": brand_id
    }

@api_router.get("/admin/users/{user_id}")
async def admin_get_user(user_id: str, admin_user: dict = Depends(get_admin_user)):
    """Get a specific user (admin only)"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    brand = await db.brands.find_one({"user_id": user_id}, {"_id": 0})
    user["brand"] = brand
    
    return user

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, request: AdminUpdateUserRequest, admin_user: dict = Depends(get_admin_user)):
    """Update user (activate/deactivate, update café name)"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Cannot modify admin users")
    
    update_data = {}
    if request.is_active is not None:
        update_data["is_active"] = request.is_active
    if request.cafe_name is not None:
        update_data["full_name"] = request.cafe_name
        # Also update brand name
        await db.brands.update_one(
            {"user_id": user_id},
            {"$set": {"name": request.cafe_name}}
        )
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return {"success": True, "user": updated_user}

@api_router.post("/admin/users/{user_id}/reset-password")
async def admin_reset_password(user_id: str, request: AdminResetPasswordRequest, admin_user: dict = Depends(get_admin_user)):
    """Reset user password (admin only)"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Cannot reset admin password this way")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "password_hash": hash_password(request.new_password),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Password reset successfully"}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin_user: dict = Depends(get_admin_user)):
    """Delete a user and all their data (admin only)"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin users")
    
    # Delete user's brands, projects, contents, ideas, etc.
    brands = await db.brands.find({"user_id": user_id}).to_list(100)
    brand_ids = [b["id"] for b in brands]
    
    await db.projects.delete_many({"brand_id": {"$in": brand_ids}})
    await db.contents.delete_many({"brand_id": {"$in": brand_ids}})
    await db.ideas.delete_many({"brand_id": {"$in": brand_ids}})
    await db.ad_campaigns.delete_many({"user_id": user_id})
    await db.brands.delete_many({"user_id": user_id})
    await db.users.delete_one({"id": user_id})
    
    return {"success": True, "message": "User and all associated data deleted"}

@api_router.get("/admin/stats")
async def admin_get_stats(admin_user: dict = Depends(get_admin_user)):
    """Get platform statistics (admin only)"""
    total_users = await db.users.count_documents({"role": {"$ne": "admin"}})
    active_users = await db.users.count_documents({"role": {"$ne": "admin"}, "is_active": True})
    total_brands = await db.brands.count_documents({})
    total_projects = await db.projects.count_documents({})
    total_contents = await db.contents.count_documents({})
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "total_brands": total_brands,
        "total_projects": total_projects,
        "total_contents": total_contents
    }

@api_router.post("/admin/setup")
async def admin_setup():
    """Create initial admin account (one-time setup)"""
    # Check if admin already exists
    existing_admin = await db.users.find_one({"role": "admin"})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin account already exists")
    
    admin_id = str(uuid.uuid4())
    admin_doc = {
        "id": admin_id,
        "email": "admin@frameflow.cafe",
        "password_hash": hash_password("FrameflowAdmin2026"),
        "full_name": "Frameflow Admin",
        "role": "admin",
        "is_active": True,
        "onboarding_completed": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_doc)
    
    return {
        "success": True,
        "message": "Admin account created",
        "credentials": {
            "email": "admin@frameflow.cafe",
            "password": "FrameflowAdmin2026"
        }
    }

# ==================== END ADMIN ENDPOINTS ====================

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
            "id": "daily-special",
            "name": "Daily Caf\u00e9 Special",
            "description": "Promote today's featured drink or dessert",
            "type": "image",
            "category": "promotion",
            "prompt": "Create an Instagram post promoting our daily special: [drink/dessert name]. Highlight ingredients, flavor profile, and limited availability. Tone: appetizing and urgent. Include caf\u00e9-specific hashtags like #CoffeeLovers #CafeLife #DailySpecial"
        },
        {
            "id": "new-drink-launch",
            "name": "New Drink Launch",
            "description": "Announce a new signature drink",
            "type": "image",
            "category": "launch",
            "prompt": "Announce our new signature drink: [drink name]. Emphasize unique flavors, ingredients, and the experience. Create excitement with exclusive first-taste offer. Include hashtags: #NewDrink #CafeMenu #SpecialtyCoffee"
        },
        {
            "id": "latte-art-reel",
            "name": "Latte Art Showcase",
            "description": "Feature beautiful latte art in a reel",
            "type": "video",
            "category": "reel",
            "prompt": "Create a TikTok/Instagram reel concept showcasing our barista creating beautiful latte art. Include: close-up of pour, reveal of design, cozy caf\u00e9 ambiance. Tone: aesthetic and satisfying. Hashtags: #LatteArt #BaristaLife #CoffeeArt"
        },
        {
            "id": "cozy-atmosphere",
            "name": "Cozy Caf\u00e9 Vibes",
            "description": "Highlight your caf\u00e9's ambiance",
            "type": "video",
            "category": "atmosphere",
            "prompt": "Create content showing the cozy atmosphere of our caf\u00e9. Include: warm lighting, comfortable seating, people enjoying coffee, background music vibe. Tone: inviting and relaxing. Hashtags: #CafeVibes #CozyPlace #CoffeTime"
        },
        {
            "id": "dessert-spotlight",
            "name": "Dessert Spotlight",
            "description": "Feature your signature desserts",
            "type": "image",
            "category": "menu",
            "prompt": "Spotlight our signature dessert: [dessert name]. Show close-up shot, describe taste and texture, pair with coffee recommendation. Tone: indulgent and tempting. Hashtags: #CafeDessert #Pastries #SweetTooth"
        },
        {
            "id": "weekend-promo",
            "name": "Weekend Caf\u00e9 Promotion",
            "description": "Drive weekend traffic",
            "type": "image",
            "category": "promotion",
            "prompt": "Create a weekend promotion post for [offer]. Build excitement for weekend visits, emphasize relaxation and treat-yourself vibe. Include clear CTA. Hashtags: #WeekendVibes #CafeCulture #WeekendTreats"
        },
        {
            "id": "barista-moments",
            "name": "Barista Behind the Scenes",
            "description": "Show your barista team at work",
            "type": "video",
            "category": "story",
            "prompt": "Create behind-the-scenes content featuring our baristas. Show: coffee preparation, passion for craft, team personality. Build authentic connection. Hashtags: #BaristaLife #CoffeePassion #MeetTheTeam"
        },
        {
            "id": "customer-experience",
            "name": "Guest Experience Story",
            "description": "Feature happy customers and testimonials",
            "type": "image",
            "category": "social-proof",
            "prompt": "Share customer experience featuring real feedback about our caf\u00e9. Highlight: favorite drinks, ambiance appreciation, memorable moments. Tone: authentic and heartwarming. Hashtags: #HappyGuests #CafeCommunity #CustomerLove"
        },
        {
            "id": "seasonal-drink",
            "name": "Seasonal Caf\u00e9 Special",
            "description": "Promote seasonal drink offerings",
            "type": "image",
            "category": "seasonal",
            "prompt": "Create seasonal content for [season/holiday] special drink. Connect flavors to seasonal themes and emotions. Limited-time emphasis. Hashtags: #SeasonalSpecial #LimitedTime #CafeSeason"
        },
        {
            "id": "morning-ritual",
            "name": "Morning Coffee Ritual",
            "description": "Capture the perfect morning moment",
            "type": "image",
            "category": "lifestyle",
            "prompt": "Create content celebrating the morning coffee ritual. Show: fresh brew, sunrise vibes, starting the day right. Inspire your audience. Hashtags: #MorningCoffee #CoffeeRitual #MorningVibes"
        },
        {
            "id": "study-spot",
            "name": "Perfect Study Spot",
            "description": "Attract students and remote workers",
            "type": "image",
            "category": "audience",
            "prompt": "Position caf\u00e9 as the perfect study/work spot. Highlight: WiFi, comfortable seating, quiet corners, productivity fuel. Target students and remote workers. Hashtags: #StudySpot #CafeWork #RemoteWork"
        },
        {
            "id": "date-night",
            "name": "Caf\u00e9 Date Night",
            "description": "Promote evening coffee dates",
            "type": "image",
            "category": "audience",
            "prompt": "Create romantic caf\u00e9 date content. Highlight: cozy seating for two, dessert pairings, intimate atmosphere, evening specials. Target couples. Hashtags: #CafeDate #CoffeDate #CozyNight"
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

@api_router.post("/demo/login")
async def demo_login():
    """Public demo login - creates or logs in demo user with full sample data"""
    demo_email = "demo@frameflow.cafe"
    demo_password = "FrameflowDemo2026"
    
    # Check if demo user exists
    demo_user = await db.users.find_one({"email": demo_email})
    
    if not demo_user:
        # Create demo user
        user_id = str(uuid.uuid4())
        demo_user = {
            "id": user_id,
            "email": demo_email,
            "password_hash": hash_password(demo_password),
            "full_name": "Demo Café Owner",
            "onboarding_completed": True,
            "is_demo_account": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(demo_user)
    else:
        user_id = demo_user["id"]
    
    # Create comprehensive demo data
    await _create_full_demo_data(user_id)
    
    # Generate token
    token = create_access_token({"sub": user_id, "email": demo_email})
    
    return AuthResponse(
        token=token,
        user={"id": user_id, "email": demo_email, "full_name": "Demo Café Owner", "is_demo": True}
    )

async def _create_full_demo_data(user_id: str):
    """Create comprehensive demo data for showcasing the platform"""
    
    # 1. Create Demo Café Brand
    brand_id = "demo-urban-brew-cafe"
    demo_brand = {
        "id": brand_id,
        "user_id": user_id,
        "name": "Urban Brew Café",
        "tone": "warm and inviting",
        "industry": "café",
        "specialties": "Artisan Coffee, Fresh Pastries, Cozy Atmosphere",
        "website_url": "https://urbanbrewcafe.example.com",
        "brand_analysis": {
            "Brand Tone": "Warm, welcoming, community-focused",
            "Value Proposition": "Premium artisan coffee experience with cozy atmosphere",
            "Target Audience": "Remote workers, students, coffee enthusiasts, couples",
            "Signature Drinks": ["Vanilla Latte", "Caramel Cold Brew", "Matcha Latte", "Pumpkin Spice Latte"],
            "Dessert Highlights": ["Chocolate Croissant", "Blueberry Muffin", "Carrot Cake", "Tiramisu"],
            "Ambiance Style": "Modern rustic with warm lighting and exposed brick",
            "Location Context": "Urban neighborhood café with outdoor patio seating"
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    existing_brand = await db.brands.find_one({"id": brand_id})
    if not existing_brand:
        await db.brands.insert_one(demo_brand)
    
    # 2. Create Demo Projects/Campaigns
    demo_projects = [
        {"id": "demo-fall-campaign", "name": "Fall Season Campaign", "type": "image", "status": "active"},
        {"id": "demo-new-drink-launch", "name": "Pumpkin Spice Launch", "type": "video", "status": "active"},
        {"id": "demo-weekly-specials", "name": "Weekly Specials Series", "type": "caption", "status": "active"},
        {"id": "demo-holiday-promo", "name": "Holiday Promotion", "type": "image", "status": "draft"},
    ]
    
    for project in demo_projects:
        existing = await db.projects.find_one({"id": project["id"]})
        if not existing:
            await db.projects.insert_one({
                **project,
                "brand_id": brand_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
    
    # 3. Create Demo Generated Content
    demo_contents = [
        {
            "id": "demo-content-1",
            "project_id": "demo-fall-campaign",
            "brand_id": brand_id,
            "type": "caption",
            "content_text": "☕ Fall is here, and so is our famous Pumpkin Spice Latte! 🎃\n\nCrafted with real pumpkin, warm spices, and topped with silky steamed milk. Every sip feels like a cozy autumn hug.\n\n📍 Available now at Urban Brew Café\n\n#PumpkinSpice #FallVibes #CoffeeLovers #UrbanBrew #CafeLife #SeasonalSpecial",
            "prompt": "Create a fall-themed Instagram caption for our new Pumpkin Spice Latte"
        },
        {
            "id": "demo-content-2",
            "project_id": "demo-fall-campaign",
            "type": "caption",
            "brand_id": brand_id,
            "content_text": "The leaves are falling, but our standards aren't. 🍂\n\nOur baristas are serving up perfection one cup at a time. Come taste the difference that passion makes.\n\n✨ Fresh beans, roasted weekly\n✨ Locally sourced pastries\n✨ Free WiFi for remote workers\n\nTag someone who needs their daily brew! ☕\n\n#CafeVibes #CoffeeTime #LocalCafe #UrbanBrewCafe",
            "prompt": "Write an engaging caption highlighting our café quality"
        },
        {
            "id": "demo-content-3",
            "project_id": "demo-weekly-specials",
            "type": "caption",
            "brand_id": brand_id,
            "content_text": "🌟 WEEKLY SPECIAL ALERT 🌟\n\nThis week only: Caramel Apple Cold Brew!\n\nImagine crisp apple notes dancing with buttery caramel, all swirling in our smooth cold brew. It's fall in a cup. 🍎\n\n💰 Just $4.50 (reg. $6)\n📅 Available Mon-Sun this week only\n\nDon't miss out - once it's gone, it's gone!\n\n#WeeklySpecial #ColdBrew #FallDrinks #LimitedTime #UrbanBrew",
            "prompt": "Create a promotional caption for our weekly special drink"
        },
    ]
    
    for content in demo_contents:
        existing = await db.contents.find_one({"id": content["id"]})
        if not existing:
            await db.contents.insert_one({
                **content,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    # 4. Create Demo Ideas
    demo_ideas = [
        {
            "id": "demo-idea-1",
            "brand_id": brand_id,
            "idea_type": "social_post",
            "idea_text": "📸 Behind-the-scenes reel: Follow a coffee bean's journey from our roaster partner to your cup. Show the roasting process, the careful grinding, and the perfect pour. End with a satisfied customer's first sip.",
            "status": "saved"
        },
        {
            "id": "demo-idea-2",
            "brand_id": brand_id,
            "idea_type": "ad_hook",
            "idea_text": "🎯 Ad Hook: 'Your office called. It wants you to work from somewhere better.' Target remote workers with images of cozy laptop setups, great WiFi speeds, and unlimited coffee refills.",
            "status": "saved"
        },
        {
            "id": "demo-idea-3",
            "brand_id": brand_id,
            "idea_type": "campaign",
            "idea_text": "🎄 Holiday Campaign: '12 Days of Coffee Christmas' - Feature a different specialty drink each day leading up to Christmas. Create FOMO with limited quantities and countdown posts.",
            "status": "saved"
        },
        {
            "id": "demo-idea-4",
            "brand_id": brand_id,
            "idea_type": "promotion",
            "idea_text": "☕ Loyalty Program Launch: 'Brew Crew' membership - Buy 9 drinks, get the 10th free. Create shareable digital punch cards and encourage customers to post their progress.",
            "status": "saved"
        },
        {
            "id": "demo-idea-5",
            "brand_id": brand_id,
            "idea_type": "storytelling",
            "idea_text": "📖 Customer Spotlight Series: Interview regular customers about their favorite drink and what Urban Brew means to them. Create short video testimonials for social proof.",
            "status": "saved"
        },
    ]
    
    for idea in demo_ideas:
        existing = await db.ideas.find_one({"id": idea["id"]})
        if not existing:
            await db.ideas.insert_one({
                **idea,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    # 5. Create Demo Ad Campaigns
    demo_campaigns = [
        {
            "id": "demo-campaign-1",
            "brand_id": brand_id,
            "user_id": user_id,
            "campaign_goal": "engagement",
            "target_audience": "Coffee lovers aged 25-45 within 10 miles",
            "daily_budget": 15.0,
            "promotion_type": "Fall Season Launch",
            "location": "Downtown Seattle, 10-mile radius",
            "status": "active",
            "strategy": "Focus on warm, inviting imagery showcasing fall drinks. Target morning commuters and remote workers. Use carousel ads with multiple drink options. Peak posting times: 7-9 AM and 2-4 PM."
        },
        {
            "id": "demo-campaign-2",
            "brand_id": brand_id,
            "user_id": user_id,
            "campaign_goal": "traffic",
            "target_audience": "Remote workers and students",
            "daily_budget": 20.0,
            "promotion_type": "Work From Café Wednesdays",
            "location": "University District, 5-mile radius",
            "status": "paused",
            "strategy": "Highlight WiFi, comfortable seating, and productivity-friendly atmosphere. Offer Wednesday specials for laptop workers. Partner with local coworking spaces for cross-promotion."
        },
    ]
    
    for campaign in demo_campaigns:
        existing = await db.ad_campaigns.find_one({"id": campaign["id"]})
        if not existing:
            await db.ad_campaigns.insert_one({
                **campaign,
                "created_at": datetime.now(timezone.utc).isoformat()
            })

@api_router.post("/demo/setup")
async def setup_demo_data(current_user: dict = Depends(get_current_user)):
    """Create demo café data for existing logged-in user"""
    try:
        await _create_full_demo_data(current_user["user_id"])
        
        return {
            "success": True,
            "message": "Demo café data created successfully!",
            "brand_name": "Urban Brew Café",
            "projects_created": 4,
            "ideas_created": 5,
            "contents_created": 3,
            "campaigns_created": 2
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create demo data: {str(e)}")

@api_router.post("/meta-ads/connect")
async def connect_meta_ads(request: MetaAdsConnectRequest, current_user: dict = Depends(get_current_user)):
    """Store Meta Ads connection details"""
    connection_id = str(uuid.uuid4())
    connection_doc = {
        "id": connection_id,
        "user_id": current_user["user_id"],
        "access_token": request.access_token,
        "instagram_account_id": request.instagram_account_id,
        "facebook_page_id": request.facebook_page_id,
        "connected_at": datetime.now(timezone.utc).isoformat(),
        "status": "active"
    }
    
    # Check if connection exists
    existing = await db.meta_ads_connections.find_one({"user_id": current_user["user_id"]})
    if existing:
        await db.meta_ads_connections.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": connection_doc}
        )
    else:
        await db.meta_ads_connections.insert_one(connection_doc)
    
    return {"success": True, "message": "Meta Ads account connected", "connection_id": connection_id}

@api_router.get("/meta-ads/status")
async def get_meta_ads_status(current_user: dict = Depends(get_current_user)):
    """Check Meta Ads connection status"""
    connection = await db.meta_ads_connections.find_one({"user_id": current_user["user_id"]}, {"_id": 0, "access_token": 0})
    
    if connection:
        return {"connected": True, "connection": connection}
    return {"connected": False}

@api_router.post("/ads/campaign/strategy")
async def create_ad_strategy(request: AdCampaignRequest, current_user: dict = Depends(get_current_user)):
    """AI Performance Marketer - Generate ad campaign strategy"""
    brand = await db.brands.find_one({"id": request.brand_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    brand_context = f"""Café Brand: {brand.get('name')}
Tone: {brand.get('tone')}
Specialties: {brand.get('specialties', 'Coffee and pastries')}"""
    
    strategy_prompt = f"""{brand_context}

Campaign Goal: {request.campaign_goal}
Target Audience: {request.target_audience}
Daily Budget: ${request.daily_budget}
Promotion Type: {request.promotion_type}
Location: {request.location}

As a top Meta Ads performance marketer, create a complete ad campaign strategy including:

1. **Campaign Structure**
   - Campaign name
   - Ad set configuration
   - Budget allocation

2. **Creative Recommendations**
   - Ad headline (5 variations)
   - Primary text/caption
   - Call-to-action
   - Visual concept

3. **Targeting Strategy**
   - Detailed demographics
   - Interests to target
   - Behavior targeting
   - Lookalike audience recommendations

4. **Optimization Tips**
   - Testing recommendations
   - Success metrics to track
   - When to scale

Format clearly with sections."""
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message="You are an expert Meta Ads performance marketer with 10+ years experience. You create high-converting ad campaigns."
    ).with_model("openai", "gpt-5.2")
    
    strategy = await chat.send_message(UserMessage(text=strategy_prompt))
    
    # Store campaign strategy
    campaign_id = str(uuid.uuid4())
    campaign_doc = {
        "id": campaign_id,
        "brand_id": request.brand_id,
        "user_id": current_user["user_id"],
        "campaign_goal": request.campaign_goal,
        "target_audience": request.target_audience,
        "daily_budget": request.daily_budget,
        "promotion_type": request.promotion_type,
        "location": request.location,
        "strategy": strategy,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ad_campaigns.insert_one(campaign_doc)
    
    return {"campaign_id": campaign_id, "strategy": strategy}

@api_router.get("/ads/campaigns")
async def get_ad_campaigns(current_user: dict = Depends(get_current_user)):
    """Get all ad campaigns for user"""
    campaigns = await db.ad_campaigns.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return campaigns

@api_router.post("/ads/campaign/{campaign_id}/launch")
async def launch_ad_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Launch ad campaign (simulated - would integrate with Meta Ads API in production)"""
    campaign = await db.ad_campaigns.find_one({"id": campaign_id, "user_id": current_user["user_id"]})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Update campaign status
    await db.ad_campaigns.update_one(
        {"id": campaign_id},
        {"$set": {
            "status": "active",
            "launched_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "message": "Campaign launched successfully",
        "campaign_id": campaign_id,
        "status": "active"
    }

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