/**
 * Downloads all 14 style preview images from Pollinations.ai and saves them
 * to public/style-previews/ as static files.
 *
 * Run once:  node scripts/download-previews.mjs
 * Then commit the images so the site never calls Pollinations.ai at runtime.
 *
 * Uses sequential requests with ~12s delay to stay under the rate limit.
 * Retries failed requests once after an additional 30s cooldown.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'public', 'style-previews');
const BASE = 'https://image.pollinations.ai/prompt';
const PARAMS = 'width=512&height=512&nologo=true&model=flux-schnell';

const STYLES = [
  { id: 'anime_basic',      prompt: 'anime girl portrait, soft pink background, clean art style, pastel',                     seed: 3101 },
  { id: 'anime_pro',        prompt: 'professional anime portrait, cinematic dark background, high detail',                    seed: 3102 },
  { id: 'soft_cartoon',     prompt: 'cute cartoon girl portrait, soft pastel colors, round face, warm tones',                 seed: 3103 },
  { id: 'cute_pet',         prompt: 'anime girl with cat ears, kawaii style, big eyes, pastel background',                    seed: 3104 },
  { id: 'simple_icon',      prompt: 'flat minimal vector portrait, two colors, geometric shapes, icon design',               seed: 3105 },
  { id: '3d_cartoon',       prompt: '3D Pixar cartoon girl portrait, vibrant, studio lighting, smooth render',               seed: 3106 },
  { id: 'soft_storybook',   prompt: 'soft watercolor portrait, storybook illustration, dreamy pastel colors',                seed: 3107 },
  { id: 'cyberpunk',        prompt: 'cyberpunk girl portrait, neon purple cyan lights, futuristic city, dramatic',           seed: 3108 },
  { id: 'comic_hero',       prompt: 'comic book superhero girl portrait, bold ink outlines, vivid saturated colors',         seed: 3109 },
  { id: 'fashion_avatar',   prompt: 'fashion model portrait, elegant woman, golden warm tones, high fashion',                seed: 3110 },
  { id: 'business_profile', prompt: 'professional business headshot, clean white background, confident woman, suit',         seed: 3111 },
  { id: 'pet_portrait_pro', prompt: 'realistic cat portrait, detailed fur texture, soft studio lighting, dark background',   seed: 3112 },
  { id: 'couple_avatar',    prompt: 'cute anime couple portrait, matching style, soft pink romantic tones',                  seed: 3113 },
  { id: 'kawaii_icon',      prompt: 'kawaii chibi girl portrait, huge round eyes, pastel pink blue, sticker style',          seed: 3114 },
];

const DELAY_MS = 12_000;
const RETRY_DELAY_MS = 35_000;

async function fetchImage(id, prompt, seed, timeoutMs = 40_000) {
  const url = `${BASE}/${encodeURIComponent(prompt)}?${PARAMS}&seed=${seed}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

await mkdir(OUT_DIR, { recursive: true });

const failed = [];

for (const { id, prompt, seed } of STYLES) {
  const dest = path.join(OUT_DIR, `${id}.jpg`);
  if (existsSync(dest)) { console.log(`  skip  ${id} (already exists)`); continue; }

  process.stdout.write(`  fetch ${id}... `);
  try {
    const buf = await fetchImage(id, prompt, seed);
    await writeFile(dest, buf);
    console.log(`saved (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.log(`FAIL (${e.message}) — will retry`);
    failed.push({ id, prompt, seed });
  }
  await sleep(DELAY_MS);
}

if (failed.length > 0) {
  console.log(`\nRetrying ${failed.length} failed image(s) after ${RETRY_DELAY_MS / 1000}s cooldown...`);
  await sleep(RETRY_DELAY_MS);
  for (const { id, prompt, seed } of failed) {
    const dest = path.join(OUT_DIR, `${id}.jpg`);
    process.stdout.write(`  retry ${id}... `);
    try {
      const buf = await fetchImage(id, prompt, seed, 60_000);
      await writeFile(dest, buf);
      console.log(`saved (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.log(`FAIL again (${e.message})`);
    }
    await sleep(DELAY_MS);
  }
}

const count = STYLES.filter(({ id }) => existsSync(path.join(OUT_DIR, `${id}.jpg`))).length;
console.log(`\nDone. ${count}/${STYLES.length} images saved to public/style-previews/`);
if (count > 0) console.log('Run: git add public/style-previews && git commit -m "chore: add style preview images"');
