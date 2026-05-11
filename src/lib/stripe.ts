import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

export const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  creator: process.env.STRIPE_PRICE_CREATOR!,
  pro: process.env.STRIPE_PRICE_PRO!
};
