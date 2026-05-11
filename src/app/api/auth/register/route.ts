import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'weakPassword' }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: 'emailExists' }, { status: 400 });
    }

    const hashed = await hash(password, 12);
    await prisma.user.create({ data: { name, email, password: hashed } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
