/**
 * Generates style preview images using Replicate FLUX.1-schnell (text-to-image)
 * and saves them to public/style-previews/.
 *
 * Run:  node scripts/generate-previews-replicate.mjs
 * Requires REPLICATE_API_TOKEN in .env.local or environment.
 * Skips images that already exist — delete them first to regenerate.
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// ── Read token ──────────────────────────────────────────────────────────────
let TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) {
  try {
    const env = await readFile('.env.local', 'utf8');
    const m = env.match(/REPLICATE_API_TOKEN\s*=\s*(.+)/);
    if (m) TOKEN = m[1].trim().replace(/^["']|["']$/g, '');
  } catch {}
}
if (!TOKEN) {
  console.error('ERROR: REPLICATE_API_TOKEN not found in environment or .env.local');
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), 'public', 'style-previews');
const MODEL = 'black-forest-labs/flux-schnell';

// Prompts aligned with src/lib/styleImages.ts STYLE_META and src/lib/prompts.ts
const STYLES = [
  { id: 'anime_basic',      prompt: 'premium 2D Japanese anime girl portrait, warm honey amber hair with white highlight streaks, enlarged expressive brown eyes with star catchlight, warm peach-rose flat cel-shading, soft warm gradient background, Korean webtoon illustration quality, pure 2D no 3D rendering' },
  { id: 'anime_pro',        prompt: 'cinematic anime portrait, deep navy background with golden rim lighting, high contrast cel-shading, dark hair with silver blue highlights, intense luminous eyes, dramatic moody atmosphere, premium anime film quality, Makoto Shinkai aesthetic, no 3D' },
  { id: 'soft_cartoon',     prompt: 'soft watercolor illustration portrait, feather-light variable pencil strokes, translucent layered color washes, ivory cream and soft rose tones, loose gestural hair strokes, Vogue Japan beauty editorial illustration, cold-press paper grain texture visible, elegant delicate 2D art' },
  { id: 'cute_pet',         prompt: 'kawaii anime animal character portrait, huge sparkling eyes with heart-shaped reflections, fluffy rounded cat ears, soft cream-white fur, rosy circular cheek blush, floating stars and sparkles background, Sanrio character design quality, warm pastel palette, pure 2D illustration' },
  { id: 'simple_icon',      prompt: 'flat vector portrait icon, strictly two-color design deep navy and warm cream, bold geometric shapes, no gradients no shadows no textures, clean minimal lines, modern mobile app icon style, graphic design quality' },
  { id: '3d_cartoon',       prompt: '3D CGI Pixar-Dreamworks style character portrait, subsurface scattering skin, volumetric studio lighting with soft caustic rim, smooth stylized cartoon features, expressive proportions, vibrant saturated colors, polished CGI render quality' },
  { id: 'soft_storybook',   prompt: 'soft watercolor and colored pencil portrait illustration, English childrens picture book style, warm golden afternoon light palette, visible cold-press paper grain, delicate fine ink linework, heartwarming storybook aesthetic, muted warm tones, pure 2D' },
  { id: 'cyberpunk',        prompt: 'cyberpunk portrait neon city, electric cyan and hot magenta rim lighting, rain-slick reflections, dramatic dark background, angular shadow geometry, futuristic atmosphere, Blade Runner cinematic aesthetic, high contrast dramatic illustration' },
  { id: 'comic_hero',       prompt: 'comic book superhero portrait, bold thick black ink outlines, Ben-Day halftone dot background, flat primary colors red blue yellow, Marvel DC classic American comic style, dynamic heroic composition, vivid saturated inks' },
  { id: 'fashion_avatar',   prompt: 'luxury fashion portrait photography, warm golden hour rim light, champagne editorial tones, silk fabric texture, confident elegant woman posture, Vogue magazine cover quality, professional studio lighting' },
  { id: 'business_profile', prompt: 'professional corporate headshot photography, clean neutral grey background, soft diffused studio lighting, crisp business attire blazer, confident friendly expression, sharp focus, LinkedIn profile photo quality' },
  { id: 'pet_portrait_pro', prompt: 'hyperrealistic animal portrait photography, detailed individual fur strand micro-texture, moody chiaroscuro studio lighting, dramatic dark vignette background, National Geographic photography quality, rich tonal depth' },
  { id: 'couple_avatar',    prompt: 'cute anime couple portrait illustration, matching pastel outfit colors, warm romantic pink and peach tones, soft glowing light, holding hands, webtoon romance manga style, heartwarming composition, pure 2D' },
  { id: 'kawaii_icon',      prompt: 'ultra kawaii chibi sticker portrait, enormous circular sparkling eyes with rainbow galaxy iris, pastel pink hair, heart-shaped blush marks on cheeks, holographic sticker border effect, bright bubbly kawaii atmosphere, LINE sticker illustration quality, Japanese kawaii art, pure 2D' },
];

async function runPrediction(prompt, timeoutMs = 120_000) {
  // Create prediction
  const createRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: '1:1',
        output_format: 'jpg',
        output_quality: 90,
        num_outputs: 1,
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!createRes.ok) {
    const body = await createRes.text().catch(() => '');
    throw new Error(`HTTP ${createRes.status}: ${body.slice(0, 200)}`);
  }

  const prediction = await createRes.json();

  // If synchronous (Prefer: wait), output may already be ready
  if (prediction.status === 'succeeded' && prediction.output?.length) {
    return prediction.output[0];
  }

  // Otherwise poll
  const pollUrl = prediction.urls?.get ?? `https://api.replicate.com/v1/predictions/${prediction.id}`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(pollUrl, {
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      signal: AbortSignal.timeout(30_000),
    });
    if (!pollRes.ok) continue;
    const result = await pollRes.json();
    if (result.status === 'succeeded') return result.output[0];
    if (result.status === 'failed') throw new Error(`Prediction failed: ${result.error}`);
  }

  throw new Error('Prediction timed out');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

await mkdir(OUT_DIR, { recursive: true });

let ok = 0, skip = 0, fail = 0;

for (const { id, prompt } of STYLES) {
  const dest = path.join(OUT_DIR, `${id}.jpg`);
  if (existsSync(dest)) {
    console.log(`  skip  ${id}`);
    skip++;
    continue;
  }

  process.stdout.write(`  gen   ${id}... `);
  try {
    const imageUrl = await runPrediction(prompt);
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
    if (!imgRes.ok) throw new Error(`image download HTTP ${imgRes.status}`);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    await writeFile(dest, buf);
    console.log(`saved (${(buf.length / 1024).toFixed(0)} KB)`);
    ok++;
  } catch (e) {
    console.log(`FAIL — ${e.message}`);
    fail++;
  }
  await sleep(500);
}

console.log(`\nDone: ${ok} generated, ${skip} skipped, ${fail} failed`);
if (ok > 0) {
  console.log('Next: git add public/style-previews/ && git commit -m "chore: regenerate style previews with updated prompts" && git push');
}
