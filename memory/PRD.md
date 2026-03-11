# Frameflow - AI Marketing Studio PRD

## Original Problem Statement
Complete rebuild of the Frameflow client dashboard with AI-powered content generation for cafés, bakeries, and restaurants.

## Technology Stack
- **Backend:** FastAPI, MongoDB, Pillow, FFmpeg
- **Frontend:** React, TailwindCSS, Shadcn/UI
- **AI (Text):** Gemini 2.0 Flash
- **AI (Image):** DALL-E 3
- **Stock Media:** Pixabay API
- **Web Scraping:** BeautifulSoup
- **Authentication:** JWT in localStorage

## Core Features Implemented

### ✅ Brand DNA Onboarding
Multi-step wizard with animated progress bar to collect brand information.

### ✅ Credit System (250/month)
- Image posts: 1 credit
- Reels: 5 credits
- Credit meter displayed on dashboard

### ✅ Navigation Sidebar
Sections: Workspace (Home, Chat), Assets (Library, DNA, Inspo), Social (Calendar, Analytics)

### ✅ Home Dashboard
- Personalized greeting: "Good morning, [Brand Name]"
- Credit meter with usage stats
- 2x3 creation mode grid

### ✅ Content Swipe
Swipe through AI-generated posts, save/discard with AI learning from preferences.

### ✅ Concept Mode
3-step flow: product → format → angle → generate.

### ✅ Clone Template
50 templates with categories (Café, Bakery, Restaurant, etc.), AI rebranding.

### ✅ Variations Mode
Generate 3-5 variations of saved posts.

### ✅ Post Editor
Canvas-based editor with Text/Logo/Layers tabs.

### ✅ Reel Generation (NEW)
- 2 styles: Cinematic Product Showcase, Casual Behind The Scenes
- FFmpeg video generation with Ken Burns effects
- 5-stage progress bar
- Costs 5 credits

### ✅ Photoshoot Mode (NEW)
- AI product photography with DALL-E 3
- Brief suggestions: Flat lay on marble, Rustic wooden table, etc.
- Costs 1 credit

### ✅ Inspo Gallery (NEW)
- Public gallery with category filters
- Clone for my brand functionality
- Opt-in sharing in DNA settings

### ✅ Calendar/Scheduler (NEW)
- Month/Week view toggle
- Click date to schedule
- Platform selection: Feed/Story/Reel
- Caption and hashtags

### ✅ Analytics Page (NEW)
- Connect Instagram or Demo mode
- Indian number format (8,54,200)
- Credits meter
- Best performing post

### ✅ Inbox (NEW)
- Connect Instagram to manage comments/DMs
- Placeholder when not connected

### ✅ Settings Page (NEW)
4 tabs:
- Profile: Brand name, email, phone, photo
- Integrations: Instagram, Swiggy/Zomato URLs, Delivery badges toggle
- Preferences: Language, Post format, Reel style, Notifications, Inspo sharing
- Billing: Credits meter, WhatsApp contact

### ✅ Library
Grid/Boards view, filtering, 3-dot menu actions, favourites.

### ✅ AI Chat Assistant
Right-sidebar chat powered by Gemini with Brand DNA context.

### ✅ Mobile Responsiveness
Hamburger menu opens full sidebar on mobile.

### ✅ WhatsApp Float
wa.me/919330408074 on all pages.

## User Credentials
- **Client:** test_client@example.com / testpass123
- **Admin:** adreej@frameflow.me / iamadreejandaarjavbanerjee6969

## API Endpoints
### Content Generation
- `POST /api/content-swipe/generate` - Generate swipe creatives
- `POST /api/concept/generate` - Generate concept post
- `POST /api/reel/generate` - Generate video reel (5 credits)
- `POST /api/photoshoot/generate` - Generate product photo (1 credit)
- `POST /api/variations/generate` - Generate variations

### Library & Media
- `GET /api/content-library` - Get library items
- `GET /api/library/boards` - Get boards
- `GET /api/templates/library` - Get templates
- `POST /api/templates/clone` - Clone template

### Inspo Gallery
- `GET /api/inspo/gallery` - Get public gallery
- `POST /api/inspo/clone` - Clone inspo post
- `POST /api/inspo/share` - Share to gallery

### Calendar
- `GET /api/calendar/posts` - Get scheduled posts
- `POST /api/calendar/schedule` - Schedule post
- `PUT /api/calendar/posts/{id}` - Update post
- `DELETE /api/calendar/posts/{id}` - Delete post

### Analytics & Inbox
- `GET /api/analytics/dashboard` - Get analytics
- `GET /api/inbox` - Get inbox (comments/DMs)

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/upload-photo` - Upload profile photo

## Deployment Files
- `frontend/vercel.json` - SPA rewrites
- `backend/Procfile` - Uvicorn startup
- `backend/requirements.txt` - Python dependencies

## Files Structure
```
/app/
├── backend/
│   ├── server.py
│   ├── ai_generation.py
│   ├── reel_generation.py
│   ├── Procfile
│   └── requirements.txt
└── frontend/
    ├── vercel.json
    └── src/
        ├── App.js
        ├── components/
        │   └── ClientLayout.js
        └── pages/
            ├── HomeDashboard.js
            ├── ReelGenerationPage.js
            ├── PhotoshootPage.js
            ├── InspoGalleryPage.js
            ├── CalendarPage.js
            ├── AnalyticsPage.js
            ├── InboxPage.js
            ├── SettingsPage.js
            └── ... (all other pages)
```

## Completed - March 2026
All features implemented and tested:
- Complete client dashboard rebuild
- Reel Generation with FFmpeg
- Photoshoot Mode with DALL-E 3
- Inspo Gallery with cloning
- Calendar/Scheduler
- Analytics with demo mode
- Inbox with Instagram integration placeholder
- Settings with 4 tabs
- Mobile responsiveness
- WhatsApp float on all pages
- All currency in INR (₹)
- No signup/register anywhere
