/**
 * Generates style preview images using HuggingFace Inference API (FLUX.1-schnell)
 * and saves them to public/style-previews/.
 *
 * Run:  node scripts/generate-previews.mjs
 * Requires HUGGINGFACE_API_TOKEN in .env.local or environment.
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// ── Read token ──────────────────────────────────────────────────────────────
let HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
if (!HF_TOKEN) {
  try {
    const env = await readFile('.env.local', 'utf8');
    const m = env.match(/HUGGINGFACE_API_TOKEN\s*=\s*(.+)/);
    if (m) HF_TOKEN = m[1].trim().replace(/^["']|["']$/g, '');
  } catch {}
}
if (!HF_TOKEN) {
  console.error('ERROR: HUGGINGFACE_API_TOKEN not found in environment or .env.local');
  process.exit(1);
}

const MODEL = 'black-forest-labs/FLUX.1-schnell';
const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;
const OUT_DIR = path.join(process.cwd(), 'public', 'style-previews');

const STYLES = [
  { id: 'anime_basic',      prompt: 'anime girl portrait, soft pink background, clean art style, pastel colors',                seed: 3101 },
  { id: 'anime_pro',        prompt: 'professional anime portrait, cinematic dark background, highly detailed illustration',     seed: 3102 },
  { id: 'soft_cartoon',     prompt: 'cute cartoon girl portrait, soft pastel colors, round face, warm gentle tones',             seed: 3103 },
  { id: 'cute_pet',         prompt: 'anime girl with fluffy cat ears, kawaii style, big sparkling eyes, pastel background',      seed: 3104 },
  { id: 'simple_icon',      prompt: 'flat minimal vector portrait, two-color geometric design, modern icon illustration',        seed: 3105 },
  { id: '3d_cartoon',       prompt: '3D Pixar CGI cartoon girl portrait, vibrant colors, smooth studio lighting',               seed: 3106 },
  { id: 'soft_storybook',   prompt: 'soft watercolor portrait illustration, dreamy storybook art style, pastel colors',         seed: 3107 },
  { id: 'cyberpunk',        prompt: 'cyberpunk girl portrait, neon purple and cyan lights, futuristic city, dramatic shadows',   seed: 3108 },
  { id: 'comic_hero',       prompt: 'comic book superhero girl portrait, bold ink outlines, vivid saturated colors',             seed: 3109 },
  { id: 'fashion_avatar',   prompt: 'fashion model portrait, elegant woman, warm golden tones, high fashion magazine style',     seed: 3110 },
  { id: 'business_profile', prompt: 'professional business headshot, confident woman in blazer, clean white background',        seed: 3111 },
  { id: 'pet_portrait_pro', prompt: 'hyperrealistic cat portrait, detailed fur texture, soft studio lighting, dark background', seed: 3112 },
  { id: 'couple_avatar',    prompt: 'cute anime couple portrait, matching art style, soft romantic pink tones',                  seed: 3113 },
  { id: 'kawaii_icon',      prompt: 'kawaii chibi girl portrait, huge round sparkling eyes, pastel pink and blue, sticker art', seed: 3114 },
];

async function generate(prompt, seed, timeoutMs = 60_000) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { seed, width: 512, height: 512, num_inference_steps: 4 },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (res.status === 503) {
    // Model loading — wait and retry
    const info = await res.json().catch(() => ({}));
    const wait = ((info.estimated_time ?? 20) + 5) * 1000;
    console.log(`    model loading, waiting ${Math.round(wait / 1000)}s...`);
    await new Promise(r => setTimeout(r, wait));
    return generate(prompt, seed, timeoutMs);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 120)}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

await mkdir(OUT_DIR, { recursive: true });

let ok = 0, skip = 0, fail = 0;

for (const { id, prompt, seed } of STYLES) {
  const dest = path.join(OUT_DIR, `${id}.jpg`);
  if (existsSync(dest)) { console.log(`  skip  ${id}`); skip++; continue; }

  process.stdout.write(`  gen   ${id}... `);
  try {
    const buf = await generate(prompt, seed);
    await writeFile(dest, buf);
    console.log(`saved (${(buf.length / 1024).toFixed(0)} KB)`);
    ok++;
  } catch (e) {
    console.log(`FAIL — ${e.message}`);
    fail++;
  }
  await sleep(1500); // small pause between requests
}

console.log(`\nDone: ${ok} generated, ${skip} skipped, ${fail} failed`);
if (ok > 0) {
  console.log('Next: git add public/style-previews/ && git commit -m "chore: add style preview images" && git push');
}
