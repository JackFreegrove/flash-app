import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const VALID_PRICES = {
  price_1TME3URoyXRpjOGpiodxnPkb: { tier: 'momento', mode: 'payment' },
  price_1TFzdtRoyXRpjOGpQTHJGKQ0: { tier: 'classic', mode: 'payment' },
  price_1TME4QRoyXRpjOGpfiWHhcmB: { tier: 'premium', mode: 'payment' },
  price_1TFzi0RoyXRpjOGpfO3J11AL: { tier: 'archive', mode: 'subscription' },
};

const ALLOWED_ORIGINS = new Set([
  'https://flash-app-gamma.vercel.app',
  'https://eventsnapshotco.com',
  'https://www.eventsnapshotco.com',
]);
const DEFAULT_ORIGIN = 'https://flash-app-gamma.vercel.app';
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
  let user;
  try {
    const { data: { user: authedUser }, error: authError } = await Promise.race([
      supabase.auth.getUser(token),
      new Promise((_, reject) =>
        authController.signal.addEventListener('abort', () =>
          reject(new DOMException('timeout', 'AbortError'))
        )
      ),
    ]);
    if (authError || !authedUser) return res.status(401).json({ error: 'Unauthorised' });
    user = authedUser;
  } catch (err) {
    if (err.name === 'AbortError') return res.status(503).json({ error: 'Service timeout — please try again' });
    return res.status(401).json({ error: 'Unauthorised' });
  } finally {
    clearTimeout(authTimer);
  }

  const { priceId, withArchive } = req.body;
  const entry = VALID_PRICES[priceId];
  if (!entry) {
    return res.status(400).json({ error: 'Invalid price' });
  }
  const { tier, mode } = entry;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const base = ALLOWED_ORIGINS.has(req.headers.origin)
    ? req.headers.origin
    : DEFAULT_ORIGIN;
  const archiveSuffix = withArchive && mode === 'payment' ? '&archive=pending' : '';

  try {
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode,
        success_url: `${base}?success=true&tier=${tier}${archiveSuffix}`,
        cancel_url: `${base}?cancelled=true`,
        metadata: { user_id: user.id, tier },
      },
      { timeout: TIMEOUT_MS }
    );
    res.status(200).json({ url: session.url });
  } catch (error) {
    if (error.type === 'StripeConnectionError') {
      return res.status(503).json({ error: 'Service timeout — please try again' });
    }
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
