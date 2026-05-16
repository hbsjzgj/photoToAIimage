import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

// Cache the base64-encoded font so we only read the file once per process lifetime
let _fontB64: string | null = null;
async function getFontB64(): Promise<string> {
  if (_fontB64) return _fontB64;
  const buf = await readFile(path.join(process.cwd(), 'public', 'fonts', 'NotoSans.ttf'));
  _fontB64 = buf.toString('base64');
  return _fontB64;
}

export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const { width = 768, height = 768 } = await sharp(imageBuffer).metadata();

  const cx = width / 2;
  const cy = height / 2;
  // Font size = 60% of image width (user-specified — gives a bold diagonal watermark)
  const fontSize = Math.round(width * 0.60);
  const shadow = Math.round(fontSize * 0.04);

  // Embed the font as a base64 data URI so librsvg renders it correctly on
  // any server (Vercel Amazon Linux has no system fonts for 'sans-serif')
  const fontB64 = await getFontB64();

  const watermarkSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>@font-face {
        font-family: 'WM';
        src: url('data:font/truetype;base64,${fontB64}') format('truetype');
      }</style>
    </defs>
    <g transform="translate(${cx} ${cy}) rotate(-35)">
      <text
        text-anchor="middle" dominant-baseline="middle"
        font-family="'WM', sans-serif" font-size="${fontSize}" font-weight="bold"
        fill="rgba(0,0,0,0.30)"
        dx="${shadow}" dy="${shadow}"
      >FORMA</text>
      <text
        text-anchor="middle" dominant-baseline="middle"
        font-family="'WM', sans-serif" font-size="${fontSize}" font-weight="bold"
        fill="rgba(255,255,255,0.60)"
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
