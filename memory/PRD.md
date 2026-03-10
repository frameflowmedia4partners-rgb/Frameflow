# Frameflow - AI Marketing Operating System for Cafés

## Product Overview
Frameflow is a production-ready SaaS platform that functions as an AI-powered social media team specifically for cafés and coffee shops.

---

## Current Status: CRITICAL BUGS FIXED ✅ (March 10, 2026)

### Critical Bug Fixes Completed

#### 1. Auth & Session Persistence ✅
- [x] JWT stored in localStorage with key `frameflow_token`
- [x] Super admin (`super_admin` role) redirects to `/admin` on login
- [x] Client user (`client_user` role) redirects to `/dashboard` (or `/onboarding` if not complete)
- [x] Page refresh maintains session - no logout on refresh
- [x] Role-based route protection implemented

#### 2. "Failed to Load" Crashes FIXED ✅
- [x] Dashboard handles null/missing brand data gracefully
- [x] Analytics shows demo data when Meta not connected
- [x] Scheduler handles empty scheduled posts
- [x] Content Library handles empty media
- [x] Campaigns page handles empty campaigns
- [x] Settings page handles null data
- [x] All pages show meaningful empty states instead of errors

#### 3. Signup Removal ✅
- [x] Auth page is login-only
- [x] No signup/register buttons anywhere
- [x] WhatsApp "Request Demo" button for new users

#### 4. WhatsApp Integration ✅
- [x] Floating WhatsApp button on ALL pages (bottom-right, green)
- [x] Links to: wa.me/919330408074
- [x] Present on: Dashboard, all client pages, Landing, Privacy Policy, Data Deletion

#### 5. Public Pages ✅
- [x] /privacy-policy - Accessible without login
- [x] /data-deletion - Accessible without login
- [x] Both have WhatsApp float button

---

## Working Features

### Authentication & Routing
- Login-only authentication (no signup)
- Role-based routing (super_admin → /admin, client_user → /dashboard)
- Session persistence with JWT in localStorage
- Onboarding redirect for new clients

### Admin Panel (/admin)
- Client management (list, create, edit, delete)
- View Dashboard (impersonation)
- Billing tracker (₹15,000/month per client)
- Payment status: Paid ✅ | Unpaid ⏳ | Overdue 🔴
- Admin stats dashboard

### Client Dashboard
- Quick actions (Content Studio, Schedule, Run Ads, Upload)
- Campaigns overview
- Content created stats
- Upcoming posts

### Content Creation
- Caption generation with AI
- Image generation
- Templates library
- Idea engine

### Other Client Features
- Content Library (media management)
- Scheduler (calendar view)
- Analytics (demo data when Meta not connected)
- Campaigns management
- Settings (Brand DNA, Meta Connection, Password, Billing)

---

## Credentials

### Super Admin Accounts
```
Admin 1:
  Email: adreej@frameflow.me
  Password: iamadreejandaarjavbanerjee6969

Admin 2:
  Email: deepesh@frameflow.me
  Password: deepesh@2005
```

### Test Client Account
```
Email: test_client@example.com
Password: testpass123
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User/Admin login
- `GET /api/auth/me` - Current user info
- `POST /api/auth/change-password` - Change password

### Admin Panel
- `GET /api/admin/clients` - List all clients
- `POST /api/admin/clients` - Create new client
- `GET /api/admin/clients/{id}` - Get client details
- `PUT /api/admin/clients/{id}` - Update client
- `DELETE /api/admin/clients/{id}` - Delete client
- `POST /api/admin/clients/{id}/reset-password` - Generate temp password
- `POST /api/admin/clients/{id}/impersonate` - Enter client dashboard
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/billing` - Billing overview
- `PUT /api/admin/billing/{id}` - Mark as paid/unpaid

### Client APIs
- `GET /api/brands` - Get user's brands
- `GET /api/brand` - Get current brand profile
- `PUT /api/brand` - Update brand profile
- `GET /api/projects` - Get projects
- `POST /api/projects` - Create project
- `GET /api/templates` - Get content templates
- `GET /api/scheduled-posts` - List scheduled posts
- `GET /api/campaigns` - List campaigns
- `GET /api/analytics` - Get analytics (demo or real)
- `GET /api/content-library` - Get media library
- `POST /api/posts/generate` - Generate post
- `POST /api/ideas/generate` - Generate idea

---

## Remaining Tasks (P1-P2)

### P1: Post Generation Enhancement
- [ ] Logo overlay at brand_dna.logo_position
- [ ] Watermark support
- [ ] Contact info overlay
- [ ] 1080x1080px feed, 1080x1920px stories output

### P1: Reel Generation with FFmpeg
- [ ] Video assembly with Ken Burns effect
- [ ] Text overlays from AI script
- [ ] Background music (royalty-free)
- [ ] Brand watermark burned in

### P2: Meta Campaigns
- [ ] Full campaign creation flow
- [ ] AI Audience Builder
- [ ] Meta Marketing API integration
- [ ] Real-time analytics

### P2: Real Meta Analytics
- [ ] Pull from Meta Graph API when connected
- [ ] Organic + Paid metrics
- [ ] All currency in ₹

---

## Test Reports
- `/app/test_reports/iteration_7.json` - Latest (100% pass, 17 tests)
- `/app/test_reports/iteration_6.json` - Previous session

---

## Technical Stack
- **Frontend:** React, React Router, TailwindCSS, Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT with localStorage

---

## Updated: March 10, 2026
