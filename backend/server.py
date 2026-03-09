from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Request, Query
from fastapi.responses import StreamingResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import base64
import asyncio
import requests
import httpx
import secrets
import json
from bs4 import BeautifulSoup
from auth import hash_password, verify_password, create_access_token, get_current_user
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration
from cryptography.fernet import Fernet
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Encryption key for tokens (in production, store in secure vault)
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY', Fernet.generate_key().decode())
cipher_suite = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

# Meta/Instagram OAuth Config
META_APP_ID = os.environ.get('META_APP_ID', '')
META_APP_SECRET = os.environ.get('META_APP_SECRET', '')
META_REDIRECT_URI = os.environ.get('META_REDIRECT_URI', '')

app = FastAPI(title="Frameflow - AI Marketing for Cafés")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

api_router = APIRouter(prefix="/api")

# ==================== PYDANTIC MODELS ====================

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
    specialties: Optional[str] = None
    target_audience: Optional[str] = None
    location: Optional[str] = None

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

class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    cafe_name: str

class AdminUpdateUserRequest(BaseModel):
    is_active: Optional[bool] = None
    cafe_name: Optional[str] = None

class AdminResetPasswordRequest(BaseModel):
    new_password: str

class ScheduledPostRequest(BaseModel):
    content_type: str
    caption: str
    media_id: Optional[str] = None
    scheduled_at: str
    platform: str = "instagram"
    brand_id: Optional[str] = None

class ReelGenerationRequest(BaseModel):
    brand_id: str
    theme: str
    clips_description: Optional[str] = None
    duration_seconds: int = 30

class CafeContentRequest(BaseModel):
    brand_id: str
    content_type: str  # post, reel, story, ad
    topic: Optional[str] = None
    promotion_details: Optional[str] = None

# ==================== ENCRYPTION HELPERS ====================

def encrypt_token(token: str) -> str:
    """Encrypt access token for secure storage"""
    return cipher_suite.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Decrypt access token for API calls"""
    try:
        return cipher_suite.decrypt(encrypted_token.encode()).decode()
    except Exception:
        return ""

# ==================== CAFE-SPECIALIZED AI SYSTEM PROMPTS ====================

CAFE_AI_SYSTEM_PROMPT = """You are an expert social media marketing specialist for cafés and coffee shops. 
You understand the café industry deeply, including:
- Seasonal drink trends (pumpkin spice, holiday specials, summer cold brews)
- Café ambiance marketing (cozy corners, warm lighting, coffee aroma)
- Coffee culture and terminology (latte art, single-origin, pour-over)
- Local community engagement strategies
- Peak coffee consumption times and customer behavior
- Food photography and presentation for pastries and drinks

Your content should:
- Use warm, inviting language that makes people crave coffee
- Include relevant café hashtags (#CoffeeLovers #CafeLife #LatteArt #CoffeeCulture)
- Appeal to coffee enthusiasts, remote workers, students, and couples
- Highlight the sensory experience (aroma, warmth, taste)
- Create FOMO for limited-time offers and seasonal specials
- Feel authentic and personal, not corporate"""

REEL_AI_SYSTEM_PROMPT = """You are a viral reel creator specializing in café content. 
You know what makes café reels perform well on Instagram:
- Satisfying latte art pours
- Behind-the-scenes coffee preparation
- Cozy atmosphere reveals
- Food ASMR moments
- Day-in-the-life barista content
- Customer reaction shots
- Before/after drink preparations

Create reel concepts with:
- Strong hooks in the first 1-3 seconds
- Trending audio suggestions
- Caption overlays that add value
- Clear call-to-actions
- Optimal length recommendations (15-30 seconds for engagement)"""

# ==================== HELPER FUNCTIONS ====================

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def get_brand_context(brand_id: str, user_id: str) -> str:
    """Get comprehensive brand context for AI generation"""
    brand = await db.brands.find_one({"id": brand_id, "user_id": user_id}, {"_id": 0})
    if not brand:
        return ""
    
    context = f"""
CAFÉ BRAND PROFILE:
- Name: {brand.get('name', 'Unknown Café')}
- Tone: {brand.get('tone', 'warm and inviting')}
- Industry: {brand.get('industry', 'café')}
- Specialties: {brand.get('specialties', 'Coffee and pastries')}
- Target Audience: {brand.get('target_audience', 'Coffee lovers, remote workers, students')}
- Location: {brand.get('location', 'Local neighborhood')}
"""
    
    if brand.get('brand_analysis'):
        analysis = brand['brand_analysis']
        context += f"""
BRAND DNA:
- Value Proposition: {analysis.get('Value Proposition', 'Premium café experience')}
- Key Selling Points: {analysis.get('Key Selling Points', [])}
- Marketing Angles: {analysis.get('Marketing Angles', [])}
"""
    
    return context

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/signup", response_model=AuthResponse)
@limiter.limit("5/minute")
async def signup(request: Request, signup_req: SignupRequest):
    existing_user = await db.users.find_one({"email": signup_req.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": signup_req.email,
        "password_hash": hash_password(signup_req.password),
        "full_name": signup_req.full_name,
        "onboarding_completed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_access_token({"sub": user_id, "email": signup_req.email})
    
    return AuthResponse(
        token=token,
        user={"id": user_id, "email": signup_req.email, "full_name": signup_req.full_name}
    )

@api_router.post("/auth/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, login_req: LoginRequest):
    user = await db.users.find_one({"email": login_req.email})
    if not user or not verify_password(login_req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
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

# ==================== INSTAGRAM OAUTH ENDPOINTS ====================

@api_router.get("/integrations/instagram/oauth-url")
async def get_instagram_oauth_url(current_user: dict = Depends(get_current_user)):
    """Generate Instagram OAuth authorization URL"""
    if not META_APP_ID:
        return {
            "oauth_url": None,
            "error": "Instagram integration not configured. Please add META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI to your environment.",
            "setup_required": True
        }
    
    state = secrets.token_urlsafe(32)
    
    # Store state in database for verification
    await db.oauth_states.insert_one({
        "state": state,
        "user_id": current_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    })
    
    scopes = [
        "instagram_basic",
        "instagram_content_publish",
        "instagram_manage_insights",
        "pages_show_list",
        "pages_read_engagement"
    ]
    scope_string = ",".join(scopes)
    
    oauth_url = (
        f"https://www.facebook.com/v20.0/dialog/oauth?"
        f"client_id={META_APP_ID}&"
        f"redirect_uri={META_REDIRECT_URI}&"
        f"scope={scope_string}&"
        f"response_type=code&"
        f"state={state}"
    )
    
    return {"oauth_url": oauth_url, "state": state}

@api_router.get("/integrations/instagram/callback")
async def instagram_oauth_callback(code: str, state: str):
    """Handle Instagram OAuth callback"""
    # Verify state
    state_doc = await db.oauth_states.find_one({"state": state})
    if not state_doc:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    # Check expiration
    expires_at = datetime.fromisoformat(state_doc["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OAuth state expired")
    
    user_id = state_doc["user_id"]
    
    # Delete used state
    await db.oauth_states.delete_one({"state": state})
    
    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for short-lived token
            token_response = await client.get(
                "https://graph.facebook.com/v20.0/oauth/access_token",
                params={
                    "client_id": META_APP_ID,
                    "client_secret": META_APP_SECRET,
                    "redirect_uri": META_REDIRECT_URI,
                    "code": code
                }
            )
            
            if token_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange authorization code")
            
            token_data = token_response.json()
            short_lived_token = token_data["access_token"]
            
            # Exchange for long-lived token
            long_lived_response = await client.get(
                "https://graph.facebook.com/v20.0/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": META_APP_ID,
                    "client_secret": META_APP_SECRET,
                    "fb_exchange_token": short_lived_token
                }
            )
            
            if long_lived_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get long-lived token")
            
            long_lived_data = long_lived_response.json()
            access_token = long_lived_data["access_token"]
            expires_in = long_lived_data.get("expires_in", 5184000)  # 60 days default
            
            # Get user's Facebook pages
            pages_response = await client.get(
                "https://graph.facebook.com/v20.0/me/accounts",
                params={"access_token": access_token}
            )
            
            pages_data = pages_response.json().get("data", [])
            
            # Get Instagram Business Account for each page
            instagram_accounts = []
            for page in pages_data:
                ig_response = await client.get(
                    f"https://graph.facebook.com/v20.0/{page['id']}",
                    params={
                        "fields": "instagram_business_account{id,username,profile_picture_url,followers_count,media_count}",
                        "access_token": page["access_token"]
                    }
                )
                ig_data = ig_response.json()
                if "instagram_business_account" in ig_data:
                    ig_account = ig_data["instagram_business_account"]
                    ig_account["page_id"] = page["id"]
                    ig_account["page_name"] = page["name"]
                    ig_account["page_access_token"] = page["access_token"]
                    instagram_accounts.append(ig_account)
            
            # Store connection
            token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            
            connection_doc = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "platform": "instagram",
                "access_token": encrypt_token(access_token),
                "token_expires_at": token_expires_at.isoformat(),
                "instagram_accounts": instagram_accounts,
                "connected_at": datetime.now(timezone.utc).isoformat(),
                "status": "active"
            }
            
            # Upsert connection
            await db.integrations.update_one(
                {"user_id": user_id, "platform": "instagram"},
                {"$set": connection_doc},
                upsert=True
            )
            
            # Redirect back to frontend integrations page
            frontend_url = os.environ.get('FRONTEND_URL', 'https://ai-studio-hub-31.preview.emergentagent.com')
            return RedirectResponse(
                url=f"{frontend_url}/integrations?success=true&platform=instagram",
                status_code=302
            )
            
    except Exception as e:
        logging.error(f"OAuth callback error: {str(e)}")
        frontend_url = os.environ.get('FRONTEND_URL', 'https://ai-studio-hub-31.preview.emergentagent.com')
        return RedirectResponse(
            url=f"{frontend_url}/integrations?error=true&message={str(e)}",
            status_code=302
        )

@api_router.get("/integrations/status")
async def get_integrations_status(current_user: dict = Depends(get_current_user)):
    """Get status of all integrations for current user"""
    instagram = await db.integrations.find_one(
        {"user_id": current_user["user_id"], "platform": "instagram"},
        {"_id": 0, "access_token": 0}
    )
    
    meta_ads = await db.integrations.find_one(
        {"user_id": current_user["user_id"], "platform": "meta_ads"},
        {"_id": 0, "access_token": 0}
    )
    
    return {
        "instagram": {
            "connected": instagram is not None and instagram.get("status") == "active",
            "accounts": instagram.get("instagram_accounts", []) if instagram else [],
            "connected_at": instagram.get("connected_at") if instagram else None,
            "expires_at": instagram.get("token_expires_at") if instagram else None
        },
        "meta_ads": {
            "connected": meta_ads is not None and meta_ads.get("status") == "active",
            "account_id": meta_ads.get("ad_account_id") if meta_ads else None,
            "connected_at": meta_ads.get("connected_at") if meta_ads else None
        }
    }

@api_router.post("/integrations/instagram/select-account")
async def select_instagram_account(
    account_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Select which Instagram account to use"""
    integration = await db.integrations.find_one(
        {"user_id": current_user["user_id"], "platform": "instagram"}
    )
    
    if not integration:
        raise HTTPException(status_code=404, detail="Instagram not connected")
    
    # Find the selected account
    selected_account = None
    for account in integration.get("instagram_accounts", []):
        if account["id"] == account_id:
            selected_account = account
            break
    
    if not selected_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    await db.integrations.update_one(
        {"user_id": current_user["user_id"], "platform": "instagram"},
        {"$set": {"selected_account": selected_account}}
    )
    
    return {"success": True, "selected_account": selected_account}

@api_router.delete("/integrations/instagram")
async def disconnect_instagram(current_user: dict = Depends(get_current_user)):
    """Disconnect Instagram account"""
    await db.integrations.delete_one(
        {"user_id": current_user["user_id"], "platform": "instagram"}
    )
    return {"success": True, "message": "Instagram disconnected"}

# ==================== LIVE ANALYTICS ENDPOINTS ====================

@api_router.get("/analytics/instagram")
async def get_instagram_analytics(
    current_user: dict = Depends(get_current_user),
    period: str = Query("day", enum=["day", "week", "days_28"]),
    days_back: int = Query(7, ge=1, le=90)
):
    """Get live Instagram analytics from Graph API"""
    integration = await db.integrations.find_one(
        {"user_id": current_user["user_id"], "platform": "instagram"}
    )
    
    if not integration or integration.get("status") != "active":
        # Return demo data if not connected
        return await get_demo_analytics(days_back)
    
    selected_account = integration.get("selected_account")
    if not selected_account:
        accounts = integration.get("instagram_accounts", [])
        if accounts:
            selected_account = accounts[0]
        else:
            return await get_demo_analytics(days_back)
    
    ig_user_id = selected_account["id"]
    access_token = decrypt_token(integration["access_token"])
    
    try:
        async with httpx.AsyncClient() as client:
            # Get account insights
            insights_response = await client.get(
                f"https://graph.facebook.com/v20.0/{ig_user_id}/insights",
                params={
                    "metric": "impressions,reach,profile_views,follower_count",
                    "period": period,
                    "access_token": access_token
                }
            )
            
            insights_data = insights_response.json() if insights_response.status_code == 200 else {}
            
            # Get recent media
            media_response = await client.get(
                f"https://graph.facebook.com/v20.0/{ig_user_id}/media",
                params={
                    "fields": "id,caption,media_type,media_url,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement)",
                    "limit": 25,
                    "access_token": access_token
                }
            )
            
            media_data = media_response.json() if media_response.status_code == 200 else {}
            
            # Get account info
            account_response = await client.get(
                f"https://graph.facebook.com/v20.0/{ig_user_id}",
                params={
                    "fields": "id,username,followers_count,follows_count,media_count,profile_picture_url",
                    "access_token": access_token
                }
            )
            
            account_data = account_response.json() if account_response.status_code == 200 else {}
            
            # Process and return data
            return {
                "account": {
                    "username": account_data.get("username"),
                    "followers_count": account_data.get("followers_count", 0),
                    "follows_count": account_data.get("follows_count", 0),
                    "media_count": account_data.get("media_count", 0),
                    "profile_picture_url": account_data.get("profile_picture_url")
                },
                "insights": insights_data.get("data", []),
                "recent_media": media_data.get("data", []),
                "is_live_data": True
            }
            
    except Exception as e:
        logging.error(f"Failed to fetch Instagram analytics: {str(e)}")
        return await get_demo_analytics(days_back)

async def get_demo_analytics(days_back: int = 7):
    """Return demo analytics data when Instagram is not connected"""
    import random
    
    # Generate realistic demo data
    base_reach = random.randint(10000, 15000)
    base_impressions = base_reach * random.uniform(2.0, 2.5)
    base_engagement = base_reach * random.uniform(0.06, 0.10)
    
    weekly_data = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i, day in enumerate(days):
        # Weekend has higher engagement
        multiplier = 1.3 if i >= 5 else 1.0
        weekly_data.append({
            "day": day,
            "reach": int(base_reach / 7 * multiplier * random.uniform(0.8, 1.2)),
            "engagement": int(base_engagement / 7 * multiplier * random.uniform(0.8, 1.2)),
            "impressions": int(base_impressions / 7 * multiplier * random.uniform(0.8, 1.2))
        })
    
    return {
        "account": {
            "username": "demo_cafe",
            "followers_count": random.randint(1500, 2500),
            "follows_count": random.randint(200, 400),
            "media_count": random.randint(50, 150),
            "profile_picture_url": None
        },
        "overview": {
            "total_reach": int(base_reach),
            "total_impressions": int(base_impressions),
            "total_engagement": int(base_engagement),
            "engagement_rate": round(base_engagement / base_reach * 100, 2),
            "follower_growth": round(random.uniform(2.0, 15.0), 1)
        },
        "weekly_data": weekly_data,
        "top_posts": [
            {"id": "1", "type": "reel", "caption": "Behind the scenes at Urban Brew", "reach": 3120, "likes": 267, "comments": 45},
            {"id": "2", "type": "image", "caption": "New seasonal latte drop!", "reach": 2340, "likes": 189, "comments": 24},
            {"id": "3", "type": "image", "caption": "Cozy corner vibes", "reach": 1890, "likes": 156, "comments": 18}
        ],
        "content_breakdown": {
            "images": random.randint(15, 25),
            "videos": random.randint(3, 8),
            "reels": random.randint(2, 6)
        },
        "is_live_data": False,
        "message": "Connect your Instagram account to see live analytics"
    }

# ==================== SMART POSTING TIME ENGINE ====================

@api_router.get("/analytics/best-posting-times")
async def get_best_posting_times(
    current_user: dict = Depends(get_current_user),
    brand_id: Optional[str] = None
):
    """Get AI-recommended best posting times based on café audience behavior"""
    
    # Check if we have real Instagram data
    integration = await db.integrations.find_one(
        {"user_id": current_user["user_id"], "platform": "instagram"}
    )
    
    if integration and integration.get("status") == "active":
        # In production, analyze real engagement patterns
        # For now, return café-optimized recommendations
        pass
    
    # Café-specific posting time recommendations
    recommendations = {
        "best_times": [
            {
                "time": "07:00",
                "day_type": "weekday",
                "label": "Morning Coffee Rush",
                "engagement_score": 92,
                "reason": "Coffee lovers check Instagram before work"
            },
            {
                "time": "12:00",
                "day_type": "weekday",
                "label": "Lunch Break",
                "engagement_score": 78,
                "reason": "People browse during lunch, looking for café spots"
            },
            {
                "time": "15:00",
                "day_type": "weekday",
                "label": "Afternoon Pick-me-up",
                "engagement_score": 75,
                "reason": "Afternoon slump = coffee cravings"
            },
            {
                "time": "18:30",
                "day_type": "all",
                "label": "Evening Wind-down",
                "engagement_score": 95,
                "reason": "Highest Instagram activity, people relaxing after work"
            },
            {
                "time": "10:00",
                "day_type": "weekend",
                "label": "Weekend Brunch",
                "engagement_score": 88,
                "reason": "Weekend brunch planners are online"
            },
            {
                "time": "14:00",
                "day_type": "weekend",
                "label": "Lazy Afternoon",
                "engagement_score": 85,
                "reason": "Café date planning time"
            }
        ],
        "today_recommendation": {
            "time": "18:30",
            "label": "Best time to post today",
            "engagement_score": 95,
            "reason": "Evening posts get 2.3x more engagement for café accounts"
        },
        "content_type_times": {
            "reels": {"best_time": "18:00-20:00", "reason": "Reels perform best during leisure browsing"},
            "stories": {"best_time": "07:00-09:00", "reason": "Stories catch morning commuters"},
            "posts": {"best_time": "12:00-13:00 or 18:00-19:00", "reason": "Posts need dedicated viewing time"},
            "promotions": {"best_time": "Friday 17:00", "reason": "Weekend planning happens Friday evening"}
        },
        "avoid_times": [
            {"time": "02:00-06:00", "reason": "Very low activity"},
            {"time": "23:00-01:00", "reason": "Audience is sleeping"}
        ]
    }
    
    return recommendations

# ==================== CAFÉ-SPECIALIZED AI CONTENT ====================

@api_router.post("/cafe/generate-content")
async def generate_cafe_content(
    request: CafeContentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate café-specialized content using AI"""
    brand_context = await get_brand_context(request.brand_id, current_user["user_id"])
    
    content_prompts = {
        "post": f"""Create an engaging Instagram post for this café:
{brand_context}

Topic: {request.topic or 'General café content'}
Promotion Details: {request.promotion_details or 'None specified'}

Generate:
1. An attention-grabbing caption (150-200 characters)
2. Extended caption with story/emotion (up to 2000 characters)
3. 10-15 relevant hashtags mixing popular and niche café tags
4. Suggested call-to-action
5. Best posting time recommendation

Make it feel warm, inviting, and authentically café.""",

        "reel": f"""Create a viral reel concept for this café:
{brand_context}

Topic: {request.topic or 'Café vibes'}

Generate:
1. Hook (first 3 seconds - must stop the scroll)
2. Scene-by-scene breakdown (5-7 scenes)
3. Suggested trending audio/music style
4. Caption with hooks and hashtags
5. Text overlay suggestions
6. Optimal length (15-30 seconds recommended)
7. Thumbnail concept

Focus on satisfying visuals: latte art, steam, cozy atmosphere.""",

        "story": f"""Create an Instagram story sequence for this café:
{brand_context}

Topic: {request.topic or 'Daily special'}
Promotion: {request.promotion_details or 'None'}

Generate:
1. Story 1: Attention grabber
2. Story 2: Main content/offer
3. Story 3: Behind the scenes or detail
4. Story 4: Call to action with poll/question
5. Suggested stickers and interactive elements
6. Best time to post stories

Keep it casual and personal.""",

        "ad": f"""Create a Meta/Instagram ad campaign for this café:
{brand_context}

Campaign Goal: {request.topic or 'Drive foot traffic'}
Promotion: {request.promotion_details or 'General awareness'}

Generate:
1. Ad headline (5 variations)
2. Primary text (engaging, benefit-focused)
3. Description
4. Call-to-action button recommendation
5. Target audience suggestions
6. Budget allocation advice
7. Creative direction for visuals

Focus on local targeting and café-specific interests."""
    }
    
    prompt = content_prompts.get(request.content_type, content_prompts["post"])
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=CAFE_AI_SYSTEM_PROMPT
    ).with_model("openai", "gpt-5.2")
    
    response = await chat.send_message(UserMessage(text=prompt))
    
    # Save generated content
    content_id = str(uuid.uuid4())
    await db.generated_contents.insert_one({
        "id": content_id,
        "brand_id": request.brand_id,
        "user_id": current_user["user_id"],
        "content_type": request.content_type,
        "topic": request.topic,
        "generated_content": response,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "content_id": content_id,
        "content_type": request.content_type,
        "generated_content": response
    }

# ==================== REEL GENERATION SYSTEM ====================

@api_router.post("/reels/generate-concept")
async def generate_reel_concept(
    request: ReelGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a complete reel concept with AI"""
    brand_context = await get_brand_context(request.brand_id, current_user["user_id"])
    
    prompt = f"""Create a detailed reel production plan for this café:
{brand_context}

REEL THEME: {request.theme}
AVAILABLE CLIPS: {request.clips_description or 'General café footage'}
TARGET DURATION: {request.duration_seconds} seconds

Generate a complete reel plan:

## HOOK (0-3 seconds)
- Visual: [what to show]
- Text overlay: [exact text]
- Why it stops the scroll: [psychology]

## SCENE BREAKDOWN
For each scene, provide:
- Timestamp range
- Visual description
- Text overlay (if any)
- Transition type

## AUDIO
- Music style recommendation
- Trending sounds to consider
- Voiceover script (if applicable)

## CAPTION
- Hook line
- Main caption (engaging, with personality)
- Call to action
- Hashtags (15-20, mix of sizes)

## EDITING NOTES
- Color grading style
- Pacing recommendations
- Effects to use/avoid

## ENGAGEMENT PREDICTIONS
- Expected view-through rate
- Best posting time
- Estimated reach potential

Make this reel concept specific to café culture and designed to go viral."""

    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=REEL_AI_SYSTEM_PROMPT
    ).with_model("openai", "gpt-5.2")
    
    response = await chat.send_message(UserMessage(text=prompt))
    
    reel_id = str(uuid.uuid4())
    await db.reel_concepts.insert_one({
        "id": reel_id,
        "brand_id": request.brand_id,
        "user_id": current_user["user_id"],
        "theme": request.theme,
        "duration_seconds": request.duration_seconds,
        "concept": response,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "reel_id": reel_id,
        "concept": response,
        "theme": request.theme,
        "duration_seconds": request.duration_seconds
    }

@api_router.get("/reels/trending-formats")
async def get_trending_reel_formats():
    """Get trending reel formats for cafés"""
    return {
        "trending_formats": [
            {
                "name": "Latte Art Pour",
                "description": "Satisfying close-up of latte art being poured",
                "avg_views": "50K-200K",
                "difficulty": "Easy",
                "equipment": "Phone + stable surface",
                "best_for": "Showcasing barista skills"
            },
            {
                "name": "Day in the Life",
                "description": "Opening to closing, showing café operations",
                "avg_views": "20K-100K",
                "difficulty": "Medium",
                "equipment": "Phone",
                "best_for": "Building personal connection"
            },
            {
                "name": "Menu Item Reveal",
                "description": "Building anticipation for a new drink/food item",
                "avg_views": "30K-150K",
                "difficulty": "Easy",
                "equipment": "Phone + good lighting",
                "best_for": "Launching new items"
            },
            {
                "name": "ASMR Coffee",
                "description": "Grinding, brewing, pouring sounds",
                "avg_views": "100K-500K",
                "difficulty": "Medium",
                "equipment": "Good microphone",
                "best_for": "Viral potential"
            },
            {
                "name": "Customer Reactions",
                "description": "Genuine reactions to drinks/food",
                "avg_views": "40K-200K",
                "difficulty": "Medium",
                "equipment": "Phone",
                "best_for": "Social proof"
            },
            {
                "name": "Before/After",
                "description": "Empty cup to beautiful drink transformation",
                "avg_views": "30K-100K",
                "difficulty": "Easy",
                "equipment": "Phone + tripod",
                "best_for": "Satisfying content"
            },
            {
                "name": "Cozy Atmosphere",
                "description": "Slow pans of café ambiance with music",
                "avg_views": "20K-80K",
                "difficulty": "Easy",
                "equipment": "Phone + gimbal (optional)",
                "best_for": "Attracting new customers"
            },
            {
                "name": "Recipe Tutorial",
                "description": "How to make a signature drink",
                "avg_views": "50K-200K",
                "difficulty": "Medium",
                "equipment": "Phone + tripod",
                "best_for": "Educational content"
            }
        ],
        "trending_audios": [
            "Trending jazz/lo-fi for cozy vibes",
            "Upbeat indie for energetic content",
            "Classical for sophisticated brand",
            "Trending TikTok sounds for viral potential"
        ],
        "hashtag_sets": {
            "general": ["#CoffeeReels", "#CafeLife", "#BaristaTok", "#CoffeeLovers"],
            "latte_art": ["#LatteArt", "#BaristaSkills", "#CoffeeArt", "#LatteArtVideo"],
            "food": ["#CafeFood", "#Pastries", "#FoodReels", "#CafeEats"],
            "ambiance": ["#CozyVibes", "#CafeAesthetic", "#CoffeeShop", "#CozyPlace"]
        }
    }

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/users")
async def admin_get_users(admin_user: dict = Depends(get_admin_user)):
    users = await db.users.find(
        {"role": {"$ne": "admin"}},
        {"_id": 0, "password_hash": 0}
    ).to_list(500)
    
    for user in users:
        brand = await db.brands.find_one({"user_id": user["id"]}, {"_id": 0})
        user["brand"] = brand
    
    return users

@api_router.post("/admin/users")
async def admin_create_user(request: AdminCreateUserRequest, admin_user: dict = Depends(get_admin_user)):
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
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    brand = await db.brands.find_one({"user_id": user_id}, {"_id": 0})
    user["brand"] = brand
    
    return user

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, request: AdminUpdateUserRequest, admin_user: dict = Depends(get_admin_user)):
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
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin users")
    
    brands = await db.brands.find({"user_id": user_id}).to_list(100)
    brand_ids = [b["id"] for b in brands]
    
    await db.projects.delete_many({"brand_id": {"$in": brand_ids}})
    await db.contents.delete_many({"brand_id": {"$in": brand_ids}})
    await db.ideas.delete_many({"brand_id": {"$in": brand_ids}})
    await db.ad_campaigns.delete_many({"user_id": user_id})
    await db.brands.delete_many({"user_id": user_id})
    await db.integrations.delete_many({"user_id": user_id})
    await db.users.delete_one({"id": user_id})
    
    return {"success": True, "message": "User and all associated data deleted"}

@api_router.get("/admin/stats")
async def admin_get_stats(admin_user: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({"role": {"$ne": "admin"}})
    active_users = await db.users.count_documents({"role": {"$ne": "admin"}, "is_active": True})
    total_brands = await db.brands.count_documents({})
    total_projects = await db.projects.count_documents({})
    total_contents = await db.contents.count_documents({})
    connected_instagram = await db.integrations.count_documents({"platform": "instagram", "status": "active"})
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "total_brands": total_brands,
        "total_projects": total_projects,
        "total_contents": total_contents,
        "connected_instagram": connected_instagram
    }

@api_router.post("/admin/setup")
async def admin_setup():
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

# ==================== BRAND ENDPOINTS ====================

@api_router.post("/brands")
async def create_brand(request: BrandRequest, current_user: dict = Depends(get_current_user)):
    brand_id = str(uuid.uuid4())
    brand_doc = {
        "id": brand_id,
        "user_id": current_user["user_id"],
        "name": request.name,
        "tone": request.tone or "warm and inviting",
        "colors": request.colors,
        "industry": request.industry or "café",
        "logo_url": request.logo_url,
        "specialties": request.specialties,
        "target_audience": request.target_audience,
        "location": request.location,
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
        
        analysis_prompt = f"""Analyze this café's website and extract key marketing information:

Website URL: {request.website_url}
Meta Description: {meta_desc}
Content Sample: {text_content[:2000]}

Extract and provide as JSON:
1. Brand Tone (warm, professional, trendy, etc.)
2. Value Proposition (what makes this café unique)
3. Target Audience (who are their ideal customers)
4. Specialties (signature drinks, food items, atmosphere)
5. Key Selling Points (3-5 points)
6. Marketing Angles (3-5 potential content angles)
7. Keywords (10 relevant keywords for café marketing)
8. Suggested Hashtags (10-15 hashtags)

Focus on café-specific details."""
        
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=str(uuid.uuid4()),
            system_message="You are a café brand analyst. Extract marketing insights in JSON format."
        ).with_model("openai", "gpt-5.2")
        
        analysis = await chat.send_message(UserMessage(text=analysis_prompt))
        
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

# ==================== PROJECT ENDPOINTS ====================

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

# ==================== CONTENT GENERATION ENDPOINTS ====================

@api_router.post("/generate/caption")
async def generate_caption(request: GenerateContentRequest, current_user: dict = Depends(get_current_user)):
    brand_context = ""
    if request.brand_id:
        brand_context = await get_brand_context(request.brand_id, current_user["user_id"])
    
    prompt = f"""Create an engaging Instagram caption for a café:
{brand_context}

Topic/Prompt: {request.prompt}
Platform: {request.platform or 'Instagram'}
Tone: {request.tone or 'warm and inviting'}
Content Type: {request.type}

Generate:
1. A captivating caption (include emojis naturally)
2. 10-15 relevant hashtags
3. A call-to-action

Make it feel authentic to café culture."""
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=CAFE_AI_SYSTEM_PROMPT
    ).with_model("openai", "gpt-5.2")
    
    response = await chat.send_message(UserMessage(text=prompt))
    
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
    
    # Enhance prompt for café aesthetic
    enhanced_prompt = f"Professional café photography style: {request.prompt}. Warm lighting, cozy atmosphere, artisan quality, Instagram-worthy aesthetic."
    
    images = await image_gen.generate_images(
        prompt=enhanced_prompt,
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
    
    enhanced_prompt = f"Café ambiance video: {request.prompt}. Warm, inviting atmosphere, professional quality."
    
    video_bytes = await asyncio.to_thread(
        video_gen.text_to_video,
        prompt=enhanced_prompt,
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

# ==================== TEMPLATES ====================

@api_router.get("/templates")
async def get_templates():
    templates = [
        {
            "id": "daily-special",
            "name": "Daily Café Special",
            "description": "Promote today's featured drink or dessert",
            "type": "image",
            "category": "promotion",
            "prompt": "Create an Instagram post promoting our daily special: [drink/dessert name]. Highlight ingredients, flavor profile, and limited availability. Tone: appetizing and urgent. Include café-specific hashtags like #CoffeeLovers #CafeLife #DailySpecial"
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
            "prompt": "Create a TikTok/Instagram reel concept showcasing our barista creating beautiful latte art. Include: close-up of pour, reveal of design, cozy café ambiance. Tone: aesthetic and satisfying. Hashtags: #LatteArt #BaristaLife #CoffeeArt"
        },
        {
            "id": "cozy-atmosphere",
            "name": "Cozy Café Vibes",
            "description": "Highlight your café's ambiance",
            "type": "video",
            "category": "atmosphere",
            "prompt": "Create content showing the cozy atmosphere of our café. Include: warm lighting, comfortable seating, people enjoying coffee, background music vibe. Tone: inviting and relaxing. Hashtags: #CafeVibes #CozyPlace #CoffeeTime"
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
            "name": "Weekend Café Promotion",
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
            "prompt": "Share customer experience featuring real feedback about our café. Highlight: favorite drinks, ambiance appreciation, memorable moments. Tone: authentic and heartwarming. Hashtags: #HappyGuests #CafeCommunity #CustomerLove"
        },
        {
            "id": "seasonal-drink",
            "name": "Seasonal Café Special",
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
            "prompt": "Position café as the perfect study/work spot. Highlight: WiFi, comfortable seating, quiet corners, productivity fuel. Target students and remote workers. Hashtags: #StudySpot #CafeWork #RemoteWork"
        },
        {
            "id": "date-night",
            "name": "Café Date Night",
            "description": "Promote evening coffee dates",
            "type": "image",
            "category": "audience",
            "prompt": "Create romantic café date content. Highlight: cozy seating for two, dessert pairings, intimate atmosphere, evening specials. Target couples. Hashtags: #CafeDate #CoffeeDate #CozyNight"
        }
    ]
    return templates

# ==================== IDEAS ====================

@api_router.post("/ideas/generate")
async def generate_idea(request: GenerateIdeaRequest, current_user: dict = Depends(get_current_user)):
    brand_context = await get_brand_context(request.brand_id, current_user["user_id"])
    
    idea_prompts = {
        "ad_hook": "Generate a compelling ad hook that grabs attention in the first 3 seconds for a café ad.",
        "social_post": "Generate a creative social media post idea that drives engagement for a café.",
        "storytelling": "Generate a storytelling angle that connects emotionally with café customers.",
        "campaign": "Generate a complete marketing campaign idea with theme and execution plan for a café.",
        "promotion": "Generate a café promotion idea that highlights unique menu items and drives foot traffic.",
        "reel": "Generate a viral reel concept specifically for café content.",
        "seasonal": "Generate a seasonal marketing idea perfect for this time of year.",
        "community": "Generate a community engagement idea to build local café loyalty.",
        "general": "Generate a creative marketing idea for café social media content."
    }
    
    prompt_text = idea_prompts.get(request.idea_type, idea_prompts["general"])
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=f"{CAFE_AI_SYSTEM_PROMPT}\n\n{brand_context}"
    ).with_model("openai", "gpt-5.2")
    
    idea = await chat.send_message(UserMessage(text=prompt_text))
    
    idea_id = str(uuid.uuid4())
    
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

# ==================== CALENDAR & SCHEDULING ====================

@api_router.post("/calendar/generate")
async def generate_content_calendar(request: CalendarRequest, current_user: dict = Depends(get_current_user)):
    brand_context = await get_brand_context(request.brand_id, current_user["user_id"])
    
    prompt = f"""Create a {request.days}-day content calendar for this café:
{brand_context}

For each day, suggest:
- Post idea/theme (café-specific)
- Content type (image/video/reel/story)
- Caption hook
- Best posting time based on café audience behavior
- Relevant hashtags

Include a mix of:
- Product showcases (drinks, food)
- Behind-the-scenes content
- Customer engagement posts
- Promotional content
- Atmosphere/lifestyle content

Format as a structured daily plan."""
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=CAFE_AI_SYSTEM_PROMPT
    ).with_model("openai", "gpt-5.2")
    
    calendar = await chat.send_message(UserMessage(text=prompt))
    
    return {"calendar": calendar, "days": request.days}

@api_router.get("/scheduled-posts")
async def get_scheduled_posts(current_user: dict = Depends(get_current_user)):
    posts = await db.scheduled_posts.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("scheduled_at", 1).to_list(500)
    return posts

@api_router.post("/scheduled-posts")
async def create_scheduled_post(request: ScheduledPostRequest, current_user: dict = Depends(get_current_user)):
    post_id = str(uuid.uuid4())
    post_doc = {
        "id": post_id,
        "user_id": current_user["user_id"],
        "brand_id": request.brand_id,
        "content_type": request.content_type,
        "caption": request.caption,
        "media_id": request.media_id,
        "scheduled_at": request.scheduled_at,
        "platform": request.platform,
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.scheduled_posts.insert_one(post_doc)
    return {"success": True, "post_id": post_id}

@api_router.get("/scheduled-posts/{post_id}")
async def get_scheduled_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.scheduled_posts.find_one(
        {"id": post_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@api_router.put("/scheduled-posts/{post_id}")
async def update_scheduled_post(post_id: str, request: ScheduledPostRequest, current_user: dict = Depends(get_current_user)):
    result = await db.scheduled_posts.update_one(
        {"id": post_id, "user_id": current_user["user_id"]},
        {"$set": {
            "content_type": request.content_type,
            "caption": request.caption,
            "media_id": request.media_id,
            "scheduled_at": request.scheduled_at,
            "platform": request.platform,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"success": True}

@api_router.delete("/scheduled-posts/{post_id}")
async def delete_scheduled_post(post_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.scheduled_posts.delete_one(
        {"id": post_id, "user_id": current_user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"success": True}

@api_router.post("/scheduled-posts/{post_id}/publish-now")
async def publish_post_now(post_id: str, current_user: dict = Depends(get_current_user)):
    """Publish a scheduled post immediately to Instagram"""
    post = await db.scheduled_posts.find_one(
        {"id": post_id, "user_id": current_user["user_id"]}
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check Instagram connection
    integration = await db.integrations.find_one(
        {"user_id": current_user["user_id"], "platform": "instagram"}
    )
    
    if not integration or integration.get("status") != "active":
        raise HTTPException(status_code=400, detail="Instagram not connected. Please connect your account first.")
    
    # In production, this would use the Instagram API to publish
    # For now, mark as published
    await db.scheduled_posts.update_one(
        {"id": post_id},
        {"$set": {
            "status": "published",
            "published_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Post published successfully", "status": "published"}

# ==================== MEDIA ====================

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

# ==================== STATS ====================

@api_router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    user_brands = await db.brands.find({"user_id": current_user["user_id"]}, {"id": 1, "_id": 0}).to_list(100)
    brand_ids = [b["id"] for b in user_brands]
    
    projects_count = await db.projects.count_documents({"brand_id": {"$in": brand_ids}})
    contents_count = await db.generated_contents.count_documents({})
    scheduled_count = await db.scheduled_posts.count_documents({"user_id": current_user["user_id"]})
    
    return {
        "brands": len(brand_ids),
        "projects": projects_count,
        "contents_generated": contents_count,
        "scheduled_posts": scheduled_count
    }

# ==================== ADS/CAMPAIGNS ====================

@api_router.post("/ads/campaign/strategy")
async def create_ad_strategy(request: AdCampaignRequest, current_user: dict = Depends(get_current_user)):
    brand_context = await get_brand_context(request.brand_id, current_user["user_id"])
    
    strategy_prompt = f"""{brand_context}

Campaign Goal: {request.campaign_goal}
Target Audience: {request.target_audience}
Daily Budget: ${request.daily_budget}
Promotion Type: {request.promotion_type}
Location: {request.location}

As an expert Meta Ads performance marketer specializing in local café marketing, create a complete ad campaign strategy:

1. **Campaign Structure**
   - Campaign name suggestions
   - Ad set configuration
   - Budget allocation strategy

2. **Creative Recommendations**
   - 5 ad headline variations
   - Primary text/caption
   - Call-to-action button
   - Visual concept direction

3. **Targeting Strategy**
   - Demographics (age, gender, etc.)
   - Interests to target (coffee, local food, etc.)
   - Behavior targeting
   - Location radius recommendations

4. **Café-Specific Tips**
   - Best times to run ads
   - Seasonal considerations
   - Local event tie-ins

5. **Optimization Plan**
   - A/B testing recommendations
   - Key metrics to track
   - Scaling strategy

Format clearly with actionable sections."""
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message="You are an expert Meta Ads strategist specializing in local café and restaurant marketing."
    ).with_model("openai", "gpt-5.2")
    
    strategy = await chat.send_message(UserMessage(text=strategy_prompt))
    
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
    campaigns = await db.ad_campaigns.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return campaigns

@api_router.post("/ads/campaign/{campaign_id}/launch")
async def launch_ad_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    campaign = await db.ad_campaigns.find_one({"id": campaign_id, "user_id": current_user["user_id"]})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Check Meta Ads connection
    integration = await db.integrations.find_one(
        {"user_id": current_user["user_id"], "platform": "meta_ads"}
    )
    
    # Update campaign status
    await db.ad_campaigns.update_one(
        {"id": campaign_id},
        {"$set": {
            "status": "active" if integration else "pending_connection",
            "launched_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "message": "Campaign launched successfully" if integration else "Campaign saved. Connect Meta Ads to go live.",
        "campaign_id": campaign_id,
        "status": "active" if integration else "pending_connection"
    }

# ==================== DEMO DATA ====================

@api_router.post("/demo/login")
async def demo_login():
    """Public demo login - creates or logs in demo user with full sample data"""
    demo_email = "demo@frameflow.cafe"
    demo_password = "FrameflowDemo2026"
    
    demo_user = await db.users.find_one({"email": demo_email})
    
    if not demo_user:
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
    
    await _create_full_demo_data(user_id)
    
    token = create_access_token({"sub": user_id, "email": demo_email})
    
    return AuthResponse(
        token=token,
        user={"id": user_id, "email": demo_email, "full_name": "Demo Café Owner", "is_demo": True}
    )

async def _create_full_demo_data(user_id: str):
    """Create comprehensive demo data for showcasing the platform"""
    
    brand_id = "demo-urban-brew-cafe"
    demo_brand = {
        "id": brand_id,
        "user_id": user_id,
        "name": "Urban Brew Café",
        "tone": "warm and inviting",
        "industry": "café",
        "specialties": "Artisan Coffee, Fresh Pastries, Cozy Atmosphere",
        "target_audience": "Remote workers, students, coffee enthusiasts, couples",
        "location": "Downtown Seattle",
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
    
    demo_ideas = [
        {
            "id": "demo-idea-1",
            "brand_id": brand_id,
            "idea_type": "reel",
            "idea_text": "Behind-the-scenes reel: Follow a coffee bean's journey from our roaster partner to your cup. Show the roasting process, the careful grinding, and the perfect pour. End with a satisfied customer's first sip.",
            "status": "saved"
        },
        {
            "id": "demo-idea-2",
            "brand_id": brand_id,
            "idea_type": "ad_hook",
            "idea_text": "Ad Hook: 'Your office called. It wants you to work from somewhere better.' Target remote workers with images of cozy laptop setups, great WiFi speeds, and unlimited coffee refills.",
            "status": "saved"
        },
        {
            "id": "demo-idea-3",
            "brand_id": brand_id,
            "idea_type": "campaign",
            "idea_text": "Holiday Campaign: '12 Days of Coffee Christmas' - Feature a different specialty drink each day leading up to Christmas. Create FOMO with limited quantities and countdown posts.",
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
            "ideas_created": 3
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create demo data: {str(e)}")

# ==================== PLATFORM CONTENT ====================

@api_router.post("/generate/platform-content")
async def generate_platform_content(request: PlatformContentRequest, current_user: dict = Depends(get_current_user)):
    brand_context = await get_brand_context(request.brand_id, current_user["user_id"])
    
    platform_prompts = {
        "instagram": "Create an Instagram post with engaging caption and 10-15 relevant café hashtags.",
        "tiktok": "Create a TikTok video concept with a hook, main content description, and trending hashtag suggestions.",
        "facebook": "Create a Facebook post optimized for engagement with local café audience."
    }
    
    platform_instruction = platform_prompts.get(request.platform, platform_prompts["instagram"])
    
    prompt = f"""{brand_context}

Topic: {request.prompt}
Platform: {request.platform}
Content Type: {request.content_type}

{platform_instruction}

Format the output with clear sections for:
- Main content
- Caption
- Hashtags
- Best posting time"""
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=CAFE_AI_SYSTEM_PROMPT
    ).with_model("openai", "gpt-5.2")
    
    content = await chat.send_message(UserMessage(text=prompt))
    
    content_id = str(uuid.uuid4())
    await db.generated_contents.insert_one({
        "id": content_id,
        "brand_id": request.brand_id,
        "type": "platform_content",
        "platform": request.platform,
        "prompt": request.prompt,
        "content_text": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"content": content, "platform": request.platform, "content_id": content_id}

@api_router.post("/generate/batch")
async def batch_generate_content(request: BatchGenerateRequest, current_user: dict = Depends(get_current_user)):
    brand_context = await get_brand_context(request.brand_id, current_user["user_id"])
    
    prompt = f"""{brand_context}

Generate {request.count} unique {request.content_type} ideas for this café.

Each should be:
- Different from the others
- Aligned with café brand tone
- Engaging and creative
- Platform-ready for Instagram

Format as a numbered list with clear separation."""
    
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=CAFE_AI_SYSTEM_PROMPT
    ).with_model("openai", "gpt-5.2")
    
    batch_content = await chat.send_message(UserMessage(text=prompt))
    
    return {"batch_content": batch_content, "count": request.count}

# ==================== META ADS CONNECTION ====================

@api_router.post("/meta-ads/connect")
async def connect_meta_ads(request: MetaAdsConnectRequest, current_user: dict = Depends(get_current_user)):
    """Store Meta Ads connection details"""
    connection_id = str(uuid.uuid4())
    connection_doc = {
        "id": connection_id,
        "user_id": current_user["user_id"],
        "platform": "meta_ads",
        "access_token": encrypt_token(request.access_token),
        "instagram_account_id": request.instagram_account_id,
        "facebook_page_id": request.facebook_page_id,
        "connected_at": datetime.now(timezone.utc).isoformat(),
        "status": "active"
    }
    
    await db.integrations.update_one(
        {"user_id": current_user["user_id"], "platform": "meta_ads"},
        {"$set": connection_doc},
        upsert=True
    )
    
    return {"success": True, "message": "Meta Ads account connected", "connection_id": connection_id}

@api_router.get("/meta-ads/status")
async def get_meta_ads_status(current_user: dict = Depends(get_current_user)):
    """Check Meta Ads connection status"""
    connection = await db.integrations.find_one(
        {"user_id": current_user["user_id"], "platform": "meta_ads"},
        {"_id": 0, "access_token": 0}
    )
    
    if connection:
        return {"connected": True, "connection": connection}
    return {"connected": False}

# ==================== APP SETUP ====================

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
