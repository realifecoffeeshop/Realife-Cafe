import { Config, Context } from "@netlify/functions";
import Stripe from "stripe";

export default async (req: Request, context: Context) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { amount, currency = "usd" } = body;

    if (typeof amount !== "number" || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount. Amount must be a positive number." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // In Netlify, we use Netlify.env.get() or just process.env
    const rawKey = process.env.STRIPE_SECRET_KEY;
    const key = rawKey ? rawKey.trim() : null;

    if (!key || !key.startsWith("sk_")) {
      console.error("Missing or invalid STRIPE_SECRET_KEY in Netlify environment");
      return new Response(
        JSON.stringify({
          error: "Stripe is not correctly configured on the server. Please add a valid STRIPE_SECRET_KEY (starting with sk_) to your Netlify Environment Variables.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(key);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amounts in cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Stripe error:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message || "An internal error occurred while creating the payment intent.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/create-payment-intent",
};
