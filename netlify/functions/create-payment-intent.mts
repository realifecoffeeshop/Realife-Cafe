import type { Config } from '@netlify/functions';
import Stripe from 'stripe';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body: { amount?: unknown; currency?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const amount = body?.amount;
  const currency = typeof body?.currency === 'string' ? body.currency : 'usd';

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return Response.json(
      { error: 'Invalid amount. Amount must be a positive number.' },
      { status: 400 },
    );
  }

  const key = Netlify.env.get('STRIPE_SECRET_KEY');
  if (!key) {
    console.error('Missing STRIPE_SECRET_KEY');
    return Response.json(
      {
        error:
          'Stripe is not configured on the server. Please add STRIPE_SECRET_KEY to your environment variables.',
      },
      { status: 500 },
    );
  }

  try {
    const stripe = new Stripe(key);
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
          error?.message ||
          'An internal server error occurred while creating the payment intent.',
      },
      { status: 500 },
    );
  }
};

export const config: Config = {
  path: '/api/create-payment-intent',
  method: 'POST',
};
