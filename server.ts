import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Stripe
  // We use lazy initialization to avoid crashing if the key is missing on startup
  let stripeClient: Stripe | null = null;
  const getStripe = () => {
    if (!stripeClient) {
      const rawKey = process.env.STRIPE_SECRET_KEY;
      const key = rawKey ? rawKey.trim() : null;
      if (!key) {
        throw new Error('STRIPE_SECRET_KEY environment variable is required');
      }
      stripeClient = new Stripe(key);
    }
    return stripeClient;
  };

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API Routes
  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      const { amount, currency = 'usd' } = req.body;

      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount. Amount must be a positive number.' });
      }

      const rawKey = process.env.STRIPE_SECRET_KEY;
      const key = rawKey ? rawKey.trim() : null;
      if (!key || !key.startsWith('sk_')) {
        console.error('Missing or invalid STRIPE_SECRET_KEY');
        return res.status(500).json({ 
          error: 'Stripe is not correctly configured on the server. Please add a valid STRIPE_SECRET_KEY (starting with sk_) to your environment variables (Netlify Site > Environment Variables in production).'
        });
      }

      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects amounts in cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error('Stripe error:', error.message);
      res.status(500).json({ error: error.message || 'An internal server error occurred while creating the payment intent.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
