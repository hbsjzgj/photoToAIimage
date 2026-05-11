import sharp from 'sharp';

export async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const { width = 768, height = 768 } = await sharp(imageBuffer).metadata();

  const fontSize = Math.round(width * 0.04);
  const padding = Math.round(height * 0.02);

  const watermarkSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .wm { font-family: Arial, sans-serif; font-size: ${fontSize}px; fill: white;
                fill-opacity: 0.65; font-weight: bold; }
        </style>
      </defs>
      <rect x="0" y="${height - fontSize * 2 - padding}" width="${width}" height="${fontSize * 2 + padding}"
            fill="black" fill-opacity="0.35" />
      <text x="${width / 2}" y="${height - padding}" text-anchor="middle" class="wm">
        AI Avatar Generator
      </text>
    </svg>`;

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(watermarkSvg), gravity: 'south' }])
    .toBuffer();
}

export async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
