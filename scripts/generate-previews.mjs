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

// Prompts aligned with src/lib/styleImages.ts STYLE_META and src/lib/prompts.ts
// so preview images accurately represent each style's actual output.
const STYLES = [
  { id: 'anime_basic',      prompt: 'premium 2D Japanese anime girl portrait, warm honey amber hair with white highlight streaks, enlarged expressive brown eyes with star catchlight, warm peach-rose flat cel-shading, soft warm gradient background, Korean webtoon illustration quality, pure 2D no 3D rendering',                                                                    seed: 3101 },
  { id: 'anime_pro',        prompt: 'cinematic anime portrait, deep navy background with golden rim lighting, high contrast cel-shading, dark hair with silver blue highlights, intense luminous eyes, dramatic moody atmosphere, premium anime film quality, Makoto Shinkai aesthetic, no 3D',                                                                                        seed: 3102 },
  { id: 'soft_cartoon',     prompt: 'soft watercolor illustration portrait, feather-light variable pencil strokes, translucent layered color washes, ivory cream and soft rose tones, loose gestural hair strokes, Vogue Japan beauty editorial illustration, cold-press paper grain texture visible, elegant delicate 2D art',                                                        seed: 3103 },
  { id: 'cute_pet',         prompt: 'kawaii anime animal character portrait, huge sparkling eyes with heart-shaped reflections, fluffy rounded cat ears, soft cream-white fur, rosy circular cheek blush, floating stars and sparkles background, Sanrio character design quality, warm pastel palette, pure 2D illustration',                                                         seed: 3104 },
  { id: 'simple_icon',      prompt: 'flat vector portrait icon, strictly two-color design deep navy and warm cream, bold geometric shapes, no gradients no shadows no textures, clean minimal lines, modern mobile app icon style, graphic design quality, SVG-like clarity',                                                                                                         seed: 3105 },
  { id: '3d_cartoon',       prompt: '3D CGI Pixar-Dreamworks style character portrait, subsurface scattering skin, volumetric studio lighting with soft caustic rim, smooth stylized cartoon features, expressive proportions, vibrant saturated colors, polished CGI render quality, no 2D illustration no flat style',                                                              seed: 3106 },
  { id: 'soft_storybook',   prompt: 'soft watercolor and colored pencil portrait illustration, English childrens picture book style, warm golden afternoon light palette, visible cold-press paper grain, delicate fine ink linework, heartwarming storybook aesthetic, muted warm tones, pure 2D',                                                                                    seed: 3107 },
  { id: 'cyberpunk',        prompt: 'cyberpunk portrait neon city, electric cyan and hot magenta rim lighting, rain-slick reflections, dramatic dark background, angular shadow geometry, futuristic atmosphere, Blade Runner cinematic aesthetic, high contrast dramatic illustration, no pastel no warm tones',                                                                      seed: 3108 },
  { id: 'comic_hero',       prompt: 'comic book superhero portrait, bold thick black ink outlines, Ben-Day halftone dot background, flat primary colors red blue yellow, Marvel DC classic American comic style, dynamic heroic composition, vivid saturated inks, no 3D no photorealism',                                                                                            seed: 3109 },
  { id: 'fashion_avatar',   prompt: 'luxury fashion portrait photography, warm golden hour rim light, champagne editorial tones, silk fabric texture, confident elegant woman posture, Vogue magazine cover quality, professional studio lighting, no cartoon no illustration',                                                                                                        seed: 3110 },
  { id: 'business_profile', prompt: 'professional corporate headshot photography, clean neutral grey background, soft diffused studio lighting, crisp business attire blazer, confident friendly expression, sharp focus, LinkedIn profile photo quality, no artistic filter no cartoon',                                                                                              seed: 3111 },
  { id: 'pet_portrait_pro', prompt: 'hyperrealistic animal portrait photography, detailed individual fur strand micro-texture, moody chiaroscuro studio lighting, dramatic dark vignette background, National Geographic photography quality, rich tonal depth, no cartoon no illustration',                                                                                           seed: 3112 },
  { id: 'couple_avatar',    prompt: 'cute anime couple portrait illustration, matching pastel outfit colors, warm romantic pink and peach tones, soft glowing light, holding hands, webtoon romance manga style, heartwarming composition, pure 2D no 3D',                                                                                                                            seed: 3113 },
  { id: 'kawaii_icon',      prompt: 'ultra kawaii chibi sticker portrait, enormous circular sparkling eyes with rainbow galaxy iris, pastel pink hair, heart-shaped blush marks on cheeks, holographic sticker border effect, bright bubbly kawaii atmosphere, LINE sticker illustration quality, Japanese kawaii art, pure 2D',                                                      seed: 3114 },
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
