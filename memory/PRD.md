# Frameflow - AI Marketing Studio PRD

## Original Problem Statement
Complete rebuild of the Frameflow client dashboard with AI-powered content generation, credit system, and modern UI.

## Technology Stack
- **Backend:** FastAPI, MongoDB, Pillow (image compositing)
- **Frontend:** React, TailwindCSS, Shadcn/UI
- **AI (Text):** Gemini 2.0 Flash (via `GEMINI_API_KEY`)
- **AI (Image):** DALL-E 3 (via `OPENAI_API_KEY`)
- **Stock Media:** Pixabay API
- **Web Scraping:** BeautifulSoup
- **Authentication:** JWT in localStorage

## Core Features Implemented

### ✅ Brand DNA Onboarding
Multi-step wizard with animated progress bar:
1. Website scraping for automatic brand info extraction
2. Business details collection
3. Menu/products management
4. Brand identity (colors, fonts, tone)
5. Competitor analysis

### ✅ Credit System
- Monthly quota: 250 credits (default)
- Image posts: 1 credit
- Reels: 5 credits
- Credit meter displayed on dashboard
- Generation disabled when exhausted
- Admin can adjust limits

### ✅ Navigation Sidebar
Sections: Workspace (Home, Chat), Assets (Library, DNA, Inspo), Social (Calendar, Analytics), Settings

### ✅ Home Dashboard
- Personalized greeting: "Good morning, [Brand Name]"
- Credit meter with usage stats
- 2x3 creation mode grid cards

### ✅ Content Swipe
- Select number of creatives to generate
- AI generates using Brand DNA context
- Swipe UI to save/discard each creative
- Preferences logged for AI learning

### ✅ Concept Mode
3-step flow: product → format → angle → generates single creative

### ✅ Clone Template
- 50 pre-loaded templates
- Category filters (Café, Bakery, Restaurant, etc.)
- Search functionality
- AI rebrands with client's Brand DNA

### ✅ Variations Mode
- Select saved post from library
- AI generates 3-5 variations
- Different colors/headlines/angles

### ✅ Post Editor
- Live preview canvas
- Text editing (font, size, color, alignment)
- Logo placement
- Layer management
- Download/Save functionality

### ✅ Library
- Grid and Boards view toggle
- Filtering (Images, Videos, AI Generated, Scraped, etc.)
- 3-dot menu (Edit, Schedule, Generate Variations, Delete)
- Favourites support

### ✅ AI Chat Assistant
Right-sidebar chat powered by Gemini with Brand DNA context

### ✅ Mobile Responsiveness
- Hamburger menu on mobile
- Slide-out sidebar
- Responsive grid layouts

## User Credentials
- **Client:** test_client@example.com / testpass123
- **Admin:** adreej@frameflow.me / iamadreejandaarjavbanerjee6969

## API Endpoints
- `POST /api/auth/login` - Authentication
- `GET/PUT /api/brand-dna` - Brand DNA management
- `POST /api/brand-dna/scrape-website` - Website scraping
- `POST /api/content-swipe/generate` - Generate swipe creatives
- `POST /api/content-swipe/save-preference` - Save user preference for AI learning
- `POST /api/concept/generate` - Generate concept post
- `GET /api/templates/library` - Get templates
- `POST /api/templates/clone` - Clone and rebrand template
- `POST /api/variations/generate` - Generate variations
- `GET /api/content-library` - Get library items
- `GET /api/library/boards` - Get boards
- `POST /api/chat/completion` - AI chat

## Files Structure
```
/app/
├── backend/
│   ├── server.py          # FastAPI app with all endpoints
│   ├── ai_generation.py   # Gemini, DALL-E 3, Pillow logic
│   └── .env              # API keys
└── frontend/
    └── src/
        ├── App.js
        ├── components/
        │   └── ClientLayout.js
        └── pages/
            ├── HomeDashboard.js
            ├── BrandDNAPage.js
            ├── ContentSwipePage.js
            ├── ConceptPage.js
            ├── CloneTemplatePage.js
            ├── VariationsPage.js
            ├── PostEditorPage.js
            ├── LibraryPage.js
            └── AIChatPage.js
```

## Completed - March 2026
All P0 features implemented and tested:
- Complete client dashboard rebuild
- Brand DNA onboarding with web scraping
- Credit system (250/month)
- Content Swipe with AI generation
- Clone Template (50 templates)
- Variations mode
- Post Editor with canvas
- Library with Boards view
- Mobile responsiveness
- AI learning from swipe preferences
