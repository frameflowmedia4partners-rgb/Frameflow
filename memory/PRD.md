# Frameflow - AI Marketing Operating System for Cafés

## Product Overview
Frameflow is a production-ready SaaS platform that functions as an AI-powered social media team specifically for cafés and coffee shops.

---

## Current Status: MAJOR RESTRUCTURING COMPLETE ✅

### Completed in This Session (March 10, 2026)

#### Section 1: Auth - Login Only ✅
- [x] Removed ALL signup functionality from codebase
- [x] Login page with email/password only
- [x] WhatsApp "Request Demo" button (links to +919330408074)
- [x] Failed login: "Account not found. Please contact your administrator."
- [x] JWT auth with 7-day sessions
- [x] Onboarding redirect for new clients (onboarding_complete flag)

#### Section 2: Roles & Admin Panel ✅
- [x] Two roles: super_admin | client_user
- [x] Two super admin accounts in MongoDB:
  - adreej@frameflow.me / iamadreejandaarjavbanerjee6969
  - deepesh@frameflow.me / deepesh@2005
- [x] Admin Panel at /admin route with:
  - Client Management table (Name, Email, Plan Start, Payment, Last Login, Status, Actions)
  - Add New Client modal
  - Edit client functionality
  - Reset password (generates one-time temp password with copy button)
  - Delete client with confirmation
  - "View Dashboard" impersonation mode
- [x] Billing Tracker (₹15,000 monthly retainer per client)
  - Payment status: Paid ✅ | Unpaid ⏳ | Overdue 🔴
  - Summary cards: Total Revenue, Paid this month, Unpaid, Overdue
- [x] Admin Stats view
- [x] Super admins auto-redirect to /admin on login

#### Section 3: Onboarding Wizard ✅
- [x] 4-step wizard with progress bar:
  1. Brand Assets (logo + sample posts → AI vision analysis)
  2. Business Info + Website Scraping
  3. Connect Meta (OAuth flow)
  4. Confirmation summary
- [x] Brand DNA extraction from uploaded images
- [x] Website scraping for images and content
- [x] onboarding_complete flag management

#### Section 13: WhatsApp Integration ✅
- [x] Login page: "Request a Demo" WhatsApp button
- [x] Dashboard navbar: WhatsApp support icon
- [x] Floating WhatsApp button on ALL pages (bottom-right, green)
- [x] All links to: wa.me/919330408074

#### Section 14: Global Rules Applied ✅
- [x] All currency in ₹ INR (₹15,000 monthly fee)
- [x] MongoDB collections: users, brand_profiles, content_library, scheduled_posts, idea_bank, billing_records, admin_notes, scraped_media, campaigns
- [x] Super admin credentials in .env
- [x] Meta OAuth uses platform-level credentials
- [x] Frameflow logo + name in navbar/footer

#### Section 15: Privacy Policy & Data Deletion ✅
- [x] /privacy-policy - Public page (no login required)
- [x] /data-deletion - Public page with WhatsApp contact
- [x] Meta Platform Policy compliance
- [x] Links in footer on all pages

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

### Environment Variables (.env)
```
ADMIN1_EMAIL=adreej@frameflow.me
ADMIN1_PASS=iamadreejandaarjavbanerjee6969
ADMIN2_EMAIL=deepesh@frameflow.me
ADMIN2_PASS=deepesh@2005
META_APP_ID=[to be added]
META_APP_SECRET=[to be added]
META_REDIRECT_URI=[to be added]
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
- `POST /api/admin/notes` - Send note to client
- `GET /api/admin/notes/{id}` - Get notes for client

### Onboarding
- `POST /api/onboarding/brand-assets` - Step 1: Upload & analyze
- `POST /api/onboarding/business-info` - Step 2: Save info & scrape
- `POST /api/onboarding/complete` - Mark onboarding done

### Content Generation
- `POST /api/posts/generate` - Generate branded post
- `POST /api/reels/generate` - Generate reel concept
- `POST /api/ideas/generate` - Generate marketing idea
- `POST /api/ideas/save` - Save to idea bank
- `GET /api/ideas` - Get saved ideas

### Scheduler
- `GET /api/scheduled-posts` - List scheduled posts
- `POST /api/scheduled-posts` - Create scheduled post
- `PUT /api/scheduled-posts/{id}` - Update post
- `DELETE /api/scheduled-posts/{id}` - Delete post

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/{id}/status` - Update status
- `DELETE /api/campaigns/{id}` - Delete campaign

### Analytics
- `GET /api/analytics` - Get analytics (live or demo)
- `GET /api/analytics/best-times` - Best posting times

### Integrations
- `GET /api/integrations/status` - Get Meta connection status
- `GET /api/integrations/meta/oauth-url` - Start OAuth flow
- `GET /api/integrations/meta/callback` - OAuth callback
- `DELETE /api/integrations/meta` - Disconnect Meta

### Content Library
- `GET /api/content-library` - List media
- `POST /api/content-library` - Upload media
- `DELETE /api/content-library/{id}` - Delete media

---

## Database Schema

### users
```
{
  id: string,
  email: string,
  password_hash: string,
  full_name: string,
  role: "super_admin" | "client_user",
  is_active: boolean,
  onboarding_complete: boolean,
  plan_start_date: string,
  last_login: string,
  created_at: string
}
```

### brand_profiles
```
{
  id: string,
  user_id: string,
  name: string,
  tagline: string,
  phone: string,
  address: string,
  website_url: string,
  logo_url: string,
  brand_dna: {
    logo_position: string,
    primary_colors: [string],
    font_style: string,
    brand_tone: string
  },
  facebook_access_token: string (encrypted),
  instagram_accounts: [object],
  scraped_data: object
}
```

### billing_records
```
{
  id: string,
  user_id: string,
  amount: number (15000),
  due_date: string,
  status: "paid" | "unpaid",
  paid_date: string
}
```

---

## Remaining Tasks

### P1: Post Generation (Section 5)
- [ ] Media sourcing from content_library → scraped_data → AI generation
- [ ] Logo overlay at brand_dna.logo_position
- [ ] Watermark at brand_dna.watermark_position
- [ ] Contact info overlay
- [ ] 1080x1080px feed, 1080x1920px stories output

### P2: Reel Generation with FFmpeg (Section 6)
- [ ] Video assembly with Ken Burns effect
- [ ] Text overlays from AI script
- [ ] Background music (royalty-free)
- [ ] Brand watermark burned in

### P3: Meta Campaigns (Section 7)
- [ ] Full campaign creation flow
- [ ] AI Audience Builder
- [ ] Meta Marketing API integration
- [ ] Real-time analytics

### P4: Content Library Fixes (Section 8)
- [ ] Keyword-based filenames
- [ ] Auto-tagging
- [ ] Usage tracking

### P5: Scheduler Fixes (Section 9)
- [ ] Month/week calendar toggle
- [ ] Drag-and-drop posts
- [ ] Meta Graph API publishing

### P6: Analytics - Real Data (Section 10)
- [ ] Pull from Meta Graph API
- [ ] Organic + Paid metrics
- [ ] All currency in ₹

### P7: Idea Engine Speed Fix (Section 11)
- [ ] Switch to streaming API (typewriter effect)
- [ ] Ideas appear in 2-3 seconds

### P8: Settings Page (Section 12)
- [ ] Brand DNA tab
- [ ] Meta Connection tab
- [ ] Password tab
- [ ] Billing tab (client view)

---

## Test Reports
- `/app/test_reports/iteration_6.json` - Current session tests (100% pass)

---

## Updated: March 10, 2026
