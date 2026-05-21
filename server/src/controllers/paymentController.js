import asyncHandler from "express-async-handler";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(Number(amount) * 100),
    currency: "usd",
    automatic_payment_methods: { enabled: true }
  });
  res.json({ clientSecret: paymentIntent.client_secret });
});
