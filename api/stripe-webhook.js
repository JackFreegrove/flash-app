import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './send-email.js';
import { purchaseConfirmation } from './email-templates.js';

export const config = { api: { bodyParser: false } };

const ENTITLEMENT_TIERS = new Set(['momento', 'classic', 'premium']);
const TIMEOUT_MS = 10_000;

const TIER_INFO = {
  momento: { tierLabel: 'Momento', price: '€59',  photosPerGuest: 3,  albumLife: '5 days'  },
  classic:  { tierLabel: 'Classic',  price: '€99',  photosPerGuest: 5,  albumLife: '14 days' },
  premium:  { tierLabel: 'Premium',  price: '€199', photosPerGuest: 10, albumLife: '60 days' },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const tier = session.metadata?.tier;

    if (!userId || !tier) {
      console.error('Missing metadata on session:', session.id);
      return res.status(200).json({ received: true });
    }

    if (!ENTITLEMENT_TIERS.has(tier)) {
      return res.status(200).json({ received: true });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const { error } = await supabase
        .from('entitlements')
        .insert({ user_id: userId, tier })
        .abortSignal(controller.signal);
      if (error) {
        console.error('Failed to write entitlement:', error);
        return res.status(500).json({ error: 'Database error' });
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('Entitlement write timed out for session:', session.id);
        // Return 200 so Stripe does not retry — entitlement may need manual recovery
        return res.status(200).json({ received: true });
      }
      console.error('Unexpected error writing entitlement:', err.message);
      return res.status(500).json({ error: 'Database error' });
    } finally {
      clearTimeout(timer);
    }

    const hostEmail = session.customer_details?.email;
    if (hostEmail && TIER_INFO[tier]) {
      sendEmail({
        to: hostEmail,
        subject: 'Your Snapshot Co booking is confirmed',
        html: purchaseConfirmation(TIER_INFO[tier]),
      }).catch(err => console.error('[stripe-webhook] Email send failed:', err));
    }
  }

  return res.status(200).json({ received: true });
}
