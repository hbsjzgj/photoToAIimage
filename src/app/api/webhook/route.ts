import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { addCredits } from '@/lib/credits';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0', 10);
    const packageName = session.metadata?.package || '';

    if (userId && credits > 0) {
      await addCredits(userId, credits, `Purchased ${packageName} pack (${credits} credits)`);
      console.log(`Added ${credits} credits to user ${userId}`);
    }
  }

  return NextResponse.json({ received: true });
}
