import type { StyleId } from '@/types';

// Static path — available after running: node scripts/download-previews.mjs
// Falls back to Pollinations.ai when the file hasn't been downloaded yet.
const STATIC_BASE = '/style-previews';
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';
const POLLINATIONS_PARAMS = 'width=512&height=512&nologo=true&model=flux-schnell';

// Prompt + seed are tuned so each style generates a recognisable example portrait.
// These must stay in sync with scripts/download-previews.mjs.
export const STYLE_META: Record<StyleId, { prompt: string; seed: number }> = {
  anime_basic:      { prompt: 'anime girl portrait, soft pink background, clean art style, pastel',                     seed: 3101 },
  anime_pro:        { prompt: 'professional anime portrait, cinematic dark background, high detail',                    seed: 3102 },
  soft_cartoon:     { prompt: 'cute cartoon girl portrait, soft pastel colors, round face, warm tones',                 seed: 3103 },
  cute_pet:         { prompt: 'anime girl with cat ears, kawaii style, big eyes, pastel background',                    seed: 3104 },
  simple_icon:      { prompt: 'flat minimal vector portrait, two colors, geometric shapes, icon design',               seed: 3105 },
  '3d_cartoon':     { prompt: '3D Pixar cartoon girl portrait, vibrant, studio lighting, smooth render',               seed: 3106 },
  soft_storybook:   { prompt: 'soft watercolor portrait, storybook illustration, dreamy pastel colors',                seed: 3107 },
  cyberpunk:        { prompt: 'cyberpunk girl portrait, neon purple cyan lights, futuristic city, dramatic',           seed: 3108 },
  comic_hero:       { prompt: 'comic book superhero girl portrait, bold ink outlines, vivid saturated colors',         seed: 3109 },
  fashion_avatar:   { prompt: 'fashion model portrait, elegant woman, golden warm tones, high fashion',                seed: 3110 },
  business_profile: { prompt: 'professional business headshot, clean white background, confident woman, suit',         seed: 3111 },
  pet_portrait_pro: { prompt: 'realistic cat portrait, detailed fur texture, soft studio lighting, dark background',   seed: 3112 },
  couple_avatar:    { prompt: 'cute anime couple portrait, matching style, soft pink romantic tones',                  seed: 3113 },
  kawaii_icon:      { prompt: 'kawaii chibi girl portrait, huge round eyes, pastel pink blue, sticker style',          seed: 3114 },
};

function pollinationsUrl(styleId: StyleId): string {
  const { prompt, seed } = STYLE_META[styleId];
  return `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${POLLINATIONS_PARAMS}&seed=${seed}`;
}

// Components call getStyleImageUrl(styleId).
// The <img> tag shows the static file; if it 404s, onError can swap to pollinationsUrl.
export function getStyleImageUrl(styleId: StyleId): string {
  return `${STATIC_BASE}/${styleId}.jpg`;
}

export function getStyleFallbackUrl(styleId: StyleId): string {
  return pollinationsUrl(styleId);
}

export const STYLE_IMAGE_URLS: Record<StyleId, string> = Object.fromEntries(
  (Object.keys(STYLE_META) as StyleId[]).map((id) => [id, getStyleImageUrl(id)])
) as Record<StyleId, string>;

export const STYLE_FALLBACK_URLS: Record<StyleId, string> = Object.fromEntries(
  (Object.keys(STYLE_META) as StyleId[]).map((id) => [id, pollinationsUrl(id)])
) as Record<StyleId, string>;
