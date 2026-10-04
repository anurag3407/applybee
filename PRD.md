# Product Requirements Document (PRD)

## Project Name: ReachBee AI (Autonomous Career Outreach Co-Pilot & Contact Intelligence)
**Version:** 1.0  
**Target Launch:** Q4 2026  
**Status:** Ready for Engineering  
**Primary Tech Stack:** Next.js 15, Clerk, Neon PostgreSQL, Upstash Redis, Razorpay, Gmail API, Gemini Flash

---

## 1. Executive Summary & Value Proposition

### 1.1 The Problem
Traditional job boards (LinkedIn, Indeed) suffer from severe applicant saturation: popular job listings receive 500+ applicants within hours, routing 95% of resumes into Automated Tracking System (ATS) black holes. 

Existing contact aggregators (such as ApplyBee) only provide static lists of generic HR emails with copy-paste templates. These lead to:
1. Low response rates (<2%) because HR receives hundreds of identical blasts.
2. High friction: Candidates must manually copy emails, open Gmail, upload resumes, write pitches, and send one by one.
3. Lack of personalization: Generic templates get marked as spam.

### 1.2 The Solution
**ReachBee AI** is an autonomous career outreach platform that merges **Decision-Maker Intelligence** with an **Agentic 1-Click Gmail Drafting Engine**:
- **Discovery:** Instant access to verified Technical Hiring Managers, Engineering Leads, and Founders across high-growth startups and Tier-1 enterprises.
- **Agentic Drafting:** In 1 click, the AI reads the candidate's uploaded resume, matches their technical achievements to the company's stack, writes a 75-word bespoke email, attaches the PDF resume, and stages a ready-to-send draft directly in the user's personal **Gmail Drafts folder**.

---

## 2. Target Audience & User Personas

1. **Tech Grads & Students:** Seeking internships and junior roles; need maximum outreach leverage with minimal budget.
2. **Laid-Off Engineers:** Experienced developers seeking direct conversations with Engineering Directors, bypassing HR screening.
3. **Active Job Switchers:** Working professionals who lack the time to manually write dozens of tailored cover emails every evening.

---

## 3. Product Architecture & Technical Stack

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND CLIENT                                │
│                   Next.js 15 (App Router) + Tailwind + shadcn/ui             │
└──────────────────────┬───────────────────────────────┬───────────────────────┘
                       │                               │
                       ▼                               ▼
       ┌──────────────────────────────┐ ┌──────────────────────────────┐
       │     AUTHENTICATION & USER    │ │       PAYMENT GATEWAY        │
       │       Clerk Auth + Google    │ │          Razorpay            │
       │       OAuth Token Exchange   │ │   (UPI, QR, Cards, Webhooks) │
       └──────────────┬───────────────┘ └──────────────┬───────────────┘
                      │                                │
                      ▼                                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND & API LAYER                                │
│                   Next.js Route Handlers / Server Actions                    │
├──────────────────────────────────────────────────────────────────────────────┤
│  • Upstash Redis: Rate limiting, session caching, idempotent webhook locks   │
│  • Neon Serverless PostgreSQL: Relational DB with connection pooling         │
│  • Google Gemini Flash: High-speed resume parsing & bespoke email drafting   │
│  • Gmail REST API: Direct RFC 2822 MIME draft injection (gmail.compose)      │
│  • UploadThing / Cloudflare R2: Secure resume PDF storage                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Tech Stack Specifications:
* **Frontend:** Next.js 15, React 19, Tailwind CSS, shadcn/ui, Lucide Icons, Framer Motion.
* **Authentication:** **Clerk** (Handles user login, session management, and Google OAuth credentials with offline access).
* **Database:** **Neon PostgreSQL** (Serverless Postgres with native branching, pooling, and Drizzle/Prisma ORM).
* **Cache & Rate Limiting:** **Upstash Redis** (`@upstash/ratelimit` for API rate limits and idempotent payment locks).
* **Payments:** **Razorpay** (Standard Checkout.js modal supporting Indian UPI, Credit/Debit Cards, NetBanking, and Webhook verification).
* **AI Engine:** **Google AI Studio (Gemini 1.5 / 2.0 Flash)** for resume entity extraction and personalized pitch drafting.
* **Email Automation:** Google OAuth 2.0 with `https://www.googleapis.com/auth/gmail.compose` scope.

---

## 4. Pricing & Monetization Model

The pricing structure is designed to offer a competitive base database price while monetizing the high-value agentic drafting features.

| Tier | Price (INR) | Contact Reveals (DB) | AI Agent Gmail Drafts | Key Features Included |
| :--- | :--- | :--- | :--- | :--- |
| **Free Starter** | ₹0 | 5 Contacts | 2 AI Resume Drafts | Instant trial, test Gmail integration, test email verification. |
| **Database Explorer (Base)** | **₹150** (one-time) | **1,000 Contacts** | 0 Drafts | Full directory access, Tier-1 + startups, search & filters, verified emails. |
| **Plus Plan** | **₹249** (one-time) | **1,500 Contacts** | **50 Auto-Drafts** | DB access + 50 bespoke emails drafted with attached resume directly in Gmail. |
| **Ultra / Gold Plan** | **₹399** (one-time) | **3,000 Contacts** | **200 Custom Drafts** | Deep company tech-stack matching, priority hiring managers, 200 drafts. |

### Add-On Packs (For users who already have DB credits):
* **Drafting Booster:** ₹200 for 50 additional custom AI Resume Drafts.
* **Power Outreach Pack:** ₹400 for 200 additional Deep-Custom AI Resume Drafts.

---

## 5. Core Features & Functional Requirements

### Feature 1: Decision-Maker Directory (The Discovery Engine)
1. **Search & Filters:**
   * Filter by **Role:** Engineering Manager, Tech Lead, VP of Engineering, Recruiter, Founder.
   * Filter by **Location:** Bengaluru, NCR, Mumbai, Hyderabad, Remote, US.
   * Filter by **Company Tier:** Tier-1 (Google, Amazon, Zomato, Swiggy), Unicorns, Early-Stage Startups.
2. **Contact Card Data:**
   * Full Name, Current Title, Company Name, LinkedIn URL, Verified Work Email, Deliverability Score (>95%).
3. **Action Triggers:**
   * `[Reveal Email]`: Deducts 1 Contact Credit. Displays email and reveals copy button.
   * `[⭐ Draft to Gmail]`: Deducts 1 Contact Credit + 1 Draft Credit. Opens drafting preview.

---

### Feature 2: Resume Ingestion & Intelligence
1. **PDF Upload:**
   * User uploads their resume (`.pdf`, max 5MB).
   * File is uploaded securely to Cloudflare R2 / UploadThing.
2. **AI Resume Parser (Gemini Flash):**
   * Extracts candidate's core stack (e.g. `Next.js, Python, PostgreSQL, Docker`).
   * Extracts top 2 measurable projects or accomplishments.
   * Extracts GitHub and Portfolio URLs.
   * Caches parsed JSON into Neon PostgreSQL under `resumes` table.

---

### Feature 3: Agentic Gmail Drafting Engine (The Killer Feature)
1. **Permission Model:**
   * User clicks *"Connect Gmail"*. Clerk authenticates Google OAuth requesting only the `https://www.googleapis.com/auth/gmail.compose` scope.
2. **Draft Generation Process:**
   * The Agent pairs the candidate's parsed resume with the recipient's company profile.
   * Generates a concise, high-converting 75-word email pitch following the "Proof-of-Work" formula:
     * *Observation:* Mentions company's engineering focus.
     * *Proof:* Matches 1 direct project from the user's resume solving a similar problem.
     * *Call to Action:* Polite 10-minute chat request.
3. **MIME Construction & Direct Injection:**
   * The server constructs an RFC 2822 multipart MIME payload.
   * Injects the candidate's PDF resume as an attachment.
   * Dispatches `POST https://gmail.googleapis.com/gmail/v1/users/me/drafts` using the user's OAuth access token.
   * User gets a toast notification: *"Draft successfully created in your Gmail! Check your drafts folder."*

---

### Feature 4: Razorpay Payment & Credit Ledger
1. **Order Creation:** Client requests order with `plan_id`. Backend creates order via Razorpay Orders API.
2. **Checkout Modal:** Razorpay Checkout.js opens, accepting UPI (GPay, PhonePe, Paytm), Netbanking, and Cards.
3. **Webhook Verification & Idempotency:**
   * Razorpay sends `payment.captured` webhook.
   * Backend verifies HMAC SHA256 signature using Razorpay Webhook Secret.
   * Uses **Upstash Redis** `SETNX` lock on `razorpay_payment_id` to prevent double-crediting.
   * Increments `contact_credits` and `draft_credits` atomically in Neon PostgreSQL.

---

## 6. Database Schema Design (Neon PostgreSQL)

```sql
-- 1. USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    plan_tier VARCHAR(50) DEFAULT 'free', -- free, base, plus, ultra
    contact_credits INT DEFAULT 5,
    draft_credits INT DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RESUMES TABLE
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    parsed_skills JSONB,
    parsed_highlights JSONB,
    portfolio_url TEXT,
    github_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CONTACTS DIRECTORY TABLE
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    company_domain VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    linkedin_url TEXT,
    tier VARCHAR(50) DEFAULT 'startup', -- tier1, unicorn, startup
    is_hiring_manager BOOLEAN DEFAULT FALSE,
    accuracy_rate INT DEFAULT 95,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. UNLOCKED CONTACTS (User history)
CREATE TABLE user_unlocked_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, contact_id)
);

-- 5. AGENT DRAFT JOBS LOG
CREATE TABLE draft_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    gmail_draft_id VARCHAR(255),
    email_subject TEXT NOT NULL,
    email_body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'drafted', -- drafted, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TRANSACTIONS & PAYMENTS
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(255),
    amount_inr INT NOT NULL,
    plan_tier VARCHAR(50) NOT NULL,
    contact_credits_added INT NOT NULL,
    draft_credits_added INT NOT NULL,
    status VARCHAR(50) DEFAULT 'created', -- created, paid, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 7. Security, Rate Limiting & Google OAuth Compliance

1. **Google OAuth Scope Minimization:**
   * ONLY request `https://www.googleapis.com/auth/gmail.compose`.
   * Never request `gmail.readonly` or full `gmail.send`. This drastically simplifies Google's verification process and reassures users that their personal inboxes are unread.
2. **Upstash Redis Rate Limiting:**
   * Prevent automated abuse of contact reveal and draft generation endpoints:
     * Reveal endpoint: 30 requests / minute per user.
     * Draft creation endpoint: 10 requests / minute per user.
3. **Data Protection:**
   * Encrypt stored Google OAuth refresh tokens at rest in Neon PostgreSQL using AES-256-GCM.
   * Candidate resumes stored in private buckets with time-limited signed URLs.

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Days 1–2)
* Initialize Next.js 15 repository with Tailwind and shadcn/ui.
* Configure Clerk Authentication with Google Social Login.
* Setup Neon PostgreSQL database with Drizzle/Prisma schema.
* Seed directory with initial 1,000+ verified hiring manager contacts.

### Phase 2: Ingestion & Razorpay Payments (Days 3–4)
* Implement Resume Upload component + Cloudflare R2 / UploadThing storage.
* Integrate Gemini Flash for resume skills and project extraction.
* Integrate Razorpay Checkout.js modal and secure backend webhook route with Upstash Redis locks.

### Phase 3: Agentic Gmail Drafting Engine (Days 5–6)
* Implement Google OAuth token exchange for `gmail.compose` scope.
* Build MIME multipart email builder with attached PDF resume bytes.
* Connect draft generation button to Gmail REST API (`/users/me/drafts`).
* Build credit counter and deduction logic in database.

### Phase 4: Polish & Launch (Day 7)
* Add filterable search table, credit balance badges, and landing page pricing cards.
* End-to-end testing of payments, contact reveals, and draft generation.
* Deploy to Vercel production.
