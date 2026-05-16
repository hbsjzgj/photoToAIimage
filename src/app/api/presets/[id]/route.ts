import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const preset = await prisma.stylePreset.findUnique({ where: { id: params.id } });
  if (!preset || preset.userId !== userId) {
    return NextResponse.json({ error: 'notFound' }, { status: 404 });
  }

  await prisma.stylePreset.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
