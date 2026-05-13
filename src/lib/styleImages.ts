import type { StyleId } from '@/types';

// Static path — available after running: node scripts/download-previews.mjs
// Falls back to Pollinations.ai when the file hasn't been downloaded yet.
const STATIC_BASE = '/style-previews';
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';
const POLLINATIONS_PARAMS = 'width=512&height=512&nologo=true&model=flux-schnell';

// Prompt + seed are tuned so each style generates a recognisable example portrait.
// These must stay in sync with scripts/download-previews.mjs AND scripts/generate-previews.mjs.
// Prompts are aligned with the actual generation prompts in src/lib/prompts.ts so previews
// accurately represent what users will get when they generate with each style.
export const STYLE_META: Record<StyleId, { prompt: string; seed: number }> = {
  anime_basic:      { prompt: 'premium 2D Japanese anime girl portrait, warm honey amber hair with white highlight streaks, enlarged expressive brown eyes with star catchlight, warm peach-rose flat cel-shading, soft warm gradient background, Korean webtoon illustration quality, pure 2D no 3D rendering',                                                                    seed: 3101 },
  anime_pro:        { prompt: 'cinematic anime portrait, deep navy background with golden rim lighting, high contrast cel-shading, dark hair with silver blue highlights, intense luminous eyes, dramatic moody atmosphere, premium anime film quality, Makoto Shinkai aesthetic, no 3D',                                                                                        seed: 3102 },
  soft_cartoon:     { prompt: 'soft watercolor illustration portrait, feather-light variable pencil strokes, translucent layered color washes, ivory cream and soft rose tones, loose gestural hair strokes, Vogue Japan beauty editorial illustration, cold-press paper grain texture visible, elegant delicate 2D art',                                                        seed: 3103 },
  cute_pet:         { prompt: 'kawaii anime animal character portrait, huge sparkling eyes with heart-shaped reflections, fluffy rounded cat ears, soft cream-white fur, rosy circular cheek blush, floating stars and sparkles background, Sanrio character design quality, warm pastel palette, pure 2D illustration',                                                         seed: 3104 },
  simple_icon:      { prompt: 'flat vector portrait icon, strictly two-color design deep navy and warm cream, bold geometric shapes, no gradients no shadows no textures, clean minimal lines, modern mobile app icon style, graphic design quality, SVG-like clarity',                                                                                                         seed: 3105 },
  '3d_cartoon':     { prompt: '3D CGI Pixar-Dreamworks style character portrait, subsurface scattering skin, volumetric studio lighting with soft caustic rim, smooth stylized cartoon features, expressive proportions, vibrant saturated colors, polished CGI render quality, no 2D illustration no flat style',                                                              seed: 3106 },
  soft_storybook:   { prompt: 'soft watercolor and colored pencil portrait illustration, English childrens picture book style, warm golden afternoon light palette, visible cold-press paper grain, delicate fine ink linework, heartwarming storybook aesthetic, muted warm tones, pure 2D',                                                                                    seed: 3107 },
  cyberpunk:        { prompt: 'cyberpunk portrait neon city, electric cyan and hot magenta rim lighting, rain-slick reflections, dramatic dark background, angular shadow geometry, futuristic atmosphere, Blade Runner cinematic aesthetic, high contrast dramatic illustration, no pastel no warm tones',                                                                      seed: 3108 },
  comic_hero:       { prompt: 'comic book superhero portrait, bold thick black ink outlines, Ben-Day halftone dot background, flat primary colors red blue yellow, Marvel DC classic American comic style, dynamic heroic composition, vivid saturated inks, no 3D no photorealism',                                                                                            seed: 3109 },
  fashion_avatar:   { prompt: 'luxury fashion portrait photography, warm golden hour rim light, champagne editorial tones, silk fabric texture, confident elegant woman posture, Vogue magazine cover quality, professional studio lighting, no cartoon no illustration',                                                                                                        seed: 3110 },
  business_profile: { prompt: 'professional corporate headshot photography, clean neutral grey background, soft diffused studio lighting, crisp business attire blazer, confident friendly expression, sharp focus, LinkedIn profile photo quality, no artistic filter no cartoon',                                                                                              seed: 3111 },
  pet_portrait_pro: { prompt: 'hyperrealistic animal portrait photography, detailed individual fur strand micro-texture, moody chiaroscuro studio lighting, dramatic dark vignette background, National Geographic photography quality, rich tonal depth, no cartoon no illustration',                                                                                           seed: 3112 },
  couple_avatar:    { prompt: 'cute anime couple portrait illustration, matching pastel outfit colors, warm romantic pink and peach tones, soft glowing light, holding hands, webtoon romance manga style, heartwarming composition, pure 2D no 3D',                                                                                                                            seed: 3113 },
  kawaii_icon:      { prompt: 'ultra kawaii chibi sticker portrait, enormous circular sparkling eyes with rainbow galaxy iris, pastel pink hair, heart-shaped blush marks on cheeks, holographic sticker border effect, bright bubbly kawaii atmosphere, LINE sticker illustration quality, Japanese kawaii art, pure 2D',                                                      seed: 3114 },
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
