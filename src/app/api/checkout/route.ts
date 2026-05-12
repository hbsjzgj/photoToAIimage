import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, PRICE_IDS } from '@/lib/stripe';
import { CREDIT_AMOUNTS, CreditPackage } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { packageId, locale = 'ja' } = await req.json();

  if (!PRICE_IDS[packageId]) {
    return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
  }

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
