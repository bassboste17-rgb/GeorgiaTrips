import express from 'express';
import Stripe from 'stripe';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// API: Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
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

    if (!itemName || !totalPrice || !bookingId) {
      return res.status(400).json({ error: 'Missing required fields: itemName, totalPrice, bookingId' });
    }

    const amountInCents = Math.round(totalPrice * 100);

    if (amountInCents < 50) {
      return res.status(400).json({ error: 'Minimum charge amount is $0.50 USD' });
    }

    const description = `${itemType || 'Booking'}: ${itemName} | ${startDate || ''} - ${endDate || ''} | ${duration || ''} day(s)`;

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

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
});

// API: Verify Payment
app.post('/api/verify-payment', async (req, res) => {
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
});

// Serve static files
app.use(express.static(__dirname));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
