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

## PRICING — NEVER CHANGE
| Tier          | Price  | Mode           |
|---------------|--------|----------------|
| Momento       | €59    | One-off payment|
| Classic       | €99    | One-off payment|
| Premium       | €169   | One-off payment|
| Venue Partner | €299   | One-off payment|
| Archive add-on| €15/yr | Subscription   |

## PHOTOS PER GUEST (correct values)
- Momento: 5 photos
- Classic: 5 photos
- Premium: 8 photos
- Venue Partner: 10 photos

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
STRIPE_PRICE_MOMENTO, STRIPE_PRICE_CLASSIC, STRIPE_PRICE_PREMIUM
STRIPE_PRICE_VENUE_PARTNER, STRIPE_PRICE_ARCHIVE

## FEATURE STATUS
### WORKING — DO NOT TOUCH
- Host auth (signup/login/logout) via Supabase
- Pricing page, 4 tiers
- Stripe checkout (TEST MODE)
- Event creation form
- QR code generation (links to eventsnapshotco.com/event/{id})
- Guest browser camera — rear camera, shot countdown
- Photo upload to Supabase Storage
- Album reveal with countdown timer
- Archive add-on subscription
- Vercel auto-deployment

### PENDING BUILD TASKS (priority order)
1. Selfie/front camera toggle in GuestCamera.jsx
   - Button top-right of viewfinder, toggles facingMode "environment"/"user"
   - Shot count must NOT reset when switching cameras
   - Must work iOS Safari + Android Chrome
2. Connect EventSnapshotCo.com to Vercel (DNS only, no code)
3. Security hardening (done)
4. Switch Stripe test → live mode (only after tasks 2+3 complete)
5. Fix photos per guest to correct tier values (see above)
6. Privacy Policy + T&Cs page (/legal route)

### FUTURE ONLY — DO NOT BUILD YET
- Physical photo album via Prodigi API
- Event merchandise (canvas, keyrings, mugs)

## HOW TO START EACH SESSION
Use this format:
[TASK]: What needs doing
[FILE]: Which file(s)
[CURRENT STATE]: What the code does now
[DESIRED STATE]: What it should do after
[CONSTRAINTS]: Any limitations
[DO NOT TOUCH]: Related code that must not change
