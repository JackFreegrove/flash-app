import { sendEmail } from './send-email.js';
import { eventCreated } from './email-templates.js';

const APP_URL = 'https://eventsnapshotco.com/event/';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId, hostEmail, eventName, eventDate, revealTime } = req.body ?? {};
  if (!eventId || !hostEmail || !eventName) {
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
