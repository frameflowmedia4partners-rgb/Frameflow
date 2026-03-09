# Frameflow - AI Marketing Operating System for Cafés

## Product Overview
Frameflow is a production-ready SaaS platform that functions as an AI-powered social media team specifically for cafés and coffee shops. Café owners can connect their Instagram, upload media, generate café-specialized content, schedule posts, view analytics, and run marketing campaigns.

## Original Problem Statement
Build a complete AI-powered marketing operating system for cafés that enables:
- Instagram/Meta OAuth integration
- AI-powered café content generation  
- Reel creation workflow
- Content scheduling
- Smart posting recommendations
- Live analytics
- Ad campaign management
- Admin dashboard for user management

---

## Current Status: PRODUCTION READY ✅

### Completed Features

#### P0: Core Platform Stability ✅
- [x] JWT authentication with session persistence
- [x] Role-based access control (Admin/User)
- [x] Global error handling and loading states
- [x] Centralized API service with interceptors
- [x] Rate limiting on auth endpoints
- [x] Encrypted token storage (Fernet encryption)

#### P1: Landing Page & Authentication ✅
- [x] Modern multi-section landing page
- [x] "Try Demo Free" instant access button
- [x] Sign In / Request Demo flows
- [x] WhatsApp CTA integration
- [x] Admin-only user creation (no public signup)

#### P2: Admin Dashboard ✅
- [x] Full user CRUD (create, view, update, delete)
- [x] User activation/deactivation
- [x] Password reset functionality
- [x] Platform statistics overview
- [x] Connected accounts tracking

#### P3: User Dashboard ✅
- [x] Marketing command center overview
- [x] Quick action buttons (Create, Schedule, Run Ads, Upload)
- [x] Recent campaigns display
- [x] Upcoming scheduled posts
- [x] AI assistant integration

#### P4: Content Command Center ✅
- [x] Brand selector for multiple cafés
- [x] Content type selection (Post, Reel, Story, Ad)
- [x] AI café content generation with GPT-5.2
- [x] Quick generate templates
- [x] Trending reel ideas sidebar
- [x] Post Now / Schedule / Save Draft actions
- [x] Copy to clipboard functionality

#### P5: Reel Generation System ✅
- [x] Complete reel concept generator
- [x] Hook creation (first 3 seconds)
- [x] Scene-by-scene breakdown
- [x] Audio/music recommendations
- [x] Caption and hashtag generation
- [x] Text overlay suggestions
- [x] Trending café reel formats library

#### P6: Smart Posting Time Engine ✅
- [x] Café-optimized posting recommendations
- [x] Time slots with engagement scores
- [x] Content-type specific recommendations
- [x] "Best time to post today" feature
- [x] Avoid times recommendations

#### P7: Content Scheduler ✅
- [x] Full calendar view (month navigation)
- [x] Scheduled posts CRUD
- [x] Schedule/Edit/Delete post actions
- [x] Today highlighting
- [x] Post preview

#### P8: Analytics Dashboard ✅
- [x] Overview stats (Reach, Engagement, Rate, Followers)
- [x] Weekly performance chart
- [x] Content breakdown (Images, Videos, Reels)
- [x] Top performing posts
- [x] Campaign performance table
- [x] Time range selector (7/30/90 days)
- [x] "Connect for live data" prompt

#### P9: Integrations Page ✅
- [x] Instagram OAuth connection UI
- [x] Meta Ads connection UI
- [x] Connection status display
- [x] Feature lists for each platform
- [x] Setup guide with steps
- [x] Security notice

#### P10: Media Library ✅
- [x] Image/video upload
- [x] Media gallery view
- [x] Media tagging
- [x] Delete functionality

#### P11: Templates Library ✅
- [x] 12+ café-specific templates
- [x] Categories: promotion, launch, seasonal, lifestyle
- [x] Quick-use functionality

#### P12: AI Idea Engine ✅
- [x] Multiple idea types (ad hook, social post, campaign, reel, etc.)
- [x] Save/bookmark ideas
- [x] Regenerate functionality

#### P13: Campaigns/Projects ✅
- [x] Campaign creation
- [x] Project organization by brand
- [x] Status tracking

#### P14: Ad Campaign Strategy ✅
- [x] AI-generated campaign strategies
- [x] Meta Ads targeting recommendations
- [x] Budget allocation advice
- [x] Local café audience targeting

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User signup (admin-created only)
- `GET /api/auth/me` - Current user info
- `POST /api/demo/login` - Demo mode instant login

### Café Content AI
- `POST /api/cafe/generate-content` - Generate café-specialized content
- `POST /api/reels/generate-concept` - Generate reel concepts
- `GET /api/reels/trending-formats` - Get trending café reel formats
- `GET /api/analytics/best-posting-times` - Smart posting recommendations

### Analytics
- `GET /api/analytics/instagram` - Instagram analytics (demo/live)

### Scheduled Posts
- `GET /api/scheduled-posts` - List scheduled posts
- `POST /api/scheduled-posts` - Create scheduled post
- `PUT /api/scheduled-posts/{id}` - Update scheduled post
- `DELETE /api/scheduled-posts/{id}` - Delete scheduled post
- `POST /api/scheduled-posts/{id}/publish-now` - Publish immediately

### Integrations
- `GET /api/integrations/status` - Get all integration statuses
- `GET /api/integrations/instagram/oauth-url` - Get OAuth URL
- `GET /api/integrations/instagram/callback` - OAuth callback handler
- `DELETE /api/integrations/instagram` - Disconnect Instagram

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/stats` - Platform statistics

### Brands & Content
- `GET/POST/PUT /api/brands` - Brand CRUD
- `POST /api/brands/{id}/analyze` - Website analysis
- `POST /api/generate/caption` - Generate caption
- `POST /api/generate/image` - Generate AI image
- `GET /api/templates` - Get templates

---

## Technical Stack

### Frontend
- React 18 with React Router
- TailwindCSS for styling
- Shadcn/UI components
- Sonner for toasts
- Axios for API calls
- AuthContext for global state

### Backend
- FastAPI (Python)
- MongoDB with Motor async driver
- JWT authentication
- Fernet encryption for tokens
- SlowAPI rate limiting
- emergentintegrations for LLM

### Database Schema
- `users`: Authentication, roles, profile
- `brands`: Café brand profiles, DNA
- `scheduled_posts`: Content scheduling
- `generated_contents`: AI-generated content
- `reel_concepts`: Reel plans
- `integrations`: OAuth tokens (encrypted)
- `ad_campaigns`: Campaign strategies

---

## Credentials

### Admin Access
- Email: `admin@frameflow.cafe`
- Password: `FrameflowAdmin2026`

### Demo Mode
- Click "Try Demo Free" on landing page
- Creates `demo@frameflow.cafe` with Urban Brew Café brand

---

## Pending Items (Require User Action)

### Instagram/Meta OAuth (Production)
The OAuth flow is fully implemented in code. To enable:
1. Create a Meta Developer App at developers.facebook.com
2. Add Instagram API and Pages API permissions
3. Set OAuth redirect URI
4. Add to backend/.env:
   ```
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   META_REDIRECT_URI=https://your-domain/api/integrations/instagram/callback
   ```

### Analytics Live Data
Currently shows demo data. Will show live data once Instagram is connected.

---

## Test Reports
- `/app/test_reports/iteration_5.json` - Final platform test (100% pass)

---

## Completed: March 9, 2026
