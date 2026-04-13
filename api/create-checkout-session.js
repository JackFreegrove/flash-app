import Stripe from 'stripe';

const VALID_PRICES = {
  price_1TFzdKRoyXRpjOGpQ1HHI9UM: { tier: 'momento',      mode: 'payment' },
  price_1TFzdtRoyXRpjOGpQTHJGKQ0: { tier: 'classic',      mode: 'payment' },
  price_1TFzexRoyXRpjOGpFMusLaZn: { tier: 'premium',      mode: 'payment' },
  price_1TFzhARoyXRpjOGp4z6BAswn: { tier: 'venuePartner', mode: 'payment' },
  price_1TFzi0RoyXRpjOGpfO3J11AL: { tier: 'archive',      mode: 'subscription' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId } = req.body;
  const entry = VALID_PRICES[priceId];
  if (!entry) {
    return res.status(400).json({ error: 'Invalid price' });
  }
  const { tier, mode } = entry;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${req.headers.origin || 'https://flash-app-gamma.vercel.app'}?success=true&tier=${tier}`,
      cancel_url: `${req.headers.origin || 'https://flash-app-gamma.vercel.app'}?cancelled=true`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
