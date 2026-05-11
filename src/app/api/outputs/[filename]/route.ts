import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Prevent path traversal
  if (filename.includes('..') || filename.includes('/')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const isVercel = !!process.env.VERCEL;
  const filePath = isVercel
    ? path.join('/tmp', 'outputs', filename)
    : path.join(process.cwd(), 'public', 'outputs', filename);

  if (!existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const buffer = await readFile(filePath);
  const ext = path.extname(filename).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
