import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const { width = 768, height = 768 } = await sharp(imageBuffer).metadata();

  const cx = width / 2;
  const cy = height / 2;
  const fontSize = Math.round(width * 0.10);
  const letterSpacing = Math.round(width * 0.018);

  // Diagonal centered watermark — shadow layer + white layer for visibility on any bg
  const watermarkSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${cx} ${cy}) rotate(-35)">
        <text
          text-anchor="middle" dominant-baseline="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${fontSize}" font-weight="700"
          letter-spacing="${letterSpacing}"
          fill="rgba(0,0,0,0.18)"
          dx="2" dy="2"
        >FORMA</text>
        <text
          text-anchor="middle" dominant-baseline="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${fontSize}" font-weight="700"
          letter-spacing="${letterSpacing}"
          fill="rgba(255,255,255,0.42)"
        >FORMA</text>
      </g>
    </svg>`;

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(watermarkSvg), gravity: 'center' }])
    .toBuffer();
}

export async function fetchImageBuffer(url: string): Promise<Buffer> {
  // Local /demo-results/ or /outputs/ paths → read from public/ directory
  if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/api/')) {
    const relPath = url.slice(1); // strip leading slash
    const filePath = path.join(process.cwd(), 'public', relPath);
    return readFile(filePath);
  }

  // /api/outputs/ → read from the outputs directory (LocalProvider path)
  if (url.startsWith('/api/outputs/')) {
    const filename = path.basename(url);
    const dir = process.env.VERCEL
      ? path.join('/tmp', 'outputs')
      : path.join(process.cwd(), 'public', 'outputs');
    return readFile(path.join(dir, filename));
  }

  // Remote URL
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchImageBuffer: HTTP ${res.status} for ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
