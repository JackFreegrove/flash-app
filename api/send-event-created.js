import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './send-email.js';
import { eventCreated } from './email-templates.js';

const APP_URL = 'https://eventsnapshotco.com/event/';
const TIMEOUT_MS = 10_000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const authController = new AbortController();
  const authTimer = setTimeout(() => authController.abort(), TIMEOUT_MS);
  let hostEmail;
  try {
    const { data: { user }, error: authError } = await Promise.race([
      supabase.auth.getUser(token),
      new Promise((_, reject) =>
        authController.signal.addEventListener('abort', () =>
          reject(new DOMException('timeout', 'AbortError'))
        )
      ),
    ]);
    if (authError || !user?.email) return res.status(401).json({ error: 'Unauthorised' });
    hostEmail = user.email;
  } catch (err) {
    if (err.name === 'AbortError') return res.status(503).json({ error: 'Service timeout — please try again' });
    return res.status(401).json({ error: 'Unauthorised' });
  } finally {
    clearTimeout(authTimer);
  }

  const { eventId, eventName, eventDate, revealTime } = req.body ?? {};
  if (!eventId || !eventName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const qrUrl = APP_URL + eventId;

  const result = await sendEmail({
    to: hostEmail,
    subject: `Your QR code is ready — ${eventName}`,
    html: eventCreated({ eventName, eventDate, revealTime, qrUrl }),
  });

  return res.status(result.ok ? 200 : 500).json({ ok: result.ok });
}
