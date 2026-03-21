import { useState, useRef, useEffect, useCallback } from "react";
import { QRCodeSVG } from 'qrcode.react';
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
  const [remaining, setRemaining] = useState(0);
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

// ── Fake photos (colored placeholders with grain) ────────────────────────────
const FAKE_PHOTOS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80",
  "https://images.unsplash.com/photo-1529636444744-adffc9135a5e?w=400&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&q=80",
];

// ── HOST: Create Event ────────────────────────────────────────────────────────
function CreateEvent({ onCreate }) {
  const [form, setForm] = useState({
    name: "",
    date: "",
    photos: "8",
    revealTime: "10:00",
    isPublic: false,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = () => {
    if (!form.name || !form.date) return;
    // Reveal = next day at chosen time
    const eventDate = new Date(form.date);
    const [rh, rm] = form.revealTime.split(":").map(Number);
    const revealDate = new Date(eventDate);
    revealDate.setDate(revealDate.getDate() + 1);
    revealDate.setHours(rh, rm, 0, 0);
    onCreate({ ...form, id: Date.now().toString(36), revealDate, photos: Number(form.photos), shotsTaken: [], guests: [] });
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

      <button className="btn btn-primary btn-full" onClick={handleCreate}>
        Generate QR Code →
      </button>
    </div>
  );
}

// ── HOST: QR + Dashboard ──────────────────────────────────────────────────────
function HostDashboard({ event, onViewAlbum, onNewEvent }) {
  const { display, remaining } = useCountdown(event.revealDate?.getTime() || 0);
  const revealed = remaining === 0;
  const guestCount = event.guests?.length || 0;
  const photoCount = event.shotsTaken?.length || 0;

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
        <div className="qr-box">
          <QRCodeSVG value={`https://flash.app/event/${event.id}`} size={160} />
        </div>
        <div className="qr-event-name">{event.name}</div>
        <div className="qr-meta">Scan to open camera · flash.app/event/{event.id}</div>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <button className="btn btn-outline btn-sm">Download QR</button>
          <button className="btn btn-outline btn-sm">Copy Link</button>
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
              {new Date(event.revealDate).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})} at{" "}
              {new Date(event.revealDate).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}
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
  const { remaining } = useCountdown(event.revealDate?.getTime() || 0);
  const revealed = remaining === 0;
  const photos = event.shotsTaken || [];

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32}}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
        <div>
          <div className="section-title" style={{marginBottom:0}}>{event.name}</div>
          <div className="section-sub" style={{marginBottom:0}}>{photos.length} photos · {event.isPublic ? "Public" : "Private"}</div>
        </div>
      </div>

      {!revealed && (
        <div style={{marginBottom:20}}>
          <div className="album-reveal-badge">⏳ Locked — not yet revealed to guests</div>
        </div>
      )}

      {photos.length === 0 ? (
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
  const [stream, setStream] = useState(null);
  const [permDenied, setPermDenied] = useState(false);
  const [shots, setShots] = useState([]);
  const [flashing, setFlashing] = useState(false);
  const [done, setDone] = useState(false);
  const maxShots = event.photos;

  useEffect(() => {
    let s;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(stream => { s = stream; setStream(stream); if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(() => setPermDenied(true));
    return () => s?.getTracks().forEach(t => t.stop());
  }, []);

  const takeShot = useCallback(() => {
    if (shots.length >= maxShots || flashing) return;
    setFlashing(true);
    setTimeout(() => setFlashing(false), 150);

    // Capture from video or use placeholder
    let url;
    if (videoRef.current && canvasRef.current) {
      const v = videoRef.current;
      const c = canvasRef.current;
      c.width = v.videoWidth || 400;
      c.height = v.videoHeight || 533;
      c.getContext("2d").drawImage(v, 0, 0);
      url = c.toDataURL("image/jpeg", 0.85);
    } else {
      url = FAKE_PHOTOS[shots.length % FAKE_PHOTOS.length];
    }

    const newShots = [...shots, { url, taker: takerId, time: Date.now() }];
    setShots(newShots);
    if (newShots.length >= maxShots) {
      setTimeout(() => setDone(true), 600);
    }
  }, [shots, maxShots, flashing, takerId]);

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
            <button className="shutter" onClick={takeShot} disabled={shots.length >= maxShots}>
              <div className="shutter-inner" />
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
          <input placeholder="e.g. Uncle Dave, Table 7…" value={id} onChange={e => setId(e.target.value)} />
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

// ── DEMO EVENT ────────────────────────────────────────────────────────────────
const DEMO_EVENT = {
  id: "demo123",
  name: "Sarah & James Wedding",
  date: "2026-03-12",
  photos: 8,
  isPublic: false,
  revealDate: new Date(Date.now() + 3 * 3600 * 1000), // reveals in 3 hrs
  guests: ["Aunt Mary", "Uncle Dave"],
  shotsTaken: FAKE_PHOTOS.map((url, i) => ({
    url, taker: ["Aunt Mary","Uncle Dave","Cousin Al","Table 5"][i % 4], time: Date.now() - i * 60000
  })),
};

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("host-dashboard"); // host-create | host-dashboard | host-album | guest-entry | guest-camera
  const [event, setEvent] = useState(DEMO_EVENT);
  const [takerId, setTakerId] = useState("");

  const handleCreate = (ev) => { setEvent(ev); setView("host-dashboard"); };
  const handleGuestEnter = (id) => { setTakerId(id); setView("guest-camera"); };

  const tabs = [
    { id: "host", label: "Host View" },
    { id: "guest", label: "Guest View" },
  ];
  const activeTab = view.startsWith("host") ? "host" : "guest";

  const switchTab = (tab) => {
    if (tab === "host") setView(event ? "host-dashboard" : "host-create");
    else setView("guest-entry");
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
        </nav>

        <main className="main">
          {view === "host-create" && <CreateEvent onCreate={handleCreate} />}
          {view === "host-dashboard" && event && (
            <HostDashboard event={event} onViewAlbum={() => setView("host-album")} onNewEvent={() => setView("host-create")} />
          )}
          {view === "host-album" && event && (
            <AlbumView event={event} onBack={() => setView("host-dashboard")} />
          )}
          {view === "guest-entry" && (
            <GuestEntry event={event || DEMO_EVENT} onEnter={handleGuestEnter} />
          )}
          {view === "guest-camera" && (
            <GuestCamera event={event || DEMO_EVENT} takerId={takerId} />
          )}
        </main>
      </div>
    </>
  );
}
