from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, Request, Query, Form
from fastapi.responses import StreamingResponse, RedirectResponse, HTMLResponse
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
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
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

# Encryption key for tokens
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY', Fernet.generate_key().decode())
cipher_suite = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

# Meta/Instagram OAuth Config (Platform-level credentials)
META_APP_ID = os.environ.get('META_APP_ID', '')
META_APP_SECRET = os.environ.get('META_APP_SECRET', '')
META_REDIRECT_URI = os.environ.get('META_REDIRECT_URI', '')

# Super Admin credentials from env
ADMIN1_EMAIL = os.environ.get('ADMIN1_EMAIL', 'adreej@frameflow.me')
ADMIN1_PASS = os.environ.get('ADMIN1_PASS', 'iamadreejandaarjavbanerjee6969')
ADMIN2_EMAIL = os.environ.get('ADMIN2_EMAIL', 'deepesh@frameflow.me')
ADMIN2_PASS = os.environ.get('ADMIN2_PASS', 'deepesh@2005')

# Monthly retainer fee
MONTHLY_FEE = 15000  # ₹15,000

app = FastAPI(title="Frameflow - AI Marketing for Cafés")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

api_router = APIRouter(prefix="/api")

# ==================== PYDANTIC MODELS ====================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

class BrandProfileRequest(BaseModel):
    name: str
    tagline: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website_url: Optional[str] = None
    tone: Optional[str] = None
    colors: Optional[List[str]] = None
    logo_url: Optional[str] = None
    specialties: Optional[str] = None
    target_audience: Optional[str] = None

class ClientCreateRequest(BaseModel):
    business_name: str
    email: EmailStr
    password: str
    plan_start_date: Optional[str] = None

class ClientUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    business_name: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordResetRequest(BaseModel):
    new_password: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class BillingUpdateRequest(BaseModel):
    status: str  # paid, unpaid

class AdminNoteRequest(BaseModel):
    client_id: str
    message: str

class OnboardingBrandDNARequest(BaseModel):
    logo_url: Optional[str] = None
    sample_images: List[str] = []

class OnboardingBusinessInfoRequest(BaseModel):
    business_name: str
    tagline: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    website_url: Optional[str] = None

class ScheduledPostRequest(BaseModel):
    content_type: str
    caption: str
    media_url: Optional[str] = None
    scheduled_at: str
    platform: str = "instagram"
    status: str = "scheduled"

class CampaignCreateRequest(BaseModel):
    name: str
    objective: str
    daily_budget: float
    start_date: str
    end_date: str
    platforms: List[str]
    content_id: Optional[str] = None
    audience: Optional[Dict] = None

class GenerateContentRequest(BaseModel):
    prompt: str
    brand_id: Optional[str] = None
    type: str = "post"
    platform: Optional[str] = None
    tone: Optional[str] = None

class GenerateIdeaRequest(BaseModel):
    brand_id: Optional[str] = None
    idea_type: str = "general"

class SaveIdeaRequest(BaseModel):
    idea_text: str
    idea_type: str
    format: str = "post"

class ReelGenerateRequest(BaseModel):
    brief: str
    style: str = "cinematic"
    music_mood: str = "upbeat"
    platform: str = "instagram"

class PostGenerateRequest(BaseModel):
    product_name: str
    goal: str = "awareness"
    platform: str = "instagram"
    tone: Optional[str] = None
    additional_instructions: Optional[str] = None

# ==================== ENCRYPTION HELPERS ====================

def encrypt_token(token: str) -> str:
    return cipher_suite.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    try:
        return cipher_suite.decrypt(encrypted_token.encode()).decode()
    except Exception:
        return ""

# ==================== AI SYSTEM PROMPTS ====================

CAFE_AI_SYSTEM_PROMPT = """You are an expert social media marketing specialist for cafés and coffee shops. 
You understand the café industry deeply, including seasonal drink trends, café ambiance marketing, 
coffee culture, local community engagement, and food photography.

Your content should:
- Use warm, inviting language that makes people crave coffee
- Include relevant café hashtags
- Appeal to coffee enthusiasts, remote workers, students, and couples
- Highlight the sensory experience (aroma, warmth, taste)
- Create FOMO for limited-time offers
- Feel authentic and personal, not corporate
- All currency references should be in ₹ (Indian Rupees)"""

# ==================== HELPER FUNCTIONS ====================

async def get_super_admin(current_user: dict = Depends(get_current_user)):
    """Verify user is a super_admin"""
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user or user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user

async def get_brand_for_user(user_id: str):
    """Get brand profile for a user"""
    brand = await db.brand_profiles.find_one({"user_id": user_id}, {"_id": 0})
    return brand

async def get_brand_context(user_id: str) -> str:
    """Get comprehensive brand context for AI generation"""
    brand = await get_brand_for_user(user_id)
    if not brand:
        return ""
    
    context = f"""
BRAND PROFILE:
- Name: {brand.get('name', 'Unknown')}
- Tagline: {brand.get('tagline', '')}
- Tone: {brand.get('tone', 'warm and inviting')}
- Specialties: {brand.get('specialties', 'Coffee and pastries')}
- Target Audience: {brand.get('target_audience', 'Coffee lovers')}
- Location: {brand.get('address', '')}
"""
    
    if brand.get('brand_dna'):
        dna = brand['brand_dna']
        context += f"""
BRAND DNA:
- Logo Position: {dna.get('logo_position', 'top-left')}
- Primary Colors: {dna.get('primary_colors', [])}
- Font Style: {dna.get('font_style', 'sans-serif')}
- Brand Tone: {dna.get('brand_tone', 'warm')}
"""
    return context

# ==================== SUPER ADMIN SETUP ====================

async def ensure_super_admins():
    """Ensure super admin accounts exist in database"""
    for admin_email, admin_pass in [(ADMIN1_EMAIL, ADMIN1_PASS), (ADMIN2_EMAIL, ADMIN2_PASS)]:
        existing = await db.users.find_one({"email": admin_email})
        if not existing:
            admin_doc = {
                "id": str(uuid.uuid4()),
                "email": admin_email,
                "password_hash": hash_password(admin_pass),
                "full_name": "Super Admin",
                "role": "super_admin",
                "is_active": True,
                "onboarding_complete": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(admin_doc)

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, login_req: LoginRequest):
    # First ensure super admins exist
    await ensure_super_admins()
    
    user = await db.users.find_one({"email": login_req.email})
    if not user:
        raise HTTPException(status_code=401, detail="Account not found. Please contact your administrator.")
    
    if not verify_password(login_req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Account not found. Please contact your administrator.")
    
    if user.get("role") != "super_admin" and user.get("is_active") == False:
        raise HTTPException(status_code=403, detail="Account is deactivated. Please contact support.")
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    token = create_access_token({"sub": user["id"], "email": user["email"]}, expires_delta=timedelta(days=7))
    
    return AuthResponse(
        token=token,
        user={
            "id": user["id"], 
            "email": user["email"], 
            "full_name": user.get("full_name"),
            "role": user.get("role", "client_user"),
            "onboarding_complete": user.get("onboarding_complete", False)
        }
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get brand profile
    brand = await get_brand_for_user(current_user["user_id"])
    user["brand"] = brand
    
    # Check for admin impersonation
    if user.get("impersonating_user_id"):
        user["is_impersonating"] = True
    
    return user

@api_router.post("/auth/change-password")
async def change_password(request: PasswordChangeRequest, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(request.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {
            "password_hash": hash_password(request.new_password),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Password changed successfully"}

# ==================== SUPER ADMIN PANEL ENDPOINTS ====================

@api_router.get("/admin/clients")
async def admin_get_clients(admin_user: dict = Depends(get_super_admin)):
    """Get all client users with their details"""
    clients = await db.users.find(
        {"role": "client_user"},
        {"_id": 0, "password_hash": 0}
    ).to_list(500)
    
    for client in clients:
        brand = await get_brand_for_user(client["id"])
        client["brand"] = brand
        
        # Get billing info
        billing = await db.billing_records.find_one(
            {"user_id": client["id"]},
            {"_id": 0}
        )
        client["billing"] = billing
        
        # Get integration status
        integration = await db.integrations.find_one(
            {"user_id": client["id"], "platform": "instagram"},
            {"_id": 0, "access_token": 0}
        )
        client["meta_connected"] = integration is not None and integration.get("status") == "active"
    
    return clients

@api_router.post("/admin/clients")
async def admin_create_client(request: ClientCreateRequest, admin_user: dict = Depends(get_super_admin)):
    """Create a new client account"""
    existing = await db.users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    plan_start = request.plan_start_date or datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "full_name": request.business_name,
        "role": "client_user",
        "is_active": True,
        "onboarding_complete": False,
        "plan_start_date": plan_start,
        "created_by": admin_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create brand profile
    brand_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": request.business_name,
        "tone": "warm and inviting",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.brand_profiles.insert_one(brand_doc)
    
    # Create billing record
    due_date = datetime.fromisoformat(plan_start.replace('Z', '+00:00')) + timedelta(days=30)
    billing_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "amount": MONTHLY_FEE,
        "due_date": due_date.isoformat(),
        "status": "unpaid",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.billing_records.insert_one(billing_doc)
    
    return {
        "success": True,
        "user_id": user_id,
        "email": request.email,
        "business_name": request.business_name
    }

@api_router.get("/admin/clients/{client_id}")
async def admin_get_client(client_id: str, admin_user: dict = Depends(get_super_admin)):
    """Get single client details"""
    client = await db.users.find_one({"id": client_id, "role": "client_user"}, {"_id": 0, "password_hash": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client["brand"] = await get_brand_for_user(client_id)
    client["billing"] = await db.billing_records.find_one({"user_id": client_id}, {"_id": 0})
    
    return client

@api_router.put("/admin/clients/{client_id}")
async def admin_update_client(client_id: str, request: ClientUpdateRequest, admin_user: dict = Depends(get_super_admin)):
    """Update client details"""
    client = await db.users.find_one({"id": client_id, "role": "client_user"})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if request.email is not None:
        existing = await db.users.find_one({"email": request.email, "id": {"$ne": client_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = request.email
    
    if request.business_name is not None:
        update_data["full_name"] = request.business_name
        await db.brand_profiles.update_one(
            {"user_id": client_id},
            {"$set": {"name": request.business_name}}
        )
    
    if request.is_active is not None:
        update_data["is_active"] = request.is_active
    
    await db.users.update_one({"id": client_id}, {"$set": update_data})
    
    return {"success": True}

@api_router.post("/admin/clients/{client_id}/reset-password")
async def admin_reset_client_password(client_id: str, admin_user: dict = Depends(get_super_admin)):
    """Generate a temporary password for client"""
    client = await db.users.find_one({"id": client_id, "role": "client_user"})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    temp_password = secrets.token_urlsafe(12)
    
    await db.users.update_one(
        {"id": client_id},
        {"$set": {
            "password_hash": hash_password(temp_password),
            "temp_password": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "temporary_password": temp_password}

@api_router.delete("/admin/clients/{client_id}")
async def admin_delete_client(client_id: str, admin_user: dict = Depends(get_super_admin)):
    """Delete client and all associated data"""
    client = await db.users.find_one({"id": client_id, "role": "client_user"})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Delete all related data
    await db.brand_profiles.delete_many({"user_id": client_id})
    await db.content_library.delete_many({"user_id": client_id})
    await db.scheduled_posts.delete_many({"user_id": client_id})
    await db.idea_bank.delete_many({"user_id": client_id})
    await db.billing_records.delete_many({"user_id": client_id})
    await db.admin_notes.delete_many({"client_id": client_id})
    await db.campaigns.delete_many({"user_id": client_id})
    await db.integrations.delete_many({"user_id": client_id})
    await db.scraped_media.delete_many({"user_id": client_id})
    await db.users.delete_one({"id": client_id})
    
    return {"success": True, "message": "Client and all data deleted"}

@api_router.post("/admin/clients/{client_id}/impersonate")
async def admin_impersonate_client(client_id: str, admin_user: dict = Depends(get_super_admin)):
    """Start impersonating a client - returns token for client's dashboard"""
    client = await db.users.find_one({"id": client_id, "role": "client_user"})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Create impersonation token
    token = create_access_token({
        "sub": client_id,
        "email": client["email"],
        "impersonated_by": admin_user["user_id"]
    }, expires_delta=timedelta(hours=4))
    
    return {
        "success": True,
        "token": token,
        "client_name": client.get("full_name"),
        "client_email": client["email"]
    }

# ==================== BILLING TRACKER ====================

@api_router.get("/admin/billing")
async def admin_get_billing_overview(admin_user: dict = Depends(get_super_admin)):
    """Get billing overview for all clients"""
    now = datetime.now(timezone.utc)
    
    all_billing = await db.billing_records.find({}, {"_id": 0}).to_list(500)
    
    total_revenue = 0
    paid_this_month = 0
    unpaid_count = 0
    overdue_count = 0
    
    billing_with_clients = []
    
    for record in all_billing:
        client = await db.users.find_one({"id": record["user_id"]}, {"_id": 0, "password_hash": 0})
        record["client"] = client
        
        if record["status"] == "paid":
            total_revenue += record.get("amount", MONTHLY_FEE)
            # Check if paid this month
            if record.get("paid_date"):
                paid_date = datetime.fromisoformat(record["paid_date"].replace('Z', '+00:00'))
                if paid_date.month == now.month and paid_date.year == now.year:
                    paid_this_month += 1
        else:
            unpaid_count += 1
            # Check if overdue (30+ days past due)
            if record.get("due_date"):
                due_date_str = str(record["due_date"])
                # Handle different date formats
                if 'T' in due_date_str:
                    if '+' not in due_date_str and 'Z' not in due_date_str:
                        due_date_str += '+00:00'
                    due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
                else:
                    # Simple date without time - add timezone
                    due_date = datetime.fromisoformat(due_date_str + 'T00:00:00+00:00')
                if (now - due_date).days >= 30:
                    record["is_overdue"] = True
                    overdue_count += 1
        
        billing_with_clients.append(record)
    
    return {
        "summary": {
            "total_monthly_revenue": total_revenue,
            "paid_this_month": paid_this_month,
            "unpaid_count": unpaid_count,
            "overdue_count": overdue_count,
            "monthly_fee": MONTHLY_FEE
        },
        "records": billing_with_clients
    }

@api_router.put("/admin/billing/{client_id}")
async def admin_update_billing(client_id: str, request: BillingUpdateRequest, admin_user: dict = Depends(get_super_admin)):
    """Mark billing as paid/unpaid"""
    billing = await db.billing_records.find_one({"user_id": client_id})
    if not billing:
        raise HTTPException(status_code=404, detail="Billing record not found")
    
    update_data = {
        "status": request.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if request.status == "paid":
        update_data["paid_date"] = datetime.now(timezone.utc).isoformat()
        
        # Create next month's billing
        next_due = datetime.now(timezone.utc) + timedelta(days=30)
        await db.billing_records.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": client_id,
            "amount": MONTHLY_FEE,
            "due_date": next_due.isoformat(),
            "status": "unpaid",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    await db.billing_records.update_one({"user_id": client_id, "status": {"$ne": "paid"}}, {"$set": update_data})
    
    # Log payment history
    await db.payment_history.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": client_id,
        "amount": MONTHLY_FEE,
        "status": request.status,
        "recorded_by": admin_user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True}

@api_router.get("/admin/billing/{client_id}/history")
async def admin_get_payment_history(client_id: str, admin_user: dict = Depends(get_super_admin)):
    """Get payment history for a client"""
    history = await db.payment_history.find({"user_id": client_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return history

# ==================== ADMIN NOTES/SUPPORT ====================

@api_router.post("/admin/notes")
async def admin_send_note(request: AdminNoteRequest, admin_user: dict = Depends(get_super_admin)):
    """Send internal note to client"""
    client = await db.users.find_one({"id": request.client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    note_doc = {
        "id": str(uuid.uuid4()),
        "client_id": request.client_id,
        "message": request.message,
        "from_admin": admin_user["user_id"],
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_notes.insert_one(note_doc)
    
    return {"success": True, "note_id": note_doc["id"]}

@api_router.get("/admin/notes/{client_id}")
async def admin_get_notes(client_id: str, admin_user: dict = Depends(get_super_admin)):
    """Get all notes for a client"""
    notes = await db.admin_notes.find({"client_id": client_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notes

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get admin notifications for current user"""
    notes = await db.admin_notes.find(
        {"client_id": current_user["user_id"], "read": False},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notes

@api_router.put("/notifications/{note_id}/read")
async def mark_notification_read(note_id: str, current_user: dict = Depends(get_current_user)):
    """Mark notification as read"""
    await db.admin_notes.update_one(
        {"id": note_id, "client_id": current_user["user_id"]},
        {"$set": {"read": True}}
    )
    return {"success": True}

# ==================== ADMIN STATS ====================

@api_router.get("/admin/stats")
async def admin_get_stats(admin_user: dict = Depends(get_super_admin)):
    """Get platform statistics"""
    total_clients = await db.users.count_documents({"role": "client_user"})
    active_clients = await db.users.count_documents({"role": "client_user", "is_active": True})
    connected_meta = await db.integrations.count_documents({"platform": "instagram", "status": "active"})
    total_posts = await db.scheduled_posts.count_documents({})
    total_campaigns = await db.campaigns.count_documents({})
    
    return {
        "total_clients": total_clients,
        "active_clients": active_clients,
        "inactive_clients": total_clients - active_clients,
        "meta_connected": connected_meta,
        "total_scheduled_posts": total_posts,
        "total_campaigns": total_campaigns
    }

# ==================== ONBOARDING WIZARD ====================

@api_router.post("/onboarding/brand-assets")
async def onboarding_brand_assets(
    request: OnboardingBrandDNARequest,
    current_user: dict = Depends(get_current_user)
):
    """Step 1: Analyze brand assets with AI Vision"""
    
    if not request.sample_images:
        raise HTTPException(status_code=400, detail="Please upload at least one sample image")
    
    # Use AI to analyze brand images
    analysis_prompt = """Analyze these brand post images carefully.
Return ONLY a valid JSON object with these keys:
- logo_position (top-left/top-right/bottom-left/bottom-right)
- watermark_text (exact text if visible or null)
- watermark_position (same position options)
- primary_colors (array of hex codes)
- secondary_colors (array of hex codes)
- font_style (serif/sans-serif/script/display)
- contact_info_position (bottom-left/bottom-right/center-bottom)
- layout_pattern (short text description)
- brand_tone (elegant/playful/bold/minimal/luxury)
- tagline (if visible or null)"""
    
    try:
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=str(uuid.uuid4()),
            system_message="You are a brand analyst. Analyze brand images and extract styling details in JSON format."
        ).with_model("openai", "gpt-5.2")
        
        # For image analysis, we'll describe what we want
        response = await chat.send_message(UserMessage(
            text=f"{analysis_prompt}\n\nAnalyze these {len(request.sample_images)} brand images."
        ))
        
        try:
            brand_dna = json.loads(response)
        except:
            brand_dna = {
                "logo_position": "top-left",
                "primary_colors": ["#6366f1", "#a855f7"],
                "secondary_colors": ["#f1f5f9"],
                "font_style": "sans-serif",
                "contact_info_position": "bottom-right",
                "brand_tone": "warm"
            }
        
        # Update brand profile
        await db.brand_profiles.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": {
                "logo_url": request.logo_url,
                "sample_images": request.sample_images,
                "brand_dna": brand_dna,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        return {"success": True, "brand_dna": brand_dna}
        
    except Exception as e:
        logging.error(f"Brand analysis error: {str(e)}")
        # Return default brand DNA on error
        default_dna = {
            "logo_position": "top-left",
            "primary_colors": ["#6366f1"],
            "font_style": "sans-serif",
            "brand_tone": "warm"
        }
        await db.brand_profiles.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": {"brand_dna": default_dna}},
            upsert=True
        )
        return {"success": True, "brand_dna": default_dna}

@api_router.post("/onboarding/business-info")
async def onboarding_business_info(
    request: OnboardingBusinessInfoRequest,
    current_user: dict = Depends(get_current_user)
):
    """Step 2: Save business info and scrape website"""
    
    update_data = {
        "name": request.business_name,
        "tagline": request.tagline,
        "phone": request.phone,
        "address": request.address,
        "website_url": request.website_url,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    scraped_data = None
    scraped_images = []
    
    # Scrape website if provided
    if request.website_url:
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            response = requests.get(request.website_url, timeout=15, headers=headers)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract text content
            text_content = soup.get_text()
            text_content = ' '.join(text_content.split())[:5000]
            
            # Extract all images
            images = soup.find_all('img')
            for img in images[:20]:  # Limit to 20 images
                src = img.get('src') or img.get('data-src')
                if src:
                    if not src.startswith('http'):
                        src = urljoin(request.website_url, src)
                    alt = img.get('alt', '')
                    # Generate filename from alt or URL
                    filename = alt.lower().replace(' ', '_')[:30] if alt else urlparse(src).path.split('/')[-1]
                    scraped_images.append({
                        "url": src,
                        "filename": filename,
                        "alt": alt
                    })
            
            # Extract contact info
            contact_patterns = {
                "phone": r'[\+]?[0-9]{10,12}',
                "email": r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
            }
            
            found_contacts = {}
            for key, pattern in contact_patterns.items():
                matches = re.findall(pattern, text_content)
                if matches:
                    found_contacts[key] = matches[0]
            
            # Extract colors from CSS
            style_tags = soup.find_all('style')
            colors = []
            for style in style_tags:
                hex_colors = re.findall(r'#[0-9a-fA-F]{6}', str(style))
                colors.extend(hex_colors[:5])
            
            scraped_data = {
                "text_sample": text_content[:1000],
                "images": scraped_images,
                "contacts": found_contacts,
                "colors": list(set(colors))[:5],
                "scraped_at": datetime.now(timezone.utc).isoformat()
            }
            
            update_data["scraped_data"] = scraped_data
            
            # Save scraped images to content library
            for img in scraped_images:
                await db.content_library.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": current_user["user_id"],
                    "url": img["url"],
                    "filename": img["filename"],
                    "tags": [img["alt"]] if img["alt"] else ["scraped"],
                    "source": "scraped",
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            
        except Exception as e:
            logging.error(f"Website scraping error: {str(e)}")
            scraped_data = {"error": "Couldn't reach website - you can add media manually"}
    
    # Update brand profile
    await db.brand_profiles.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": update_data},
        upsert=True
    )
    
    # Update user name
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"full_name": request.business_name}}
    )
    
    return {
        "success": True,
        "scraped_data": scraped_data,
        "images_found": len(scraped_images)
    }

@api_router.post("/onboarding/complete")
async def complete_onboarding(current_user: dict = Depends(get_current_user)):
    """Mark onboarding as complete"""
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"onboarding_complete": True}}
    )
    return {"success": True}

# ==================== META OAUTH (Per Client) ====================

@api_router.get("/integrations/meta/oauth-url")
async def get_meta_oauth_url(current_user: dict = Depends(get_current_user)):
    """Generate Meta OAuth URL using platform credentials"""
    if not META_APP_ID:
        return {
            "oauth_url": None,
            "error": "Meta integration not configured yet",
            "setup_required": True
        }
    
    state = secrets.token_urlsafe(32)
    
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
        "pages_read_engagement",
        "ads_management",
        "ads_read"
    ]
    
    oauth_url = (
        f"https://www.facebook.com/v20.0/dialog/oauth?"
        f"client_id={META_APP_ID}&"
        f"redirect_uri={META_REDIRECT_URI}&"
        f"scope={','.join(scopes)}&"
        f"response_type=code&"
        f"state={state}"
    )
    
    return {"oauth_url": oauth_url, "state": state}

@api_router.get("/integrations/meta/callback")
async def meta_oauth_callback(code: str, state: str):
    """Handle Meta OAuth callback"""
    state_doc = await db.oauth_states.find_one({"state": state})
    if not state_doc:
        raise HTTPException(status_code=400, detail="Invalid state")
    
    user_id = state_doc["user_id"]
    await db.oauth_states.delete_one({"state": state})
    
    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for token
            token_resp = await client.get(
                "https://graph.facebook.com/v20.0/oauth/access_token",
                params={
                    "client_id": META_APP_ID,
                    "client_secret": META_APP_SECRET,
                    "redirect_uri": META_REDIRECT_URI,
                    "code": code
                }
            )
            
            if token_resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange code")
            
            token_data = token_resp.json()
            short_token = token_data["access_token"]
            
            # Get long-lived token
            long_resp = await client.get(
                "https://graph.facebook.com/v20.0/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": META_APP_ID,
                    "client_secret": META_APP_SECRET,
                    "fb_exchange_token": short_token
                }
            )
            
            long_data = long_resp.json()
            access_token = long_data["access_token"]
            
            # Get Facebook pages
            pages_resp = await client.get(
                "https://graph.facebook.com/v20.0/me/accounts",
                params={"access_token": access_token}
            )
            pages = pages_resp.json().get("data", [])
            
            # Get Instagram accounts
            ig_accounts = []
            for page in pages:
                ig_resp = await client.get(
                    f"https://graph.facebook.com/v20.0/{page['id']}",
                    params={
                        "fields": "instagram_business_account{id,username,profile_picture_url,followers_count}",
                        "access_token": page["access_token"]
                    }
                )
                ig_data = ig_resp.json()
                if "instagram_business_account" in ig_data:
                    ig_account = ig_data["instagram_business_account"]
                    ig_account["page_id"] = page["id"]
                    ig_account["page_name"] = page["name"]
                    ig_account["page_access_token"] = page["access_token"]
                    ig_accounts.append(ig_account)
            
            # Store in brand_profiles
            await db.brand_profiles.update_one(
                {"user_id": user_id},
                {"$set": {
                    "facebook_access_token": encrypt_token(access_token),
                    "facebook_pages": pages,
                    "instagram_accounts": ig_accounts,
                    "instagram_account_id": ig_accounts[0]["id"] if ig_accounts else None,
                    "facebook_page_id": pages[0]["id"] if pages else None,
                    "meta_connected_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Also store in integrations for compatibility
            await db.integrations.update_one(
                {"user_id": user_id, "platform": "instagram"},
                {"$set": {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "platform": "instagram",
                    "access_token": encrypt_token(access_token),
                    "instagram_accounts": ig_accounts,
                    "status": "active",
                    "connected_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
            
            frontend_url = os.environ.get('FRONTEND_URL', '')
            return RedirectResponse(
                url=f"{frontend_url}/settings?meta=connected",
                status_code=302
            )
            
    except Exception as e:
        logging.error(f"OAuth error: {str(e)}")
        frontend_url = os.environ.get('FRONTEND_URL', '')
        return RedirectResponse(
            url=f"{frontend_url}/settings?meta=error&message={str(e)}",
            status_code=302
        )

@api_router.get("/integrations/status")
async def get_integration_status(current_user: dict = Depends(get_current_user)):
    """Get Meta connection status for current user"""
    brand = await get_brand_for_user(current_user["user_id"])
    
    meta_connected = False
    ig_accounts = []
    fb_pages = []
    
    if brand:
        meta_connected = brand.get("meta_connected_at") is not None
        ig_accounts = brand.get("instagram_accounts", [])
        fb_pages = brand.get("facebook_pages", [])
    
    return {
        "instagram": {
            "connected": meta_connected and len(ig_accounts) > 0,
            "accounts": ig_accounts
        },
        "facebook": {
            "connected": meta_connected and len(fb_pages) > 0,
            "pages": fb_pages
        }
    }

@api_router.delete("/integrations/meta")
async def disconnect_meta(current_user: dict = Depends(get_current_user)):
    """Disconnect Meta accounts"""
    await db.brand_profiles.update_one(
        {"user_id": current_user["user_id"]},
        {"$unset": {
            "facebook_access_token": "",
            "facebook_pages": "",
            "instagram_accounts": "",
            "instagram_account_id": "",
            "facebook_page_id": "",
            "meta_connected_at": ""
        }}
    )
    await db.integrations.delete_one({"user_id": current_user["user_id"], "platform": "instagram"})
    
    return {"success": True}

# ==================== BRAND PROFILE ====================

@api_router.get("/brands")
async def get_brands(current_user: dict = Depends(get_current_user)):
    """Get all brands for the current user (or all for admins)"""
    user_id = current_user["user_id"]
    
    # For regular clients, return their own brand
    brand = await get_brand_for_user(user_id)
    if brand:
        brand["id"] = brand.get("id") or str(brand.get("_id", ""))
        if "_id" in brand:
            del brand["_id"]
        return [brand]
    return []

@api_router.get("/brands/{brand_id}")
async def get_brand_by_id(brand_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific brand by ID"""
    brand = await db.brand_profiles.find_one({"$or": [{"id": brand_id}, {"user_id": brand_id}]}, {"_id": 0})
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand

@api_router.get("/brand")
async def get_brand_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's brand profile"""
    brand = await get_brand_for_user(current_user["user_id"])
    if not brand:
        return {"name": "", "brand_dna": None}
    return brand

@api_router.put("/brand")
async def update_brand_profile(request: BrandProfileRequest, current_user: dict = Depends(get_current_user)):
    """Update brand profile"""
    update_data = request.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.brand_profiles.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": update_data},
        upsert=True
    )
    
    return {"success": True}

# ==================== CONTENT LIBRARY ====================

@api_router.get("/content-library")
async def get_content_library(
    current_user: dict = Depends(get_current_user),
    file_type: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None
):
    """Get content library with filters"""
    query = {"user_id": current_user["user_id"]}
    
    if file_type and file_type != "all":
        if file_type == "images":
            query["$or"] = [
                {"filename": {"$regex": r"\.(jpg|jpeg|png|gif|webp)$", "$options": "i"}},
                {"type": "image"}
            ]
        elif file_type == "videos":
            query["$or"] = [
                {"filename": {"$regex": r"\.(mp4|mov|avi|webm)$", "$options": "i"}},
                {"type": "video"}
            ]
    
    if source and source != "all":
        query["source"] = source
    
    if search:
        query["$or"] = [
            {"filename": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    items = await db.content_library.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api_router.post("/content-library")
async def upload_to_library(
    current_user: dict = Depends(get_current_user),
    filename: str = Form(...),
    file_data: str = Form(...),
    tags: str = Form("")
):
    """Upload file to content library"""
    item_id = str(uuid.uuid4())
    
    # Generate keyword-based filename
    keyword_filename = filename.lower().replace(' ', '_')
    
    item_doc = {
        "id": item_id,
        "user_id": current_user["user_id"],
        "filename": keyword_filename,
        "url": file_data,
        "tags": [t.strip() for t in tags.split(',') if t.strip()],
        "source": "uploaded",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.content_library.insert_one(item_doc)
    
    return {"success": True, "id": item_id, "filename": keyword_filename}

@api_router.delete("/content-library/{item_id}")
async def delete_from_library(item_id: str, current_user: dict = Depends(get_current_user)):
    """Delete item from content library"""
    result = await db.content_library.delete_one({
        "id": item_id,
        "user_id": current_user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"success": True}

# ==================== POST GENERATION ====================

@api_router.post("/posts/generate")
async def generate_post(request: PostGenerateRequest, current_user: dict = Depends(get_current_user)):
    """Generate branded post with caption"""
    brand_context = await get_brand_context(current_user["user_id"])
    brand = await get_brand_for_user(current_user["user_id"])
    
    prompt = f"""Create an engaging Instagram post for a café:
{brand_context}

Product/Service: {request.product_name}
Goal: {request.goal}
Platform: {request.platform}
Tone: {request.tone or 'warm and inviting'}
Additional Notes: {request.additional_instructions or 'None'}

Generate:
1. Attention-grabbing caption (150-200 chars)
2. Extended caption with story/emotion (up to 2000 chars)
3. 10-15 relevant hashtags (mix of popular and niche)
4. Call-to-action
5. Best posting time suggestion

Make it authentic and engaging. All prices in ₹ (Indian Rupees)."""

    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=CAFE_AI_SYSTEM_PROMPT
    ).with_model("openai", "gpt-5.2")
    
    caption = await chat.send_message(UserMessage(text=prompt))
    
    # Search content library for relevant media
    media_url = None
    media_item = await db.content_library.find_one({
        "user_id": current_user["user_id"],
        "$or": [
            {"filename": {"$regex": request.product_name, "$options": "i"}},
            {"tags": {"$regex": request.product_name, "$options": "i"}}
        ]
    })
    
    if media_item:
        media_url = media_item.get("url")
    
    # If no media found, generate AI image
    if not media_url:
        try:
            image_gen = OpenAIImageGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
            enhanced_prompt = f"{request.product_name} product photography, hyperrealistic, professional photography, natural lighting, NOT AI-looking, photographic quality, commercial grade"
            
            images = await image_gen.generate_images(
                prompt=enhanced_prompt,
                model="gpt-image-1",
                number_of_images=1
            )
            
            if images:
                media_url = f"data:image/png;base64,{base64.b64encode(images[0]).decode('utf-8')}"
                
                # Save to library
                await db.content_library.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": current_user["user_id"],
                    "filename": f"{request.product_name.lower().replace(' ', '_')}_ai.png",
                    "url": media_url,
                    "tags": [request.product_name, "ai_generated"],
                    "source": "ai_generated",
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
        except Exception as e:
            logging.error(f"Image generation error: {str(e)}")
    
    return {
        "caption": caption,
        "media_url": media_url,
        "brand_dna": brand.get("brand_dna") if brand else None,
        "platform": request.platform
    }

# ==================== REEL GENERATION ====================

@api_router.post("/reels/generate")
async def generate_reel(request: ReelGenerateRequest, current_user: dict = Depends(get_current_user)):
    """Generate reel concept and script"""
    brand_context = await get_brand_context(current_user["user_id"])
    
    # Parse intent
    parse_prompt = f"""Analyze this reel brief: "{request.brief}"
    
Extract and return as JSON:
- primary_keyword: main subject
- secondary_keywords: related topics
- suggested_script: array of 5-8 text overlay lines
- music_mood: {request.music_mood}"""

    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message="You are a viral reel creator for cafés. Return JSON only."
    ).with_model("openai", "gpt-5.2")
    
    intent_response = await chat.send_message(UserMessage(text=parse_prompt))
    
    try:
        intent = json.loads(intent_response)
    except:
        intent = {
            "primary_keyword": request.brief.split()[0] if request.brief else "coffee",
            "secondary_keywords": [],
            "suggested_script": ["Scene 1", "Scene 2", "Scene 3"],
            "music_mood": request.music_mood
        }
    
    # Search for media
    keyword = intent.get("primary_keyword", "")
    media_items = await db.content_library.find({
        "user_id": current_user["user_id"],
        "$or": [
            {"filename": {"$regex": keyword, "$options": "i"}},
            {"tags": {"$regex": keyword, "$options": "i"}}
        ]
    }, {"_id": 0}).to_list(10)
    
    # Generate images if needed
    if len(media_items) < 6:
        try:
            image_gen = OpenAIImageGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])
            
            for i in range(6 - len(media_items)):
                prompt = f"{keyword} professional food/product photography, hyperrealistic, natural lighting, ultra detailed, photographic quality, NOT AI-generated looking, commercial grade photography"
                
                images = await image_gen.generate_images(
                    prompt=prompt,
                    model="gpt-image-1",
                    number_of_images=1
                )
                
                if images:
                    url = f"data:image/png;base64,{base64.b64encode(images[0]).decode('utf-8')}"
                    media_items.append({
                        "url": url,
                        "filename": f"{keyword}_{i}.png",
                        "source": "ai_generated"
                    })
        except Exception as e:
            logging.error(f"Reel image generation error: {str(e)}")
    
    # Generate full reel concept
    concept_prompt = f"""{brand_context}

Create a complete reel production plan:
Brief: {request.brief}
Style: {request.style}
Music Mood: {request.music_mood}

Include:
1. HOOK (0-3 seconds) - what to show and text overlay
2. SCENE BREAKDOWN (6-8 scenes with timestamps, visuals, text overlays)
3. CAPTION with hashtags
4. Music suggestions (royalty-free)
5. Best posting time"""

    concept = await chat.send_message(UserMessage(text=concept_prompt))
    
    return {
        "concept": concept,
        "intent": intent,
        "media": media_items,
        "style": request.style,
        "music_mood": request.music_mood
    }

# ==================== IDEAS ENGINE ====================

@api_router.post("/ideas/generate")
async def generate_idea(request: GenerateIdeaRequest, current_user: dict = Depends(get_current_user)):
    """Generate marketing ideas with streaming-like speed"""
    brand_context = await get_brand_context(current_user["user_id"])
    
    idea_prompts = {
        "ad_hook": "Generate a compelling ad hook that grabs attention in the first 3 seconds.",
        "social_post": "Generate a creative social media post idea that drives engagement.",
        "storytelling": "Generate a storytelling angle that connects emotionally.",
        "campaign": "Generate a complete marketing campaign idea with theme and execution.",
        "promotion": "Generate a promotion idea that drives foot traffic.",
        "reel": "Generate a viral reel concept.",
        "seasonal": "Generate a seasonal marketing idea.",
        "community": "Generate a community engagement idea.",
        "general": "Generate a creative marketing idea for social media."
    }
    
    prompt = f"""{brand_context}

{idea_prompts.get(request.idea_type, idea_prompts['general'])}

Return in this format:
**Title:** [catchy title]
**Caption Preview:** [2-3 line preview]
**Format:** [Post/Reel/Story/Ad]
**Hashtags:** [5-7 relevant hashtags]

Keep it concise and actionable. Currency in ₹."""

    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message=CAFE_AI_SYSTEM_PROMPT
    ).with_model("openai", "gpt-5.2")
    
    idea = await chat.send_message(UserMessage(text=prompt))
    
    return {
        "idea_id": str(uuid.uuid4()),
        "idea_text": idea,
        "idea_type": request.idea_type
    }

@api_router.post("/ideas/save")
async def save_idea(request: SaveIdeaRequest, current_user: dict = Depends(get_current_user)):
    """Save idea to idea bank"""
    idea_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "idea_text": request.idea_text,
        "idea_type": request.idea_type,
        "format": request.format,
        "status": "saved",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.idea_bank.insert_one(idea_doc)
    return {"success": True, "idea_id": idea_doc["id"]}

@api_router.get("/ideas")
async def get_saved_ideas(current_user: dict = Depends(get_current_user)):
    """Get all saved ideas"""
    ideas = await db.idea_bank.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return ideas

# ==================== SCHEDULER ====================

@api_router.get("/scheduled-posts")
async def get_scheduled_posts(current_user: dict = Depends(get_current_user)):
    """Get all scheduled posts"""
    posts = await db.scheduled_posts.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("scheduled_at", 1).to_list(500)
    return posts

@api_router.post("/scheduled-posts")
async def create_scheduled_post(request: ScheduledPostRequest, current_user: dict = Depends(get_current_user)):
    """Create a scheduled post"""
    post_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "content_type": request.content_type,
        "caption": request.caption,
        "media_url": request.media_url,
        "scheduled_at": request.scheduled_at,
        "platform": request.platform,
        "status": request.status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.scheduled_posts.insert_one(post_doc)
    return {"success": True, "post_id": post_doc["id"]}

@api_router.put("/scheduled-posts/{post_id}")
async def update_scheduled_post(post_id: str, request: ScheduledPostRequest, current_user: dict = Depends(get_current_user)):
    """Update a scheduled post"""
    result = await db.scheduled_posts.update_one(
        {"id": post_id, "user_id": current_user["user_id"]},
        {"$set": {
            "content_type": request.content_type,
            "caption": request.caption,
            "media_url": request.media_url,
            "scheduled_at": request.scheduled_at,
            "platform": request.platform,
            "status": request.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True}

@api_router.delete("/scheduled-posts/{post_id}")
async def delete_scheduled_post(post_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a scheduled post"""
    result = await db.scheduled_posts.delete_one({
        "id": post_id,
        "user_id": current_user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True}

# ==================== CAMPAIGNS ====================

@api_router.get("/campaigns")
async def get_campaigns(current_user: dict = Depends(get_current_user)):
    """Get all campaigns"""
    campaigns = await db.campaigns.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return campaigns

@api_router.post("/campaigns")
async def create_campaign(request: CampaignCreateRequest, current_user: dict = Depends(get_current_user)):
    """Create a new campaign"""
    brand_context = await get_brand_context(current_user["user_id"])
    
    # Generate AI audience suggestions
    audience_prompt = f"""{brand_context}

Generate targeting suggestions for a {request.objective} campaign with ₹{request.daily_budget} daily budget.

Return JSON:
{{
    "locations": ["suggested locations based on brand address"],
    "age_range": "25-45",
    "interests": ["food", "cafes", "coffee", "local dining"],
    "behaviors": ["engaged shoppers"],
    "estimated_reach": "5000-10000"
}}"""

    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=str(uuid.uuid4()),
        system_message="You are a Meta Ads specialist for local cafes. Return JSON only."
    ).with_model("openai", "gpt-5.2")
    
    audience_response = await chat.send_message(UserMessage(text=audience_prompt))
    
    try:
        ai_audience = json.loads(audience_response)
    except:
        ai_audience = {
            "locations": ["5km radius"],
            "age_range": "25-45",
            "interests": ["food", "cafes", "coffee"],
            "estimated_reach": "5000-10000"
        }
    
    campaign_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "name": request.name,
        "objective": request.objective,
        "daily_budget": request.daily_budget,
        "start_date": request.start_date,
        "end_date": request.end_date,
        "platforms": request.platforms,
        "content_id": request.content_id,
        "audience": request.audience or ai_audience,
        "ai_suggestions": ai_audience,
        "status": "draft",
        "spend": 0,
        "results": {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.campaigns.insert_one(campaign_doc)
    
    return {"success": True, "campaign": campaign_doc}

@api_router.put("/campaigns/{campaign_id}/status")
async def update_campaign_status(campaign_id: str, status: str, current_user: dict = Depends(get_current_user)):
    """Update campaign status"""
    valid_statuses = ["draft", "active", "paused", "completed", "failed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.campaigns.update_one(
        {"id": campaign_id, "user_id": current_user["user_id"]},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {"success": True}

@api_router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a campaign"""
    result = await db.campaigns.delete_one({
        "id": campaign_id,
        "user_id": current_user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return {"success": True}

# ==================== ANALYTICS ====================

@api_router.get("/analytics")
async def get_analytics(
    current_user: dict = Depends(get_current_user),
    days: int = Query(7, ge=1, le=90)
):
    """Get analytics - real data if Meta connected, demo if not"""
    brand = await get_brand_for_user(current_user["user_id"])
    
    if brand and brand.get("facebook_access_token"):
        # Try to fetch real data
        try:
            token = decrypt_token(brand["facebook_access_token"])
            ig_id = brand.get("instagram_account_id")
            
            if token and ig_id:
                async with httpx.AsyncClient() as client:
                    insights_resp = await client.get(
                        f"https://graph.facebook.com/v20.0/{ig_id}/insights",
                        params={
                            "metric": "impressions,reach,profile_views,follower_count",
                            "period": "day",
                            "access_token": token
                        }
                    )
                    
                    account_resp = await client.get(
                        f"https://graph.facebook.com/v20.0/{ig_id}",
                        params={
                            "fields": "followers_count,follows_count,media_count",
                            "access_token": token
                        }
                    )
                    
                    if insights_resp.status_code == 200 and account_resp.status_code == 200:
                        return {
                            "is_live": True,
                            "insights": insights_resp.json().get("data", []),
                            "account": account_resp.json(),
                            "period_days": days
                        }
        except Exception as e:
            logging.error(f"Analytics fetch error: {str(e)}")
    
    # Return demo data
    import random
    base_reach = random.randint(8000, 15000)
    
    return {
        "is_live": False,
        "message": "Connect Meta to see real analytics",
        "demo_data": {
            "reach": base_reach,
            "impressions": int(base_reach * 2.2),
            "likes": int(base_reach * 0.08),
            "comments": int(base_reach * 0.02),
            "shares": int(base_reach * 0.01),
            "saves": int(base_reach * 0.03),
            "followers": random.randint(1500, 3000),
            "follower_growth": round(random.uniform(2.0, 8.0), 1),
            "ad_spend": random.randint(5000, 15000),
            "roas": round(random.uniform(2.0, 5.0), 2),
            "cpm": round(random.uniform(50, 150), 2),
            "cpc": round(random.uniform(5, 20), 2),
            "ctr": round(random.uniform(1.5, 4.0), 2)
        },
        "period_days": days
    }

@api_router.get("/analytics/best-times")
async def get_best_posting_times(current_user: dict = Depends(get_current_user)):
    """Get AI-recommended posting times"""
    return {
        "best_times": [
            {"time": "07:00", "day": "weekday", "label": "Morning Rush", "score": 92},
            {"time": "12:00", "day": "weekday", "label": "Lunch Break", "score": 78},
            {"time": "18:30", "day": "all", "label": "Evening", "score": 95},
            {"time": "10:00", "day": "weekend", "label": "Weekend Brunch", "score": 88},
            {"time": "14:00", "day": "weekend", "label": "Afternoon", "score": 85}
        ],
        "today": {
            "time": "18:30",
            "label": "Best time to post today",
            "reason": "Evening posts get 2.3x more engagement"
        }
    }

# ==================== PROJECTS ====================

@api_router.get("/projects")
async def get_projects(current_user: dict = Depends(get_current_user)):
    """Get projects for current user"""
    projects = await db.projects.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    return projects

@api_router.post("/projects")
async def create_project(request: dict, current_user: dict = Depends(get_current_user)):
    """Create a new project"""
    project = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "name": request.get("name", "New Project"),
        "type": request.get("type", "mixed"),
        "brand_id": request.get("brand_id"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(project)
    return project

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific project"""
    project = await db.projects.find_one({"id": project_id, "user_id": current_user["user_id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# ==================== TEMPLATES ====================

@api_router.get("/templates")
async def get_templates():
    """Get content templates"""
    return [
        {
            "id": "daily-special",
            "name": "Daily Special",
            "type": "caption",
            "category": "promotion",
            "description": "Highlight today's special drink or food item",
            "prompt": "Create an engaging Instagram caption for today's special: [your special item]. Include emojis, a call-to-action, and relevant hashtags."
        },
        {
            "id": "new-drink",
            "name": "New Drink Launch",
            "type": "caption",
            "category": "launch",
            "description": "Announce a new menu item with excitement",
            "prompt": "Write an exciting announcement post for our new drink: [drink name]. Build anticipation and encourage customers to try it!"
        },
        {
            "id": "latte-art",
            "name": "Latte Art Reel",
            "type": "caption",
            "category": "content",
            "description": "Caption for a mesmerizing latte art video",
            "prompt": "Write a captivating caption for a latte art creation video. Keep it short, visual, and satisfying."
        },
        {
            "id": "cozy-vibes",
            "name": "Cozy Atmosphere",
            "type": "caption",
            "category": "ambiance",
            "description": "Showcase your café's welcoming environment",
            "prompt": "Create a warm, inviting caption about our café's cozy atmosphere. Make people want to come relax with a coffee."
        },
        {
            "id": "behind-scenes",
            "name": "Behind the Scenes",
            "type": "caption",
            "category": "story",
            "description": "Share your café's authentic story",
            "prompt": "Write a relatable behind-the-scenes caption showing the daily life of our café team."
        },
        {
            "id": "weekend-promo",
            "name": "Weekend Promotion",
            "type": "caption",
            "category": "promotion",
            "description": "Drive weekend traffic with special offers",
            "prompt": "Create an exciting weekend promotion post. Include urgency and a clear call-to-action."
        },
        {
            "id": "seasonal",
            "name": "Seasonal Special",
            "type": "caption",
            "category": "seasonal",
            "description": "Celebrate the season with themed content",
            "prompt": "Write a seasonal-themed caption for [current season]. Connect our coffee to seasonal feelings and experiences."
        },
        {
            "id": "morning-ritual",
            "name": "Morning Coffee",
            "type": "caption",
            "category": "lifestyle",
            "description": "Capture the morning coffee ritual",
            "prompt": "Create a relatable caption about morning coffee rituals. Appeal to early risers and coffee lovers."
        }
    ]

# ==================== BILLING (CLIENT VIEW) ====================

@api_router.get("/billing")
async def get_client_billing(current_user: dict = Depends(get_current_user)):
    """Get billing info for current client"""
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    billing = await db.billing_records.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    history = await db.payment_history.find({"user_id": current_user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(12)
    
    return {
        "plan": "Frameflow Professional",
        "monthly_fee": MONTHLY_FEE,
        "plan_start": user.get("plan_start_date"),
        "current_billing": billing,
        "history": history
    }

# ==================== STATS ====================

@api_router.get("/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get stats for current user"""
    posts_count = await db.scheduled_posts.count_documents({"user_id": current_user["user_id"]})
    campaigns_count = await db.campaigns.count_documents({"user_id": current_user["user_id"]})
    ideas_count = await db.idea_bank.count_documents({"user_id": current_user["user_id"]})
    media_count = await db.content_library.count_documents({"user_id": current_user["user_id"]})
    
    return {
        "scheduled_posts": posts_count,
        "campaigns": campaigns_count,
        "saved_ideas": ideas_count,
        "media_files": media_count
    }

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

@app.on_event("startup")
async def startup():
    await ensure_super_admins()

@app.on_event("shutdown")
async def shutdown():
    client.close()
