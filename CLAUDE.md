# Snapshot Co — Project Memory for Claude Code
# Last updated: May 2026 (session 5 — forensic audit complete).

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
- Storage: Supabase Storage (bucket: `photos`)
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
11. NEVER split App.jsx into multiple files

## PRICING (never change without instruction)
| Tier    | Price | Guests    | Photos  | Album Life | Archive       |
|---------|-------|-----------|---------|------------|---------------|
| Momento | €59   | 30        | 3 each  | 5 days     | Add-on €15/yr |
| Classic | €99   | 100       | 5 each  | 14 days    | Add-on €15/yr |
| Premium | €199  | Unlimited | 10 each | 60 days    | 1 year free   |

Archive add-on: €15/year (subscription, separate from tier purchase)

Venue licensing (direct sales only — NOT on consumer pricing page):
- Partner €1,200/yr | Professional €2,500/yr | Enterprise €4,500/yr

## STRIPE PRICE IDs (TEST MODE)
- momento: price_1TME3URoyXRpjOGpiodxnPkb
- classic:  price_1TFzdtRoyXRpjOGpQTHJGKQ0
- premium:  price_1TME4QRoyXRpjOGpfiWHhcmB
- archive:  price_1TFzi0RoyXRpjOGpfO3J11AL

## DATABASE SCHEMA (actual — verified May 2026)
```sql
events      (id UUID PK, host_id UUID FK→auth.users, name TEXT, date DATE,
             photos_per_guest INT, reveal_time TIMESTAMPTZ, is_public BOOL DEFAULT false,
             tier TEXT, archived BOOL DEFAULT false, archive_expires_at TIMESTAMPTZ,
             expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now(),
             approved_at TIMESTAMPTZ nullable, is_demo BOOL DEFAULT false)

photos      (id UUID PK, event_id UUID FK,
             taker_name TEXT CHECK(len≤60),  -- stores display name string, NOT a UUID
             storage_path TEXT, created_at TIMESTAMPTZ DEFAULT now())

guest_sessions (id UUID PK, event_id UUID FK, device_fingerprint TEXT,
                taker_name TEXT CHECK(len≤60), email TEXT nullable,
                photos_taken INT DEFAULT 0, completed BOOL DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT now())

entitlements   (id UUID PK, user_id UUID, tier TEXT, used BOOL DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT now())
```

Dropped in forensic audit: `guests` table (was legacy, 0 rows), `photos.guest_id` column (was unused).

Storage path format: `{event-id}/{sanitised taker name} {shot number}.jpg`
e.g. `a3f8b2c1-4d2e-…/Uncle Dave 3.jpg`
If `sanitiseName(takerName)` returns empty (e.g. all-emoji input), `'guest'` is used as fallback.

## ENVIRONMENT VARIABLES (Vercel + .env.local)
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY (server only — used by webhook + checkout JWT validation)
STRIPE_SECRET_KEY (server only — never expose to frontend)
STRIPE_WEBHOOK_SECRET (server only)
VITE_STRIPE_PUBLISHABLE_KEY
STRIPE_PRICE_MOMENTO, STRIPE_PRICE_CLASSIC, STRIPE_PRICE_PREMIUM, STRIPE_PRICE_ARCHIVE

## KEY CODE CONVENTIONS
- DB columns are snake_case; JS state uses camelCase. `rowToEvent()` is the single mapping function.
- `taker_name` in both `photos` and `guest_sessions` stores a guest display name string (e.g. "Uncle Dave") — it is NOT a foreign key.
- `upsert: true` on storage uploads is intentional — prevents orphaned file blocking retry when DB insert fails after a successful upload.
- All magic values (timings, storage keys, tier data, canvas sizes, JPEG quality, etc.) live in the module-level constants block at the top of App.jsx. Add new ones there — do not inline them.
- `sanitiseName()` is a module-level utility. Do not redefine it inline.
- Blob URLs from `URL.createObjectURL()` are used for local shot previews in GuestCamera and are revoked on unmount via a dedicated cleanup effect.
- Photos are resized to `MAX_PHOTO_DIMENSION` (1200px long edge) before upload.

## FEATURE STATUS — WORKING (DO NOT TOUCH)
- Host auth (signup/login/logout) via Supabase
- Pricing page — 3 consumer tiers with T&C gate on all Book Now buttons
- Stripe checkout (TEST MODE) + webhook handler (entitlements written server-side)
- Event creation form with tier guard + retry on Supabase insert
- QR code generation (links to eventsnapshotco.com/event/{id}) + PNG download
- Guest browser camera — rear/front toggle, shot countdown, film strip thumbnails
- Photo capture: resize to 1200px → JPEG 0.85 → upload with retry → createObjectURL preview
- Album reveal with countdown timer (tier-aware expiry: 5/14/60 days)
- Archive add-on subscription (€15/yr)
- Host approval gate — public albums require host sign-off before guests can view
- Guest-facing album view (GuestAlbumView) — read-only, 3-column grid
- Guest session persistence — device fingerprint, resume with correct shot count, email capture
- Demo event flow (admin-only: eventsnapshotco@gmail.com)
- Host dashboard with guest/photo counts, QR card, approval prompt
- HostDashboardEmpty shown when no active event
- Page refresh restores host event state from Supabase
- Payment polling with linear backoff (2s × attempt, up to 5 attempts)
- Privacy Policy + T&Cs page (/legal route)
- Vercel auto-deployment
- Checkout endpoint validates caller via Supabase JWT (Authorization header checked server-side with service role client — userId no longer trusted from request body)
- Camera page locks proactively at reveal: 30s interval disables shutter and shows message without requiring a tap first

### PENDING BUILD TASKS

**Infrastructure (blocking)**
- Connect EventSnapshotCo.com to Vercel (DNS — waiting on registrar transfer)
- Stripe test → live: DO NOT switch without explicit instruction. Only after DNS connected.

**Feature tasks (ready to build)**
- Task 7: Download All button (host album view)
- Task 8: Album sort toggle (chronological vs grouped by taker)
- Task 9: Merchandise CTA placeholder at reveal

**Blocked**
- Task 5: Transactional email via Resend — blocked on domain registrar transfer
- Task 6: 6-email sequence (see business plan) — blocked on Task 5

### FUTURE ONLY — DO NOT BUILD YET
- Physical photo album via Prodigi API
- Event merchandise (canvas, keyrings, mugs)
- Custom branding add-on (€49/event)
- Venue licensing portal

## HOW TO START EACH SESSION
[TASK]: What needs doing
[FILE]: Which file(s)
[CURRENT STATE]: What the code does now
[DESIRED STATE]: What it should do after
[CONSTRAINTS]: Any limitations
[DO NOT TOUCH]: Related code that must not change
