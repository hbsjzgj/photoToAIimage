import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';
import { PRICE_IDS, STRIPE_API_VERSION } from '@/lib/stripe';
import { CREDIT_AMOUNTS, CreditPackage } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { packageId, locale = 'ja' } = await req.json();

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }

  if (!PRICE_IDS[packageId]) {
    return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: STRIPE_API_VERSION });
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: PRICE_IDS[packageId as CreditPackage], quantity: 1 }],
    mode: 'payment',
    success_url: `${baseUrl}/${locale}/purchase/success?credits=${CREDIT_AMOUNTS[packageId as CreditPackage]}&package=${packageId}`,
    cancel_url: `${baseUrl}/${locale}/pricing?canceled=true`,
    metadata: {
      userId,
      package: packageId,
      credits: String(CREDIT_AMOUNTS[packageId as CreditPackage])
    }
  });

  return NextResponse.json({ url: checkoutSession.url });
}
