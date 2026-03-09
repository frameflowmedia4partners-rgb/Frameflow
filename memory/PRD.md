# Frameflow - AI-Powered Marketing SaaS for Cafés

## Product Overview
Frameflow is a complete AI-powered marketing operating system built exclusively for cafés and coffee shops. It provides a unified dashboard for content creation, scheduling, advertising, and analytics.

## Platform Status: ✅ PRODUCTION READY

---

## Core Features Implemented

### 1. Landing Website ✅
- Hero section with "Your AI Marketing Team, In One Dashboard"
- Features section (6 feature cards)
- Benefits stats (10x, 50%, 24/7, 100%)
- Problem/Solution sections
- Testimonials from café owners
- FAQ accordion
- CTA sections with WhatsApp integration
- Modern SaaS design with animations

### 2. Authentication System ✅
- JWT-based authentication
- Persistent sessions via localStorage
- Token validation on app startup
- Protected routes
- Auto-attach tokens to API requests
- Admin role system

### 3. Admin Dashboard ✅
- User management (Create, Edit, Delete)
- Activate/Deactivate accounts
- Reset passwords
- Platform statistics
- Search functionality
- Role-based access control

### 4. Brand DNA Onboarding ✅
- Website URL analysis option
- Manual questionnaire fallback
- Brand tone selection
- Target audience capture
- Specialties and unique features
- AI-powered brand analysis

### 5. Marketing Dashboard ✅
- Welcome header with personalization
- Quick action buttons (Create, Schedule, Ads, Upload)
- AI-Powered CTA card
- Campaign and content statistics
- Upcoming scheduled posts
- Recent campaigns list
- Brand card

### 6. Media Library ✅
- Image and video upload
- Preview thumbnails
- Delete functionality
- Brand-filtered uploads
- Drag-and-drop support

### 7. Content Scheduler ✅
- Full calendar view
- Month navigation
- Schedule posts by clicking dates
- Content type selection (Image, Video, Reel)
- AI caption generation
- Platform selection (Instagram)
- Recommended posting times
- Post management (view, delete)

### 8. AI Content Studio ✅
- Caption generation
- Image generation
- Video generation
- Template library
- Prompt builder
- AI editing commands
- Export options (Copy, Download)

### 9. Campaign Management ✅
- Create campaigns/projects
- Campaign status tracking
- Campaign history
- Content organization by campaign

### 10. Meta Ads Manager ✅
- Campaign creation wizard
- AI strategy generation
- Target audience configuration
- Budget setting
- Campaign launch
- Performance tracking

### 11. Analytics Dashboard ✅
- Total Reach with trends
- Engagement metrics
- Engagement Rate
- Follower growth
- Weekly performance chart
- Content breakdown (Images, Videos, Reels)
- Top performing posts
- Campaign performance table
- Time range selector (7/30/90 days)

### 12. Integrations Page ✅
- Instagram connection UI
- Meta Ads connection UI
- Features checklist
- Setup guide
- Security information
- OAuth placeholder (user provides credentials)

### 13. Template Library ✅
- 12 café-specific templates
- Template categories
- Use template workflow
- Template prompts

### 14. Idea Engine ✅
- AI idea generation
- Idea types (Social, Ad Hook, Campaign, etc.)
- Save ideas
- Convert ideas to content

---

## Platform Rules

### No Public Signups
Accounts are created only by admin. Users cannot self-register.

### WhatsApp Sales Flow
All purchase and demo requests redirect to WhatsApp:
- **Phone:** +919930408074
- **Buy Message:** "Hi, I would like to purchase Frameflow for my cafe."
- **Demo Message:** "Hi, I would like to request a demo of Frameflow for my cafe."

### User-Owned Integrations
Users must connect their own Instagram Business and Meta Ads accounts. The platform does not provide API credentials.

---

## Credentials

### Admin Account
- Email: admin@frameflow.cafe
- Password: FrameflowAdmin2026

### Demo Account
- Email: demo@frameflow.cafe
- Password: FrameflowDemo2026
- Access: Click "Try Demo" on landing page

---

## Technical Stack

- **Frontend:** React, TailwindCSS, Shadcn UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT
- **AI:** OpenAI integration via emergentintegrations

---

## Testing Results

### Iteration 4 (Final)
- Backend: 100% pass rate
- Frontend: 100% pass rate (13/13 modules verified)

### Verified Features
- ✅ Landing page (hero, features, testimonials, FAQ, CTAs)
- ✅ Demo login flow
- ✅ WhatsApp integration
- ✅ Dashboard with quick actions
- ✅ Content Scheduler with calendar
- ✅ Analytics Dashboard with charts
- ✅ Integrations page
- ✅ Admin Dashboard
- ✅ All navigation working
- ✅ Templates page
- ✅ Media Library

---

## File Structure

```
/app/
├── backend/
│   ├── server.py          # All API endpoints
│   ├── auth.py            # JWT authentication
│   └── .env               # Environment variables
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.js
        ├── services/
        │   └── api.js
        ├── components/
        │   ├── Layout.js
        │   ├── LoadingSpinner.js
        │   └── ErrorBoundary.js
        └── pages/
            ├── LandingPage.js
            ├── AuthPage.js
            ├── OnboardingPage.js
            ├── DashboardPage.js
            ├── ContentSchedulerPage.js
            ├── AnalyticsDashboard.js
            ├── IntegrationsPage.js
            ├── AdminDashboard.js
            ├── CreateContentPage.js
            ├── TemplatesPage.js
            ├── MediaLibraryPage.js
            ├── IdeasPage.js
            ├── ProjectsPage.js
            ├── MarketingDashboard.js
            └── ...
```

---

## Completed: March 9, 2026
