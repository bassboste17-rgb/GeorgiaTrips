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
    const {
      itemName,
      itemType,
      totalPrice,
      currency,
      bookingId,
      customerEmail,
      startDate,
      endDate,
      duration,
    } = req.body;

    // Validate required fields
    if (!itemName || !totalPrice || !bookingId) {
      return res.status(400).json({ error: 'Missing required fields: itemName, totalPrice, bookingId' });
    }

    // Convert price to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(totalPrice * 100);

    if (amountInCents < 50) {
      return res.status(400).json({ error: 'Minimum charge amount is $0.50 USD' });
    }

    // Build description
    const description = `${itemType || 'Booking'}: ${itemName} | ${startDate || ''} - ${endDate || ''} | ${duration || ''} day(s)`;

    // Determine the base URL for redirect
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: itemName,
              description: description,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${baseUrl}/payment-cancel.html?booking_id=${bookingId}`,
      customer_email: customerEmail || undefined,
      metadata: {
        bookingId: bookingId,
        itemType: itemType || '',
        itemName: itemName,
        totalPrice: String(totalPrice),
        originalCurrency: currency || 'USD',
      },
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message,
    });
  }
}
