import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(Number(amount) * 100),
    currency: "usd",
    automatic_payment_methods: { enabled: true }
  });
  res.json({ clientSecret: paymentIntent.client_secret });
});
