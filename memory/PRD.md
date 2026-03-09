# Frameflow - AI-Powered Marketing SaaS for Cafés

## Product Overview
Frameflow is an AI-powered marketing operating system specifically for cafés and coffee shops. The platform enables café owners to create stunning marketing content (images, videos, captions) using AI, manage campaigns, and schedule social media posts.

## Target Users
- Café owners and managers
- Small coffee shop chains
- Independent coffee businesses

## Core Requirements

### Platform Rules (Non-Negotiable)
1. **No Public Signups:** Accounts created by admin only (café name, owner email, password)
2. **No Payment Gateway:** "Buy Now" buttons redirect to WhatsApp (+919930408074)
3. **Demo Requests:** Redirect to WhatsApp with pre-filled demo message
4. **User-Owned Keys:** Users connect their own Meta Ads/Instagram accounts via OAuth

---

## Implementation Status

### ✅ P0 - Stability Fixes (COMPLETED - March 9, 2026)

#### Authentication Persistence
- [x] JWT stored in localStorage
- [x] AuthContext for global state management
- [x] Token validation on app startup (/api/auth/me)
- [x] Axios interceptor auto-attaches token
- [x] Logout clears localStorage and redirects
- [x] ProtectedRoute component for auth-required pages
- [x] PublicRoute redirects authenticated users to dashboard

#### UI/Navigation Fixes
- [x] Templates page fixed (added missing getTypeIcon function)
- [x] BrandProfilePage syntax error fixed
- [x] No white screens on back navigation
- [x] All 10 sidebar navigation items working

#### Global UX Stability
- [x] LoadingSpinner component for all data fetching
- [x] ErrorBoundary component for crash handling
- [x] Toast notifications for errors
- [x] Retry buttons on error states

### Testing Results
- Backend: 19/19 tests passed (100%)
- Frontend: All P0 features verified working

---

## Remaining Tasks

### P1 - Core Platform Features (PENDING)
1. **Admin Dashboard**
   - Create user accounts
   - Activate/deactivate accounts
   - Each account = one café brand

2. **WhatsApp Redirect System**
   - Phone: +919930408074
   - Buy Now message: "Hi, I would like to purchase Frameflow for my cafe."
   - Demo message: "Hi, I would like to request a demo of Frameflow for my cafe."

3. **Meta/Instagram OAuth Connections**
   - Users connect their own accounts
   - Platform owner provides no API keys

4. **Content Scheduler**
   - Calendar interface for scheduling posts

### P2 - Advanced Features (PENDING)
1. Brand DNA onboarding flow
2. Analytics dashboard with real data
3. Landing page improvements
4. Cybersecurity hardening (rate limiting, input validation)

---

## Technical Architecture

### Stack
- **Frontend:** React, TailwindCSS, React Router, Shadcn UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT tokens

### Key Files
```
/app/
├── backend/
│   ├── server.py          # All API endpoints
│   ├── auth.py            # JWT authentication
│   └── .env               # MONGO_URL
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.js    # Global auth state
    │   ├── services/
    │   │   └── api.js            # Centralized API client
    │   ├── components/
    │   │   ├── Layout.js         # Main layout with sidebar
    │   │   ├── LoadingSpinner.js # Loading component
    │   │   └── ErrorBoundary.js  # Error handling
    │   └── pages/
    │       ├── AuthPage.js
    │       ├── DashboardPage.js
    │       ├── TemplatesPage.js
    │       └── ...
    └── .env                # REACT_APP_BACKEND_URL
```

### API Endpoints
- `/api/auth/login` - User login
- `/api/auth/signup` - User registration
- `/api/auth/me` - Get current user (token validation)
- `/api/brands` - CRUD for café brands
- `/api/templates` - Get templates
- `/api/projects` - Campaign management
- `/api/generate/caption` - AI caption generation
- `/api/generate/image` - AI image generation

### Database Schema
- `users`: {email, full_name, hashed_password, role, onboarding_completed}
- `brands`: {user_id, name, tone, industry, website_url}
- `projects`: {brand_id, name, type, status}
- `templates`: {name, description, prompt, type, category}
- `contents`: {project_id, type, content_text, content_url, prompt}

---

## Test Credentials
- Email: testcafe@example.com
- Password: test123456
