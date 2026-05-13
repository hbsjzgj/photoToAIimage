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
