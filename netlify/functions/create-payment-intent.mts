import type { Config, Context } from '@netlify/functions';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

const getStripe = () => {
  if (!stripeClient) {
    const rawKey = Netlify.env.get('STRIPE_SECRET_KEY');
    const key = rawKey ? rawKey.trim() : null;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
};

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body: { amount?: unknown; currency?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const amount = body.amount;
  const currency = typeof body.currency === 'string' ? body.currency : 'usd';

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return Response.json(
      { error: 'Invalid amount. Amount must be a positive number.' },
      { status: 400 },
    );
  }

  const rawKey = Netlify.env.get('STRIPE_SECRET_KEY');
  const key = rawKey ? rawKey.trim() : null;
  if (!key || !key.startsWith('sk_')) {
    console.error('Missing or invalid STRIPE_SECRET_KEY');
    return Response.json(
      {
        error:
          'Stripe is not correctly configured on the server. Please add a valid STRIPE_SECRET_KEY (starting with sk_) to your Netlify site environment variables.',
      },
      { status: 500 },
    );
  }

  try {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Stripe error:', error?.message ?? error);
    return Response.json(
      {
        error:
          error?.message || 'An internal server error occurred while creating the payment intent.',
      },
      { status: 500 },
    );
  }
};

export const config: Config = {
  path: '/api/create-payment-intent',
  method: 'POST',
};
