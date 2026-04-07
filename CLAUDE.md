# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

There are no tests configured in this project.

## Architecture

**Flash** is a disposable camera-style photo app for events. Hosts create an event and share a QR code; guests scan it, take photos, and the album is revealed after a configured delay.

### Stack
- **Frontend**: React 19 SPA (Vite, JSX, no TypeScript)
- **Backend**: Single Vercel serverless function (`api/create-checkout-session.js`) — creates Stripe checkout sessions
- **Auth & DB**: Supabase (`src/supabase.js`) — email/password auth
- **Payments**: Stripe — one-time payments + optional annual subscription (archive add-on)
- **Deployment**: Vercel

### Frontend structure (`src/App.jsx`)

The entire app lives in one ~860-line file. View state is managed with a single `view` state variable that switches between named views. There is no router.

Views and their roles:
- `signup` / `login` — Supabase auth
- `pricing` — `PricingPage` component, 4 tiers + archive add-on via Stripe
- `create-event` — `CreateEvent` form (event config: guest limit, photos/guest, reveal time, expiry)
- `host-dashboard` — `HostDashboard` QR code display, live stats, countdown timer (`useCountdown` hook)
- `album` — `AlbumView` photo gallery
- `guest-entry` — `GuestEntry` taker ID input
- `guest-camera` — `GuestCamera` camera capture (no retakes, no preview)

### Styling approach

All CSS is injected via a `<style>` tag inside `App.jsx` using a template literal (`const css = \`...\``). A `COLORS` constant holds the design tokens. Fonts: Cormorant Garamond (headings, serif) and DM Mono (body, monospace).

### Environment variables

| Variable | Used in |
|---|---|
| `VITE_SUPABASE_URL` | `src/supabase.js` |
| `VITE_SUPABASE_ANON_KEY` | `src/supabase.js` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `src/App.jsx` (loadStripe) |
| `STRIPE_SECRET_KEY` | `api/create-checkout-session.js` (server-side only) |

`VITE_` prefixed variables are bundled into the client. `STRIPE_SECRET_KEY` must remain server-side only.

### Stripe price IDs

Hardcoded in `App.jsx` as `PRICES`:
- `momento`, `classic`, `premium`, `venuePartner` — one-time payments
- `archive` — recurring subscription (€15/year)

The serverless function (`api/create-checkout-session.js`) accepts `{ priceId, tier, mode }` where `mode` is `"payment"` or `"subscription"`.
