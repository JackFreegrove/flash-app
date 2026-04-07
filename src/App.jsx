import { useState, useRef, useEffect, useCallback } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from './supabase';

const PRICES = {
  momento: 'price_1TFzdKRoyXRpjOGpQ1HHI9UM',
  classic: 'price_1TFzdtRoyXRpjOGpQTHJGKQ0',
  premium: 'price_1TFzexRoyXRpjOGpFMusLaZn',
  venuePartner: 'price_1TFzhARoyXRpjOGp4z6BAswn',
  archive: 'price_1TFzi0RoyXRpjOGpfO3J11AL',
};

const TIER_PHOTOS = {
  momento: 5,
  classic: 5,
  premium: 8,
  venuePartner: 10,
};
// ── Palette & helpers ──────────────────────────────────────────────────────────
const COLORS = {
  bg: "#F9F7F4",
  surface: "#FFFFFF",
  border: "#E8E4DF",
  text: "#1A1714",
  muted: "#8A847D",
  accent: "#2C2C2C",
  highlight: "#D4A853",
  danger: "#C0392B",
  success: "#27AE60",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Mono:wght@300;400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Mono', monospace;
    background: ${COLORS.bg};
    color: ${COLORS.text};
    min-height: 100vh;
  }

  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* NAV */
  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 32px;
    border-bottom: 1px solid ${COLORS.border};
    background: ${COLORS.surface};
  }
  .nav-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 300; letter-spacing: 0.05em;
  }
  .nav-logo span { font-style: italic; }
  .nav-tabs { display: flex; gap: 4px; }
  .nav-tab {
    padding: 6px 16px; border: 1px solid transparent; border-radius: 2px;
    font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.08em;
    text-transform: uppercase; cursor: pointer; background: none;
    color: ${COLORS.muted}; transition: all 0.2s;
  }
  .nav-tab.active {
    border-color: ${COLORS.accent}; color: ${COLORS.accent};
    background: ${COLORS.surface};
  }
  .nav-tab:hover:not(.active) { color: ${COLORS.text}; }

  /* MAIN */
  .main { flex: 1; padding: 48px 32px; max-width: 900px; margin: 0 auto; width: 100%; }

  /* SECTION TITLE */
  .section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36px; font-weight: 300; margin-bottom: 8px;
  }
  .section-title em { font-style: italic; color: ${COLORS.muted}; }
  .section-sub { font-size: 11px; color: ${COLORS.muted}; letter-spacing: 0.06em; margin-bottom: 40px; text-transform: uppercase; }

  /* CARD */
  .card {
    background: ${COLORS.surface}; border: 1px solid ${COLORS.border};
    border-radius: 2px; padding: 32px; margin-bottom: 20px;
  }
  .card-title { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: ${COLORS.muted}; margin-bottom: 20px; }

  /* FORM */
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .form-row.full { grid-template-columns: 1fr; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: ${COLORS.muted}; }
  .field input, .field select {
    padding: 10px 12px; border: 1px solid ${COLORS.border}; border-radius: 2px;
    font-family: 'DM Mono', monospace; font-size: 13px; background: ${COLORS.bg};
    color: ${COLORS.text}; outline: none; transition: border-color 0.2s;
  }
  .field input:focus, .field select:focus { border-color: ${COLORS.accent}; }

  /* TOGGLE */
  .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid ${COLORS.border}; }
  .toggle-row:last-child { border-bottom: none; }
  .toggle-label { font-size: 12px; }
  .toggle-desc { font-size: 10px; color: ${COLORS.muted}; margin-top: 2px; }
  .toggle {
    position: relative; width: 40px; height: 22px; cursor: pointer;
    background: ${COLORS.border}; border-radius: 11px; transition: background 0.2s; flex-shrink: 0;
  }
  .toggle.on { background: ${COLORS.accent}; }
  .toggle::after {
    content: ''; position: absolute; top: 3px; left: 3px;
    width: 16px; height: 16px; border-radius: 50%; background: white;
    transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .toggle.on::after { transform: translateX(18px); }

  /* BUTTON */
  .btn {
    padding: 12px 24px; border: none; border-radius: 2px; cursor: pointer;
    font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.08em;
    text-transform: uppercase; transition: all 0.2s;
  }
  .btn-primary { background: ${COLORS.accent}; color: white; }
  .btn-primary:hover { background: #000; }
  .btn-outline { background: none; border: 1px solid ${COLORS.border}; color: ${COLORS.text}; }
  .btn-outline:hover { border-color: ${COLORS.accent}; }
  .btn-gold { background: ${COLORS.highlight}; color: white; }
  .btn-gold:hover { background: #b8922e; }
  .btn-sm { padding: 8px 16px; font-size: 10px; }
  .btn-full { width: 100%; }

  /* QR CARD */
  .qr-card {
    background: ${COLORS.surface}; border: 1px solid ${COLORS.border};
    border-radius: 2px; padding: 40px; text-align: center; margin-bottom: 20px;
  }
  .qr-box {
    width: 180px; height: 180px; margin: 0 auto 24px;
    border: 1px solid ${COLORS.border}; display: flex; align-items: center;
    justify-content: center; position: relative; overflow: hidden;
  }
  .qr-box svg { width: 160px; height: 160px; }
  .qr-event-name {
    font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300;
    margin-bottom: 4px;
  }
  .qr-meta { font-size: 10px; color: ${COLORS.muted}; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 24px; }
  .qr-stats { display: flex; justify-content: center; gap: 32px; margin-top: 24px; padding-top: 24px; border-top: 1px solid ${COLORS.border}; }
  .qr-stat-val { font-size: 24px; font-family: 'Cormorant Garamond', serif; }
  .qr-stat-lbl { font-size: 10px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.06em; }

  /* ALBUM GRID */
  .album-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .album-reveal-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 14px; border: 1px solid ${COLORS.highlight};
    border-radius: 2px; font-size: 10px; color: ${COLORS.highlight}; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .album-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; }
  .album-photo {
    aspect-ratio: 1; overflow: hidden; position: relative;
    background: ${COLORS.border};
  }
  .album-photo img { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.05) saturate(0.9); }
  .photo-meta {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 6px 8px; background: rgba(0,0,0,0.45);
    font-size: 9px; color: rgba(255,255,255,0.85); letter-spacing: 0.05em;
  }
  .album-locked {
    text-align: center; padding: 80px 40px;
    border: 1px dashed ${COLORS.border}; border-radius: 2px;
  }
  .lock-icon { font-size: 40px; margin-bottom: 16px; opacity: 0.4; }
  .lock-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 300; margin-bottom: 8px; }
  .lock-sub { font-size: 11px; color: ${COLORS.muted}; }

  /* GUEST FLOW */
  .guest-wrap { max-width: 420px; margin: 0 auto; padding: 40px 20px; }
  .guest-header { text-align: center; margin-bottom: 40px; }
  .guest-event { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; margin-bottom: 4px; }
  .guest-sub { font-size: 10px; color: ${COLORS.muted}; letter-spacing: 0.08em; text-transform: uppercase; }

  /* CAMERA */
  .camera-wrap {
    background: #0D0D0D; border-radius: 2px; overflow: hidden;
    position: relative; aspect-ratio: 3/4; margin-bottom: 20px;
  }
  .camera-video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .camera-overlay {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    justify-content: space-between; padding: 20px;
  }
  .camera-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .shot-counter {
    background: rgba(0,0,0,0.6); color: white; padding: 6px 12px;
    border-radius: 2px; font-size: 11px; letter-spacing: 0.06em;
  }
  .camera-bottom { display: flex; justify-content: center; }
  .shutter {
    width: 68px; height: 68px; border-radius: 50%;
    border: 3px solid white; background: rgba(255,255,255,0.15);
    cursor: pointer; transition: all 0.1s; display: flex; align-items: center; justify-content: center;
  }
  .shutter:active { transform: scale(0.92); background: rgba(255,255,255,0.35); }
  .shutter-inner { width: 50px; height: 50px; border-radius: 50%; background: white; }
  .flash-overlay {
    position: absolute; inset: 0; background: white; opacity: 0;
    pointer-events: none; transition: opacity 0.05s;
  }
  .flash-overlay.flash { opacity: 1; }

  /* FILM STRIP */
  .film-strip { display: flex; gap: 4px; overflow-x: auto; padding: 4px 0; }
  .film-thumb {
    flex-shrink: 0; width: 64px; height: 64px; border-radius: 2px;
    overflow: hidden; border: 1px solid ${COLORS.border};
    background: #1a1a1a; position: relative;
  }
  .film-thumb img { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) saturate(0.85); }
  .film-thumb-empty { opacity: 0.25; }
  .film-thumb-num {
    position: absolute; top: 3px; right: 4px; font-size: 8px; color: rgba(255,255,255,0.6);
  }

  /* STEP INDICATOR */
  .steps { display: flex; gap: 6px; margin-bottom: 32px; }
  .step {
    flex: 1; height: 2px; border-radius: 1px; background: ${COLORS.border};
    transition: background 0.3s;
  }
  .step.done { background: ${COLORS.accent}; }

  /* DONE STATE */
  .done-wrap { text-align: center; padding: 60px 20px; }
  .done-title { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 300; margin-bottom: 12px; }
  .done-sub { font-size: 11px; color: ${COLORS.muted}; line-height: 1.7; }

  /* EVENT LIST */
  .event-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 0; border-bottom: 1px solid ${COLORS.border};
  }
  .event-item:last-child { border-bottom: none; }
  .event-name-sm { font-size: 14px; margin-bottom: 3px; }
  .event-detail { font-size: 10px; color: ${COLORS.muted}; letter-spacing: 0.04em; }
  .badge {
    font-size: 9px; letter-spacing: 0.07em; text-transform: uppercase;
    padding: 3px 8px; border-radius: 2px;
  }
  .badge-pending { background: #FEF3C7; color: #92400E; }
  .badge-live { background: #D1FAE5; color: #065F46; }
  .badge-locked { background: ${COLORS.border}; color: ${COLORS.muted}; }

  /* COUNTDOWN */
  .countdown { font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 300; text-align: center; margin: 12px 0; letter-spacing: 0.04em; }
  .countdown-lbl { text-align: center; font-size: 10px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.08em; }

  /* PERMISSIONS */
  .perm-wrap { text-align: center; padding: 60px 20px; }
  .perm-icon { font-size: 48px; margin-bottom: 20px; }
  .perm-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 300; margin-bottom: 8px; }
  .perm-sub { font-size: 11px; color: ${COLORS.muted}; line-height: 1.7; margin-bottom: 24px; }

  @media (max-width: 600px) {
    .main { padding: 32px 16px; }
    .form-row { grid-template-columns: 1fr; }
    .album-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

// ── Simple QR SVG (checkerboard pattern as QR placeholder) ────────────────────


// ── Countdown timer ───────────────────────────────────────────────────────────
function useCountdown(targetTime) {
  const [remaining, setRemaining] = useState(() => Math.max(0, targetTime - Date.now()));
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, targetTime - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTime]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { remaining, display: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` };
}

// ── AUTH: Sign Up ─────────────────────────────────────────────────────────────
function SignUp({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else onLogin();
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "40px 20px" }}>
      <div className="section-title">Create <em>Account</em></div>
      <div className="section-sub">Host your first event</div>
      <div className="card">
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Password</label>
          <input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div style={{ color: COLORS.danger, fontSize: 11, marginBottom: 12 }}>{error}</div>}
        <button className="btn btn-primary btn-full" onClick={handleSignUp} disabled={loading}>
          {loading ? "Creating account..." : "Create Account →"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: COLORS.muted }}>
          Already have an account? <span style={{ cursor: "pointer", color: COLORS.accent, textDecoration: "underline" }} onClick={() => onLogin("login")}>Sign in</span>
        </div>
      </div>
    </div>
  );
}

// ── AUTH: Login ───────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else onLogin();
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "40px 20px" }}>
      <div className="section-title">Welcome <em>Back</em></div>
      <div className="section-sub">Sign in to your account</div>
      <div className="card">
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Password</label>
          <input type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div style={{ color: COLORS.danger, fontSize: 11, marginBottom: 12 }}>{error}</div>}
        <button className="btn btn-primary btn-full" onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in..." : "Sign In →"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: COLORS.muted }}>
          New here? <span style={{ cursor: "pointer", color: COLORS.accent, textDecoration: "underline" }} onClick={() => onLogin("signup")}>Create account</span>
        </div>
      </div>
    </div>
  );
}
function PricingPage({ onSelect }) {
  const [loadingTier, setLoadingTier] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");

  const handleCheckout = async (priceId, tier) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { onSelect(tier); return; }
    setLoadingTier(tier);
    setCheckoutError("");
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          tier,
          mode: priceId === PRICES.archive ? 'subscription' : 'payment',
        }),
      });
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError('Something went wrong. Please try again.');
      setLoadingTier(null);
    }
  };


  const tiers = [
    { key: 'momento', label: 'Momento', price: '€59', guests: '30', photos: '5', life: '7 days', archive: 'Add-on', priceId: PRICES.momento },
    { key: 'classic', label: 'Classic', price: '€99', guests: '100', photos: '8', life: '14 days', archive: 'Add-on', priceId: PRICES.classic, popular: true },
    { key: 'premium', label: 'Premium', price: '€169', guests: 'Unlimited', photos: '10', life: '30 days', archive: '1 year free', priceId: PRICES.premium },
    { key: 'venuePartner', label: 'Venue Partner', price: '€299', guests: 'Unlimited', photos: '10', life: '60 days', archive: '2 years free', priceId: PRICES.venuePartner },
  ];

  return (
    <div>
      <div className="section-title">Choose your <em>Plan</em></div>
      <div className="section-sub">One payment. No subscription. Cancel anytime.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
        {tiers.map(tier => (
          <div key={tier.key} className="card" style={{ position: 'relative', border: tier.popular ? `2px solid ${COLORS.accent}` : undefined }}>
            {tier.popular && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: COLORS.accent, color: 'white', padding: '2px 14px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 2 }}>
                Most Popular
              </div>
            )}
            <div className="card-title">{tier.label}</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, marginBottom: 16 }}>{tier.price}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 20, lineHeight: 2 }}>
              <div>👥 {tier.guests} guests</div>
              <div>📷 {tier.photos} photos each</div>
              <div>⏱ Album live for {tier.life}</div>
              <div>🗄 Archive: {tier.archive}</div>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => handleCheckout(tier.priceId, tier.key)} disabled={loadingTier !== null}>
              {loadingTier === tier.key ? "Redirecting…" : "Book Now →"}
            </button>
          </div>
        ))}
      </div>
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="card-title">Archive Add-On</div>
        <p style={{ fontSize: 11, color: COLORS.muted, marginBottom: 16 }}>Keep your album forever. €15/year. Cancel anytime.</p>
        <button className="btn btn-outline" onClick={() => handleCheckout(PRICES.archive, 'archive')} disabled={loadingTier !== null}>
          {loadingTier === 'archive' ? "Redirecting…" : "Add Archive — €15/yr"}
        </button>
      </div>
      {checkoutError && <div style={{ color: COLORS.danger, fontSize: 11, marginTop: 12, textAlign: 'center' }}>{checkoutError}</div>}
    </div>
  );
}
// ── HOST: Create Event ────────────────────────────────────────────────────────
function CreateEvent({ onCreate, initialPhotos }) {
  const [form, setForm] = useState({
    name: "",
    date: "",
    photos: String(initialPhotos ?? 8),
    revealTime: "10:00",
    isPublic: false,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleCreate = async () => {
    if (!form.name || !form.date) return;
    setSaving(true);
    setSaveError("");
    const eventDate = new Date(form.date);
    const [rh, rm] = form.revealTime.split(":").map(Number);
    const revealDate = new Date(eventDate);
    revealDate.setDate(revealDate.getDate() + 1);
    revealDate.setHours(rh, rm, 0, 0);
    const { data, error } = await supabase.from('events').insert({
      name: form.name,
      date: form.date,
      photos_per_guest: Number(form.photos),
      reveal_time: revealDate.toISOString(),
      is_public: form.isPublic,
    }).select('id').single();
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    onCreate({ id: data.id, name: form.name, date: form.date, photos: Number(form.photos), revealDate, isPublic: form.isPublic, shotsTaken: [], guests: [] });
  };

  return (
    <div>
      <div className="section-title">Create <em>Event</em></div>
      <div className="section-sub">Set up your disposable camera album</div>

      <div className="card">
        <div className="card-title">Event Details</div>
        <div className="form-row">
          <div className="field">
            <label>Event Name</label>
            <input placeholder="Sarah & James Wedding" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div className="field">
            <label>Event Date</label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Photos per Guest</label>
            <select value={form.photos} onChange={e => set("photos", e.target.value)}>
              {[5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} photos</option>)}
            </select>
          </div>
          <div className="field">
            <label>Album Reveal Time (next day)</label>
            <input type="time" value={form.revealTime} onChange={e => set("revealTime", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Album Settings</div>
        <div className="toggle-row">
          <div>
            <div className="toggle-label">Public Album</div>
            <div className="toggle-desc">Anyone with the link can view after reveal</div>
          </div>
          <div className={`toggle ${form.isPublic ? "on" : ""}`} onClick={() => set("isPublic", !form.isPublic)} />
        </div>
        <div className="toggle-row">
          <div>
            <div className="toggle-label">Album expires after 2 weeks</div>
            <div className="toggle-desc">Photos automatically removed 14 days after reveal</div>
          </div>
          <div className="toggle on" style={{pointerEvents:"none"}} />
        </div>
      </div>

      {saveError && <div style={{ color: COLORS.danger, fontSize: 11, marginBottom: 12 }}>{saveError}</div>}
      <button className="btn btn-primary btn-full" onClick={handleCreate} disabled={saving}>
        {saving ? "Saving…" : "Generate QR Code →"}
      </button>
    </div>
  );
}

// ── HOST: QR + Dashboard ──────────────────────────────────────────────────────
function HostDashboard({ event, onViewAlbum, onNewEvent }) {
  const { display, remaining } = useCountdown(event.revealDate?.getTime() || 0);
  const revealed = remaining === 0;
  const qrRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    supabase
      .from('photos')
      .select('taker_name')
      .eq('event_id', event.id)
      .then(({ data }) => {
        if (data) {
          setPhotoCount(data.length);
          setGuestCount(new Set(data.map(r => r.taker_name)).size);
        }
      });
  }, [event.id]);

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `${event.name.replace(/\s+/g, '-')}-qr.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://flash-app-gamma.vercel.app/event/${event.id}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32}}>
        <div>
          <div className="section-title">{event.name}</div>
          <div className="section-sub">{event.isPublic ? "Public" : "Private"} · {event.photos} photos/guest · Expires in 14 days</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onNewEvent}>+ New Event</button>
      </div>

      <div className="qr-card">
        <div ref={qrRef} className="qr-box">
          <QRCodeSVG value={`https://flash-app-gamma.vercel.app/event/${event.id}`} size={160} />
        </div>
        <div className="qr-event-name">{event.name}</div>
        <div className="qr-meta">Scan to open camera · flash-app-gamma.vercel.app/event/{event.id}</div>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <button className="btn btn-outline btn-sm" onClick={downloadQR}>Download QR</button>
          <button className="btn btn-outline btn-sm" onClick={copyLink}>{copied ? "Copied!" : "Copy Link"}</button>
        </div>
        <div className="qr-stats">
          <div><div className="qr-stat-val">{guestCount}</div><div className="qr-stat-lbl">Guests</div></div>
          <div><div className="qr-stat-val">{photoCount}</div><div className="qr-stat-lbl">Photos</div></div>
          <div><div className="qr-stat-val">{event.photos}</div><div className="qr-stat-lbl">Per Guest</div></div>
        </div>
      </div>

      <div className="card" style={{textAlign:"center"}}>
        {revealed ? (
          <>
            <div className="card-title">Album Ready</div>
            <button className="btn btn-gold" onClick={onViewAlbum}>View Album →</button>
          </>
        ) : (
          <>
            <div className="countdown-lbl">Album reveals in</div>
            <div className="countdown">{display}</div>
            <div className="countdown-lbl" style={{marginTop:4}}>
              {event.revealDate.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})} at{" "}
              {event.revealDate.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}
            </div>
            <div style={{marginTop:20}}>
              <button className="btn btn-outline btn-sm" onClick={onViewAlbum}>Preview Album (Host Only)</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── HOST: Album View ──────────────────────────────────────────────────────────
function AlbumView({ event, onBack }) {
  const { remaining, display } = useCountdown(event.revealDate?.getTime() || 0);
  const revealed = remaining === 0;
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('photos')
      .select('id, taker_name, storage_path, taken_at')
      .eq('event_id', event.id)
      .order('taken_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setPhotos(data.map(row => ({
            url: supabase.storage.from('photos').getPublicUrl(row.storage_path).data.publicUrl,
            taker: row.taker_name,
            takenAt: row.taken_at,
          })));
        }
        setLoading(false);
      });
  }, [event.id]);

  if (!revealed) {
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32}}>
          <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
          <div>
            <div className="section-title" style={{marginBottom:0}}>{event.name}</div>
            <div className="section-sub" style={{marginBottom:0}}>Album locked until reveal</div>
          </div>
        </div>
        <div className="card" style={{textAlign:"center"}}>
          <div className="countdown-lbl">Album reveals in</div>
          <div className="countdown">{display}</div>
          <div className="countdown-lbl" style={{marginTop:4}}>
            {new Date(event.revealDate).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})} at{" "}
            {new Date(event.revealDate).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}
          </div>
          <div style={{marginTop:12,fontSize:10,color:COLORS.muted}}>{photos.length} photo{photos.length !== 1 ? "s" : ""} taken so far</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32}}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
        <div>
          <div className="section-title" style={{marginBottom:0}}>{event.name}</div>
          <div className="section-sub" style={{marginBottom:0}}>{photos.length} photos · {event.isPublic ? "Public" : "Private"}</div>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:"60px 20px",color:COLORS.muted,fontSize:12,letterSpacing:"0.06em"}}>Loading photos…</div>
      ) : photos.length === 0 ? (
        <div className="album-locked">
          <div className="lock-icon">📷</div>
          <div className="lock-title">No photos yet</div>
          <div className="lock-sub">Share the QR code and guests will start filling the album</div>
        </div>
      ) : (
        <div className="album-grid">
          {photos.map((p, i) => (
            <div className="album-photo" key={i}>
              <img src={p.url} alt="" loading="lazy" />
              <div className="photo-meta">{p.taker} · #{i + 1}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── GUEST: Camera ─────────────────────────────────────────────────────────────
function GuestCamera({ event, takerId }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [permDenied, setPermDenied] = useState(false);
  const [shots, setShots] = useState([]);
  const [flashing, setFlashing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const maxShots = event.photos;

  useEffect(() => {
    let s;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(stream => { s = stream; if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(() => setPermDenied(true));
    return () => s?.getTracks().forEach(t => t.stop());
  }, []);

  const takeShot = useCallback(async () => {
    if (shots.length >= maxShots || flashing || uploading) return;
    setFlashing(true);
    setTimeout(() => setFlashing(false), 150);

    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 400;
    c.height = v.videoHeight || 533;
    c.getContext("2d").drawImage(v, 0, 0);

    // Convert canvas to blob and upload
    c.toBlob(async (blob) => {
      if (!blob) return;
      setUploading(true);
      const path = `${event.id}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

      if (!uploadError) {
        await supabase.from('photos').insert({
          event_id: event.id,
          taker_name: takerId,
          storage_path: path,
        });
      }
      setUploading(false);

      const url = c.toDataURL("image/jpeg", 0.85);
      const newShots = [...shots, { url, taker: takerId, time: Date.now() }];
      setShots(newShots);
      if (newShots.length >= maxShots) {
        setTimeout(() => setDone(true), 600);
      }
    }, 'image/jpeg', 0.85);
  }, [shots, maxShots, flashing, uploading, takerId, event.id]);

  if (done) {
    return (
      <div className="guest-wrap">
        <div className="done-wrap">
          <div style={{fontSize:56,marginBottom:20}}>🎞️</div>
          <div className="done-title">Film developed.</div>
          <div className="done-sub">
            Your {maxShots} photos have been saved.<br />
            The album reveals on {new Date(event.revealDate).toLocaleDateString("en-US",{month:"long",day:"numeric"})} at{" "}
            {new Date(event.revealDate).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}.<br /><br />
            Thank you for being part of <em>{event.name}</em>.
          </div>
        </div>
      </div>
    );
  }

  if (permDenied) {
    return (
      <div className="guest-wrap">
        <div className="perm-wrap">
          <div className="perm-icon">📷</div>
          <div className="perm-title">Camera access needed</div>
          <div className="perm-sub">Please allow camera access in your browser settings to take photos.</div>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-wrap">
      <div className="guest-header">
        <div className="guest-event">{event.name}</div>
        <div className="guest-sub">Hello, {takerId}</div>
      </div>

      <div className="steps">
        {Array.from({ length: maxShots }).map((_, i) => (
          <div key={i} className={`step ${i < shots.length ? "done" : ""}`} />
        ))}
      </div>

      <div className="camera-wrap">
        <video ref={videoRef} className="camera-video" autoPlay playsInline muted />
        <canvas ref={canvasRef} style={{display:"none"}} />
        <div className={`flash-overlay ${flashing ? "flash" : ""}`} />
        <div className="camera-overlay">
          <div className="camera-top">
            <div className="shot-counter">{shots.length} / {maxShots}</div>
          </div>
          <div className="camera-bottom">
            <button className="shutter" onClick={takeShot} disabled={shots.length >= maxShots || uploading}>
              <div className="shutter-inner" style={uploading ? { opacity: 0.4 } : {}} />
            </button>
          </div>
        </div>
      </div>

      <div className="film-strip">
        {Array.from({ length: maxShots }).map((_, i) => (
          <div key={i} className={`film-thumb ${i >= shots.length ? "film-thumb-empty" : ""}`}>
            {shots[i] ? <img src={shots[i].url} alt="" /> : null}
            <div className="film-thumb-num">{i + 1}</div>
          </div>
        ))}
      </div>

      <div style={{marginTop:12, fontSize:10, color:COLORS.muted, textAlign:"center", letterSpacing:"0.05em"}}>
        No retakes · No filters · No previews
      </div>
    </div>
  );
}

// ── GUEST: Entry ──────────────────────────────────────────────────────────────
function GuestEntry({ event, onEnter }) {
  const [id, setId] = useState("");
  return (
    <div className="guest-wrap">
      <div className="guest-header">
        <div style={{fontSize:40,marginBottom:16}}>📷</div>
        <div className="guest-event">{event.name}</div>
        <div className="guest-sub">Disposable Camera · {event.photos} shots</div>
      </div>
      <div className="card">
        <div className="card-title">Your Name or Nickname</div>
        <div className="field" style={{marginBottom:16}}>
          <label>Taker ID</label>
          <input placeholder="e.g. Uncle Dave, Table 7…" value={id} onChange={e => setId(e.target.value)} onKeyDown={e => e.key === 'Enter' && id.trim() && onEnter(id.trim())} />
        </div>
        <div style={{fontSize:10,color:COLORS.muted,marginBottom:20,lineHeight:1.7}}>
          You'll get {event.photos} shots. No retakes, no filters, no preview. Album reveals the next day.
        </div>
        <button className="btn btn-primary btn-full" onClick={() => id.trim() && onEnter(id.trim())}>
          Open Camera →
        </button>
      </div>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
function rowToEvent(data) {
  return {
    id: data.id,
    name: data.name,
    date: data.date,
    photos: data.photos_per_guest,
    revealDate: new Date(data.reveal_time),
    isPublic: data.is_public,
    shotsTaken: [],
    guests: [],
  };
}

export default function App() {
  const [view, setView] = useState("pricing");
  const [event, setEvent] = useState(null);
  const [takerId, setTakerId] = useState("");
  const [user, setUser] = useState(null);
  const [initialPhotos, setInitialPhotos] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [eventNotFound, setEventNotFound] = useState(false);

  // Guest deep-link: /event/:id
  useEffect(() => {
    const match = window.location.pathname.match(/^\/event\/([^/]+)$/);
    if (!match) return;
    const eventId = match[1];
    setLoadingEvent(true);
    supabase.from('events').select('*').eq('id', eventId).single()
      .then(({ data, error }) => {
        setLoadingEvent(false);
        if (error || !data) { setEventNotFound(true); return; }
        setEvent(rowToEvent(data));
        setView("guest-entry");
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      const tier = params.get("tier");
      const photos = TIER_PHOTOS[tier] ?? null;
      setInitialPhotos(photos);
      setView("host-create");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && view === "login") setView("pricing");
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView("pricing");
  };

  const handleCreate = (ev) => { setEvent(ev); setView("host-dashboard"); };
  const handleGuestEnter = (id) => { setTakerId(id); setView("guest-camera"); };

  const tabs = [
    { id: "host", label: "Host View" },
    { id: "guest", label: "Guest View" },
  ];
  const activeTab = view === "guest-entry" || view === "guest-camera" ? "guest" : "host";

  const switchTab = (tab) => {
    if (tab === "host") setView(event ? "host-dashboard" : "pricing");
    else if (event) setView("guest-entry");
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <nav className="nav">
          <div className="nav-logo">flash<span>.</span></div>
          <div className="nav-tabs">
            {tabs.map(t => (
              <button key={t.id} className={`nav-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => switchTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          {user && (
            <button className="btn btn-outline btn-sm" onClick={handleSignOut}>Sign Out</button>
          )}
        </nav>

        <main className="main">
          {loadingEvent ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: COLORS.muted, fontSize: 12, letterSpacing: "0.06em" }}>
              Loading event…
            </div>
          ) : eventNotFound ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>📷</div>
              <div className="section-title">Event <em>not found</em></div>
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>This link may have expired or the event was removed.</div>
            </div>
          ) : (
            <>
              {view === "signup" && <SignUp onLogin={(v) => setView(v === "login" ? "login" : "pricing")} />}
              {view === "login" && <Login onLogin={(v) => v === "signup" ? setView("signup") : setView("pricing")} />}
              {view === "pricing" && <PricingPage onSelect={(tier) => user ? setView("host-create") : setView("signup")} />}
              {view === "host-create" && <CreateEvent onCreate={handleCreate} initialPhotos={initialPhotos} />}
              {view === "host-dashboard" && event && (
                <HostDashboard event={event} onViewAlbum={() => setView("host-album")} onNewEvent={() => setView("pricing")} />
              )}
              {view === "host-album" && event && (
                <AlbumView event={event} onBack={() => setView("host-dashboard")} />
              )}
              {view === "guest-entry" && event && (
                <GuestEntry event={event} onEnter={handleGuestEnter} />
              )}
              {view === "guest-camera" && event && (
                <GuestCamera event={event} takerId={takerId} />
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
