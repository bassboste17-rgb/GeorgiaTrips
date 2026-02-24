import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.status(200).json({
      paymentStatus: session.payment_status,
      bookingId: session.metadata?.bookingId || null,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_email || session.customer_details?.email || null,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      error: 'Failed to verify payment',
      details: error.message,
    });
  }
}
