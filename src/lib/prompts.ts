// FLUX dev img2img prompts: describe the FULL SCENE transformation.
// The model uses the input image for composition/pose/background — the prompt
// drives the style. Describe subject + background treatment + lighting + materials.

const QUALITY_SUFFIX =
  'Ultra-detailed, premium quality, professional artistic result, stunning visual impact.';

export const NEGATIVE_PROMPT =
  'ugly, disfigured, deformed, blurry, low quality, out of focus, jpeg artifacts, watermark, text, logo, oversaturated, flat boring lighting, muddy colors, generic AI look, amateur result';

const STYLE_CORE: Record<string, string> = {
  anime_basic:
    'The entire scene transformed into premium anime illustration art. Subject rendered with smooth precise cel-shading, large expressive anime eyes with luminous deep irises and bright catchlights, fur and hair stylized into soft flowing individual strands in warm amber and cream tones, background elements faithfully preserved and converted into anime art style with warm cinematic lighting. Clean polished webtoon animation quality.',

  anime_pro:
    'The entire scene elevated to breathtaking masterpiece-level Japanese anime art. Subject rendered with extraordinary precision — crystalline iris gradients with star catchlights, razor-clean cel-shading with subtle subsurface glow, fur and hair transformed into gloriously detailed individual strands flowing with warmth and life, dramatic cinematic three-point rim lighting casting ethereal depth. Background beautifully stylized into premium anime environment. Studio Trigger meets Ufotable production quality, pixiv masterpiece tier.',

  soft_cartoon:
    'The entire scene transformed into warm premium soft cartoon illustration. Subject rendered with velvety smooth rounded shading, lovable expressive eyes full of charm, soft fluffy forms with gentle contours. Background environment converted into a cozy inviting cartoon world with warm honey and ivory palette. Diffused soft-box lighting creating a welcoming atmosphere. Cartoon Saloon meets Illumination Entertainment animated quality.',

  cute_pet:
    'The entire scene transformed into an utterly adorable premium kawaii illustration. Subject rendered as an irresistibly cute character — extraordinarily fluffy textured fur showing every individual strand in cream and golden tones, oversized sparkling anime eyes with starpoint and heart catchlights, tiny expressive nose and soft rounded features. Background preserved and converted into a dreamy pastel kawaii world. Warm pastel color palette. Premium Japanese mascot character illustration quality.',

  simple_icon:
    'The entire scene transformed into a sophisticated minimalist premium icon. Subject simplified into clean geometric graphic shapes, elegant flat design with subtle gradient shading, crisp precise linework, facial features reduced to their most essential and iconic forms. Background neutralized to a clean gradient. Contemporary Japanese minimalism meets modern brand identity design. Premium iOS App Store app icon aesthetic, polished vector quality.',

  '3d_cartoon':
    'The entire scene rendered in breathtaking premium 3D animation style. Subject transformed into a charming 3D animated character with Pixar-level physically-based subsurface skin scattering, expressive animated eyes with volumetric depth, fur and hair simulated with thousands of individual dynamic strands, warm cinematic global illumination. Background converted into a beautiful animated movie environment. Disney-Pixar big-budget production quality render.',

  soft_storybook:
    'The entire scene transformed into an enchanting hand-painted watercolor storybook illustration. Subject rendered with delicate brushstroke texture on visible watercolor paper grain, warm golden lamplight atmosphere suffusing the scene, soft dreamy edges with organic flowing shapes. Background converted into a magical illustrated world. Studio Ghibli warmth meets Beatrix Potter delicacy, premium artisan childrens book illustration craft.',

  cyberpunk:
    'The entire scene transformed into a cinematic cyberpunk world. Subject rendered with electric cyan and magenta neon rim lighting slicing through atmospheric volumetric fog, rain-slicked textures with micro-detail, futuristic visual augmentations and implants integrated naturally. Background converted into a dark neon-drenched dystopian cityscape. Blade Runner 2049 cinematography meets Ghost in the Shell artistry. Ultra-detailed 8K cinematic quality.',

  comic_hero:
    'The entire scene transformed into a premium superhero comic illustration. Subject rendered as a powerful heroic figure with dramatic chiaroscuro lighting — bold ink-black shadows and brilliant highlights creating epic three-dimensional form, dynamic energy and unstoppable power radiating from the composition. Background converted into a dramatic comic book environment. Alex Ross painted realism meets modern Marvel/DC premium art quality.',

  fashion_avatar:
    'The entire scene transformed into an ultra-luxury Vogue editorial fashion portrait. Subject rendered with professional Rembrandt studio lighting — perfect key-fill-hair triangle, luminous flawless skin with natural texture visible. Background converted to elegant shallow-bokeh studio environment. Sophisticated desaturated cinematic color grading. Helmut Newton meets Annie Leibovitz editorial photography quality.',

  business_profile:
    'The entire scene transformed into a premium executive professional portrait. Subject rendered with immaculate three-point studio lighting, composed and authoritative, razor-sharp detail with professional skin refinement. Background neutralized and softened to a clean professional dark gradient. Subtle warm Kodak Portra film grain. Fortune 500 CEO board portrait quality, polished and trustworthy.',

  pet_portrait_pro:
    'The entire scene elevated to a majestic fine-art animal portrait. Subject rendered with Baroque Rembrandt-style dramatic warm lighting and rich deep shadows, hyper-detailed fur texture showing every individual strand with micro-level precision, soulful expressive eyes with extraordinary emotional depth and inner light. Background transformed into a rich jewel-toned painterly studio environment. Dutch Golden Age old-master oil painting meets David Yarrow wildlife photography luxury.',

  couple_avatar:
    'The entire scene transformed into a cinematic romantic portrait. Subjects bathed in warm golden-hour backlight creating a luminous halo, amber and rose cinematic color grading, intimate and emotionally resonant composition enhanced. Background converted into a beautiful bokeh-filled romantic environment. Subtle film photography texture with dreamy lens flare. Wes Anderson visual symmetry meets Terrence Malick golden-hour poetry.',

  kawaii_icon:
    'The entire scene transformed into super-premium kawaii character art. Subject rendered as an irresistibly adorable kawaii character — luminous pearl-shimmer skin with rosy blushing cheeks, dreamy macaroon color palette of lavender, mint and peach, eyes overflowing with starlight sparkles and heart reflections, bouncy rounded design language throughout. Background converted into a pastel kawaii fantasy world. Sanrio meets modern streetwear culture. Professional premium LINE sticker character quality.',
};

export function getPromptForStyle(styleId: string): { prompt: string; negativePrompt: string } {
  const core = STYLE_CORE[styleId] ?? `${styleId} style portrait`;
  return {
    prompt: `${core} ${QUALITY_SUFFIX}`,
    negativePrompt: NEGATIVE_PROMPT,
  };
}

export const STYLE_DISPLAY_PROMPTS: Record<string, string> = {
  anime_basic:      'Clean anime portrait · soft lighting · expressive eyes',
  soft_cartoon:     'Soft premium cartoon · warm cinematic tones · elegant rendering',
  cute_pet:         'Adorable kawaii pet portrait · fluffy details · expressive eyes',
  simple_icon:      'Minimal flat illustration · clean modern app icon aesthetic',
  '3d_cartoon':     'Pixar-inspired 3D animated portrait · cinematic global illumination',
  anime_pro:        'Premium Japanese anime · cinematic rim lighting · high-end detail',
  soft_storybook:   'Dreamy watercolor storybook · whimsical mood · hand-painted texture',
  cyberpunk:        'Neon-lit cyberpunk portrait · futuristic atmosphere · holographic glow',
  comic_hero:       'Cinematic superhero portrait · dramatic lighting · graphic novel quality',
  fashion_avatar:   'Luxury fashion editorial · premium magazine aesthetic · elegant lighting',
  business_profile: 'Professional executive portrait · premium LinkedIn style · studio quality',
  pet_portrait_pro: 'Luxury pet portrait photography · cinematic studio lighting · rich warm tones',
  couple_avatar:    'Romantic couple portrait · cinematic emotional lighting · harmonious mood',
  kawaii_icon:      'Super cute Japanese kawaii icon · soft pastel palette · rounded modern design',
};

export interface ModelParams {
  strength: number;
  num_inference_steps: number;
  guidance_scale: number;
}

// Tuned for FLUX dev img2img:
// - strength 0.70–0.76: preserves composition/background while applying strong style
// - guidance_scale 3.0–3.5: FLUX uses distilled guidance (higher = more prompt-driven)
// - steps 25–35: FLUX is efficient; 25 is good quality, 35 is premium
export const MODEL_PARAMS: Record<'free' | 'paid' | 'premium', ModelParams> = {
  free:    { strength: 0.72, num_inference_steps: 25, guidance_scale: 3.0 },
  paid:    { strength: 0.76, num_inference_steps: 35, guidance_scale: 3.5 },
  premium: { strength: 0.80, num_inference_steps: 40, guidance_scale: 4.0 },
};
