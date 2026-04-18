# Snapshot Co — Project Memory for Claude Code
# Auto-read at session start. Last updated: April 2026.

## WHAT THIS PRODUCT IS
Browser-based SaaS recreating the disposable camera experience at weddings and events.
Guests scan QR code → fixed photo limit → no retakes, no filters, no preview → album reveals next day.
No app download required. The constraints are the product.

## LIVE URLS
- App: flash-app-gamma.vercel.app
- Domain (purchased, not yet connected): EventSnapshotCo.com
- GitHub: github.com/JackFreegrove/flash-app
- Deployment: GitHub main → Vercel auto-deploy (~60 seconds)

## TECH STACK
- Frontend: React + Vite, JavaScript/JSX only (NO TypeScript)
- Styling: Plain CSS only (NO Tailwind, NO CSS frameworks)
- Auth: Supabase Auth (email/password)
- DB: Supabase PostgreSQL
- Storage: Supabase Storage (photos/{event_uuid}/{photo_uuid}.jpg)
- Payments: Stripe via Vercel serverless functions (/api directory)
- Hosting: Vercel

## CRITICAL RULES — NEVER VIOLATE
1. NEVER hardcode API keys, Stripe keys, or Supabase credentials in code
2. NEVER rename .flash-overlay, flashing, or setFlashing — these are the camera shutter effect
3. NEVER switch Stripe to live mode without explicit instruction
4. NEVER introduce TypeScript, Tailwind, or new UI libraries
5. NEVER modify Supabase RLS policies without showing exact SQL first for review
6. NEVER delete or overwrite working components without explicit confirmation
7. NEVER push without a descriptive commit message
8. ALWAYS explain what you are about to do in plain English before writing code
9. ALWAYS make one change at a time — confirm it works before proceeding
10. ALWAYS match existing code style and naming conventions

## PRICING (never change without instruction)
| Tier    | Price | Guests    | Photos | Album Life | Archive        |
|---------|-------|-----------|--------|------------|----------------|
| Momento | €59   | 30        | 3 each | 5 days     | Add-on €15/yr  |
| Classic | €99   | 100       | 5 each | 14 days    | Add-on €15/yr  |
| Premium | €199  | Unlimited | 10 each| 60 days    | 1 year free    |

Archive add-on: €15/year (subscription, separate from tier purchase)

Venue licensing (direct sales only — NOT on consumer pricing page):
- Partner €1,200/yr | Professional €2,500/yr | Enterprise €4,500/yr

## STRIPE PRICE IDs (TEST MODE)
- momento: price_1TME3URoyXRpjOGpiodxnPkb
- classic:  price_1TFzdtRoyXRpjOGpQTHJGKQ0
- premium:  price_1TME4QRoyXRpjOGpfiWHhcmB
- archive:  price_1TFzi0RoyXRpjOGpfO3J11AL

## DATABASE SCHEMA
```sql
events (id UUID PK, host_id UUID, name TEXT, event_date DATE, reveal_time TIMESTAMPTZ,
        photos_per_guest INT, max_guests INT, is_public BOOL, tier TEXT, created_at TIMESTAMPTZ)
guests (id UUID PK, event_id UUID FK, name TEXT, photos_taken INT DEFAULT 0, joined_at TIMESTAMPTZ)
photos (id UUID PK, event_id UUID FK, guest_id UUID FK, storage_path TEXT, taken_at TIMESTAMPTZ)
```

## ENVIRONMENT VARIABLES (Vercel + .env.local)
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY (server only — never expose to frontend)
VITE_STRIPE_PUBLISHABLE_KEY
STRIPE_PRICE_MOMENTO, STRIPE_PRICE_CLASSIC, STRIPE_PRICE_PREMIUM, STRIPE_PRICE_ARCHIVE

## FEATURE STATUS
### WORKING — DO NOT TOUCH
- Host auth (signup/login/logout) via Supabase
- Pricing page — 3 consumer tiers (Momento, Classic, Premium)
- Stripe checkout (TEST MODE)
- Event creation form
- QR code generation (links to eventsnapshotco.com/event/{id})
- Guest browser camera — rear camera, shot countdown
- Selfie/front camera toggle in GuestCamera.jsx
- Photo upload to Supabase Storage
- Album reveal with countdown timer
- Archive add-on subscription
- Vercel auto-deployment
- Security hardening
- UI/UX audit (11 findings fixed — iOS zoom, upload error handling, touch targets, accessibility, album fetch errors, pricing display)
- Critical bug fixes (April 2026):
  - Photo column names corrected (taker_id, created_at)
  - Photo insert error handling — failed uploads show error, retain shot
  - Stripe origin header fallback — checkout no longer breaks without Origin header
  - Reveal date guard — invalid dates no longer show album as immediately revealed
  - Timezone fix — reveal date parsed in local time not UTC
  - Auth crash fix — getSession uses optional chaining
  - QR download blob URL leak fixed
- Stripe webhook handler (April 2026) — payment bypass vulnerability resolved, entitlements written server-side on confirmed payment
- Pricing strategy update (April 2026):
  - Removed Venue Partner per-event tier, updated to 3-tier model
  - Momento repriced to €59 / 3 photos / 5-day album
  - Premium repriced to €199 / 10 photos / 60-day album
  - Pricing layout: Momento + Classic side-by-side, Premium full-width below
  - "Best Value" badge on Premium, "Most Popular" badge on Classic
  - Momento subtitle: "Ideal for hens, stags & small parties"
  - Album expiry is now tier-aware (5 / 14 / 60 days)
  - Stripe whitelist in api/create-checkout-session.js updated to match
- Privacy Policy + T&Cs page (/legal route)
- Guest session persistence (April 2026):
  - guest_sessions table with device fingerprint (localStorage UUID + event_id)
  - Returning guests blocked if completed, resumed with correct shot counter if incomplete
  - Session writes photos_taken + completed=true to Supabase on each upload
  - Email capture on done screen for public events
  - Host dashboard guest count reads guest_sessions rows
  - T&C checkbox moved above pricing cards — gates all Book Now buttons

### PENDING BUILD TASKS (priority order)
1. Connect EventSnapshotCo.com to Vercel (DNS — waiting on registrar details)
2. Switch Stripe test → live mode (only after task 1 complete)
3. Intermittent event creation bug — investigate and fix (sometimes fails on Supabase insert during event creation / QR generation)
4. Album sort/filter feature (chronological vs grouped by taker)
5. Album view UI refinement + merchandise CTA placeholder at reveal
6. Transactional email sequence via Resend (6 emails — see business plan)
7. hello@eventsnapshotco.com setup (after domain connected)
8. Landing page (after domain connected and Stripe live)

### FUTURE ONLY — DO NOT BUILD YET
- Physical photo album via Prodigi API
- Event merchandise (canvas, keyrings, mugs)
- Custom branding add-on (€49/event)
- Venue licensing portal

## HOW TO START EACH SESSION
Use this format:
[TASK]: What needs doing
[FILE]: Which file(s)
[CURRENT STATE]: What the code does now
[DESIRED STATE]: What it should do after
[CONSTRAINTS]: Any limitations
[DO NOT TOUCH]: Related code that must not change
