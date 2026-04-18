import Stripe from 'stripe';

const VALID_PRICES = {
  price_1TME3URoyXRpjOGpiodxnPkb: { tier: 'momento', mode: 'payment' },
  price_1TFzdtRoyXRpjOGpQTHJGKQ0: { tier: 'classic', mode: 'payment' },
  price_1TME4QRoyXRpjOGpfiWHhcmB: { tier: 'premium', mode: 'payment' },
  price_1TFzi0RoyXRpjOGpfO3J11AL: { tier: 'archive', mode: 'subscription' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, userId, withArchive } = req.body;
  const entry = VALID_PRICES[priceId];
  if (!entry) {
    return res.status(400).json({ error: 'Invalid price' });
  }
  const { tier, mode } = entry;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const base = req.headers.origin || 'https://flash-app-gamma.vercel.app';
  const archiveSuffix = withArchive && mode === 'payment' ? '&archive=pending' : '';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${base}?success=true&tier=${tier}${archiveSuffix}`,
      cancel_url: `${base}?cancelled=true`,
      metadata: { user_id: userId ?? '', tier },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
