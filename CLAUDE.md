# Snapshot Co — Project Memory for Claude Code
# Last updated: 7 June 2026 (session 6 — email sequence, storage cleanup, compression)

---

## 1. PROJECT OVERVIEW

Browser-based SaaS recreating the disposable camera experience at weddings and events.
Guests scan a QR code → fixed photo limit → no retakes, no filters, no preview → album reveals next day.
No app download required. The constraints are the product.

**Stripe is in TEST MODE. Do not switch to live without explicit instruction from Jack.**

### URLs
| | |
|---|---|
| Vercel (live) | flash-app-gamma.vercel.app |
| Domain (purchased, DNS not yet connected) | eventsnapshotco.com |
| GitHub | github.com/JackFreegrove/flash-app |
| Deployment | GitHub main → Vercel auto-deploy (~60 seconds) |

---

## 2. TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8, JavaScript/JSX only — NO TypeScript |
| Styling | Plain CSS only — NO Tailwind, NO CSS frameworks |
| Auth | Supabase Auth (email/password) |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage (bucket: `photos`) |
| Payments | Stripe (TEST MODE) via Vercel serverless functions (`/api`) |
| Email | Resend (`hello@eventsnapshotco.com`) |
| Hosting | Vercel (Hobby plan — one daily cron included) |
| Repo | GitHub (`JackFreegrove/flash-app`) |

**Dev machine:** Windows 11 Pro — **Project path:** `C:\Users\Jack\flash-app`

Key dependencies (from package.json):
- `@supabase/supabase-js` ^2.99.2
- `stripe` ^21.0.1, `@stripe/stripe-js` ^9.0.0
- `resend` ^6.12.4
- `fflate` ^0.8.3 (zip for Download All)
- `qrcode.react` ^4.2.0

---

## 3. FILE STRUCTURE

```
flash-app/
├── api/                              # Vercel serverless functions
│   ├── create-checkout-session.js    # POST — creates Stripe checkout (JWT-authenticated)
│   ├── stripe-webhook.js             # POST — writes entitlements, sends Email 1
│   ├── send-email.js                 # Shared Resend wrapper — imported by all email handlers
│   ├── email-templates.js            # All 6 HTML email template functions
│   ├── send-event-created.js         # POST — sends Email 2 (event created + QR URL)
│   ├── cron-reveal-notify.js         # GET — sends Emails 3+4 at reveal (DORMANT — needs Pro)
│   ├── cron-expiry-warn.js           # GET — sends Emails 5+6 at 48h before expiry (DORMANT)
│   └── cron-cleanup-storage.js       # GET — deletes storage for expired events (daily, 03:00 UTC)
├── src/
│   ├── App.jsx                       # SINGLE FILE — all components and logic. DO NOT SPLIT.
│   ├── supabase.js                   # Supabase client (anon key, frontend only)
│   └── ...
├── public/
│   └── logo.svg
├── vercel.json                       # Rewrites + active cron (cleanup-storage only)
├── DORMANT_CRONS.md                  # Cron entries ready to activate on Vercel Pro
├── CLAUDE.md                         # This file
└── package.json
```

**Do not touch without explicit confirmation:**
- `src/App.jsx` — do not split into multiple files (Rule 11)
- `.flash-overlay`, `flashing`, `setFlashing` — camera shutter effect (Rule 2)
- All Supabase RLS policies (Rule 5)
- `upsert: true` on all Supabase Storage uploads (intentional — prevents orphaned-file blocking retry)

---

## 4. CONSTANTS & PRICING

### Stripe Price IDs (TEST MODE)
```js
const PRICES = {
  momento: 'price_1TME3URoyXRpjOGpiodxnPkb',
  classic:  'price_1TFzdtRoyXRpjOGpQTHJGKQ0',
  premium:  'price_1TME4QRoyXRpjOGpfiWHhcmB',
  archive:  'price_1TFzi0RoyXRpjOGpfO3J11AL',
};
```

### Tier configuration
```js
const TIER_PHOTOS      = { momento: 3,  classic: 5,  premium: 10 };
const TIER_EXPIRY_DAYS = { momento: 5,  classic: 14, premium: 60 };
```

### Consumer pricing (never change without instruction)
| Tier    | Price | Guests    | Photos  | Album Life | Archive       |
|---------|-------|-----------|---------|------------|---------------|
| Momento | €59   | 30        | 3 each  | 5 days     | Add-on €15/yr |
| Classic | €99   | 100       | 5 each  | 14 days    | Add-on €15/yr |
| Premium | €199  | Unlimited | 10 each | 60 days    | 1 year free   |

Archive add-on: €15/year (Stripe subscription, separate from tier purchase)

Venue licensing (direct sales only — NOT on consumer pricing page):
- Partner €1,200/yr | Professional €2,500/yr | Enterprise €4,500/yr

### Other module-level constants (App.jsx)
```js
const ADMIN_EMAIL        = 'eventsnapshotco@gmail.com';   // demo event creation
const MAX_PHOTO_DIMENSION = 1200;                          // long-edge px cap before upload
const MAX_UPLOAD_BYTES   = 800 * 1024;                    // 800 KB target for compression loop
const QUALITY_STEPS      = [0.85, 0.75, 0.65, 0.55];     // adaptive JPEG quality steps
const QR_CANVAS_SIZE     = 400;
const GUEST_NAME_MAX_LEN = 60;
```

All magic values live in the module-level constants block at the top of `App.jsx`. Add new ones there — never inline them.

---

## 5. DATABASE SCHEMA

RLS is enabled on all tables. Never modify RLS policies without showing exact SQL to Jack first.

```sql
events (
  id                  UUID PK,
  host_id             UUID FK → auth.users,
  name                TEXT,
  date                DATE,
  photos_per_guest    INT,
  reveal_time         TIMESTAMPTZ,
  is_public           BOOL DEFAULT false,
  tier                TEXT,
  archived            BOOL DEFAULT false,
  archive_expires_at  TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  approved_at         TIMESTAMPTZ,                  -- added April 2026
  is_demo             BOOL DEFAULT false,
  storage_cleaned     BOOL NOT NULL DEFAULT false,  -- added 7 June 2026
  reveal_notified_at  TIMESTAMPTZ,                  -- added 7 June 2026
  expiry_notified_at  TIMESTAMPTZ                   -- added 7 June 2026
)

photos (
  id            UUID PK,
  event_id      UUID FK → events,
  taker_name    TEXT CHECK(length ≤ 60),   -- display name string, NOT a UUID/FK
  storage_path  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
)

guest_sessions (
  id                 UUID PK,
  event_id           UUID FK → events,
  device_fingerprint TEXT,
  taker_name         TEXT CHECK(length ≤ 60),
  email              TEXT,
  photos_taken       INT DEFAULT 0,
  completed          BOOL DEFAULT false,
  created_at         TIMESTAMPTZ DEFAULT now()
)

entitlements (
  id         UUID PK,
  user_id    UUID,
  tier       TEXT,     -- 'momento' | 'classic' | 'premium' | 'archive'
  used       BOOL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

Dropped in forensic audit (May 2026): `guests` table (was legacy, 0 rows), `photos.guest_id` column (was unused).

**Storage path format:** `{event-id}/{sanitised taker name} {shot number}.jpg`
e.g. `a3f8b2c1-4d2e-…/Uncle Dave 3.jpg`
If `sanitiseName(takerName)` returns empty (e.g. all-emoji input), `'guest'` is used as fallback.

---

## 6. WHAT IS BUILT AND WORKING

### Core product
- Host auth (signup/login/logout) via Supabase
- Pricing page — 3 consumer tiers with T&C gate on all Book Now buttons
- Stripe checkout (TEST MODE) + webhook handler (entitlements written server-side)
- Event creation form with tier guard + retry on Supabase insert
- QR code generation (links to `eventsnapshotco.com/event/{id}`) + PNG download
- Guest browser camera — rear/front toggle, shot countdown, film strip thumbnails
- Photo capture: resize to 1200px long edge → adaptive JPEG compression (target 800 KB, quality loop 0.85 → 0.55) → upload with retry → createObjectURL preview
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
- Checkout endpoint validates caller via Supabase JWT (Authorization header, service role client — userId no longer trusted from request body)
- Camera page locks proactively at reveal (30s interval, no tap required)
- Download All button in host album view (zip via fflate)
- Album sort toggle — chronological vs grouped by photographer

### Serverless hardening (7 June 2026)
- 10s AbortController timeout on `supabase.auth.getUser` in `create-checkout-session.js` (Promise.race + AbortController)
- 10s AbortController timeout on entitlement DB write in `stripe-webhook.js` (`.abortSignal()`)
- Stripe SDK `{ timeout: 10_000 }` per-request option on checkout session creation
- Timeout in webhook returns 200 (not 503) to prevent Stripe retrying and creating duplicate entitlements

### Email sequence (7 June 2026)
All emails sent from `hello@eventsnapshotco.com` via Resend. Failures are silent to the user (logged only).

| # | Email | Trigger | Status |
|---|---|---|---|
| 1 | Purchase confirmation | Stripe webhook `checkout.session.completed` | **Live** — fire-and-forget after entitlement write |
| 2 | Event created + QR URL | App.jsx `handleCreate` after Supabase insert | **Live** — POST to `/api/send-event-created`, fire-and-forget |
| 3 | Album reveal | Cron: `reveal_time <= now() AND reveal_notified_at IS NULL` | **Built, dormant** — needs Vercel Pro |
| 5 | 48h expiry warning | Cron: `expires_at <= now()+48h AND expiry_notified_at IS NULL` | **Built, dormant** |
| 6 | Archive upsell | Same cron tick as Email 5 (skipped if archive entitlement exists) | **Built, dormant** |

Idempotency: `reveal_notified_at` and `expiry_notified_at` columns on `events` prevent duplicate sends.

### Storage cleanup cron (7 June 2026)
- Handler: `api/cron-cleanup-storage.js`
- Schedule: daily 03:00 UTC (`0 3 * * *`) — **active**, Hobby-compatible
- Deletes storage for events where `expires_at <= now() AND archived = false AND archive_expires_at IS NULL AND storage_cleaned = false`
- Belt-and-suspenders: also skips if host has an `archive` entitlement row
- Batch deletes in groups of 100; marks `storage_cleaned = true` only after all batches succeed
- Logs: events processed, events skipped, files deleted, errors

---

## 7. KNOWN OUTSTANDING TASKS

| Task | Blocker |
|---|---|
| Activate dormant email crons (Emails 3–6) | Vercel Pro upgrade (~Wednesday week). See DORMANT_CRONS.md |
| Supabase Pro upgrade | Same date — prevents free tier pausing under load |
| Switch Stripe to live mode | After Professional Indemnity Insurance confirmed. **DO NOT switch without explicit instruction.** |
| Professional Indemnity Insurance | ~€300–500/year — Jack to arrange |
| Connect EventSnapshotCo.com to Vercel | DNS — waiting on domain registrar transfer |
| Tighten Storage SELECT RLS policy | Guests should only be able to read their own event's photos |
| Transactional email domain auth | hello@eventsnapshotco.com sending via Resend — confirm DKIM/SPF once DNS is live |

### Future only — do not build yet
- Physical photo album via Prodigi API
- Event merchandise (canvas, keyrings, mugs)
- Custom branding add-on (€49/event)
- Venue licensing portal

---

## 8. ENVIRONMENT VARIABLES

| Variable | Scope | Sensitivity |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend + Server | Low |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Low |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | **High — never expose to frontend** |
| `STRIPE_SECRET_KEY` | Server only | **High** |
| `STRIPE_WEBHOOK_SECRET` | Server only | **High** |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend | Low |
| `STRIPE_PRICE_MOMENTO` | Server | Low |
| `STRIPE_PRICE_CLASSIC` | Server | Low |
| `STRIPE_PRICE_PREMIUM` | Server | Low |
| `STRIPE_PRICE_ARCHIVE` | Server | Low |
| `RESEND_API_KEY` | Server only (Production + Preview) | **High** |

All server-only variables are set in Vercel dashboard. Frontend variables prefixed `VITE_` are also in `.env.local` for local dev.

---

## 9. CODING RULES — NEVER VIOLATE

1. NEVER hardcode API keys, Stripe keys, or Supabase credentials in code
2. NEVER rename `.flash-overlay`, `flashing`, or `setFlashing` — these are the camera shutter effect
3. NEVER switch Stripe to live mode without explicit instruction
4. NEVER introduce TypeScript, Tailwind, or new UI libraries
5. NEVER modify Supabase RLS policies without showing exact SQL first for review
6. NEVER delete or overwrite working components without explicit confirmation
7. NEVER push without a descriptive commit message
8. ALWAYS explain what you are about to do in plain English before writing code
9. ALWAYS make one change at a time — confirm it works before proceeding
10. ALWAYS match existing code style and naming conventions
11. NEVER split App.jsx into multiple files
12. NEVER modify email templates without confirming the change with Jack first

---

## 10. KEY CODE CONVENTIONS

- DB columns are `snake_case`; JS state uses `camelCase`. `rowToEvent()` is the single mapping function.
- `taker_name` in both `photos` and `guest_sessions` stores a guest display name string (e.g. "Uncle Dave") — it is NOT a foreign key.
- `upsert: true` on storage uploads is intentional — prevents orphaned file blocking retry when DB insert fails after a successful upload.
- All magic values live in the module-level constants block at the top of `App.jsx`. Add new ones there — do not inline them.
- `sanitiseName()` is a module-level utility. Do not redefine it inline.
- Blob URLs from `URL.createObjectURL()` are used for local shot previews in `GuestCamera` and are revoked on unmount via a dedicated cleanup effect.
- Serverless functions create their own Supabase client using the service role key directly — they do not import from `src/supabase.js`.
- Email failures are always silent to the user — log with `console.error`, never surface in UI.

### Components in App.jsx
`SignUp` · `Login` · `PrivacyPage` · `TermsPage` · `PricingPage` · `CreateEvent` · `HostDashboardEmpty` · `HostDashboard` · `AlbumView` · `EmailCapture` · `GuestCamera` · `GuestEntry` · `GuestAlbumView`

---

## 11. DEPLOYMENT WORKFLOW

```bash
git add <files>
git commit -m "type: description"
git push origin main
# Vercel auto-deploys in ~60 seconds
```

Always use descriptive commit messages. Never push without one.

---

## 12. DORMANT CRONS

See `DORMANT_CRONS.md` in the project root.

To activate on Vercel Pro: move both entries into the `"crons"` array in `vercel.json` and redeploy.

```json
{ "path": "/api/cron-reveal-notify", "schedule": "0 * * * *" },
{ "path": "/api/cron-expiry-warn",   "schedule": "0 * * * *" }
```

Both handlers are fully built and tested. The only blocker is the Vercel Pro plan (required for hourly schedules).

---

## HOW TO START EACH SESSION

```
[TASK]: What needs doing
[FILE]: Which file(s)
[CURRENT STATE]: What the code does now
[DESIRED STATE]: What it should do after
[CONSTRAINTS]: Any limitations
[DO NOT TOUCH]: Related code that must not change
```
