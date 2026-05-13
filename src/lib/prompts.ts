// Each style defines:
//  1. STYLE_CORE  — positive prompt with explicit rendering type (2D / 3D / photo)
//  2. STYLE_NEGATIVE — blocks conflicting rendering modes so output matches label

const BASE_NEGATIVE =
  'ugly, disfigured, deformed, blurry, low quality, jpeg artifacts, watermark, text, logo, oversaturated';

// Per-style negative prompts — blocks whatever this style should NOT look like
const STYLE_NEGATIVE: Record<string, string> = {
  // 2D anime styles: block 3D and photorealism
  anime_basic:
    `${BASE_NEGATIVE}, 3D rendered, 3D CGI, photorealistic, hyper-realistic fur, realistic photography, volumetric rendering, subsurface scattering, depth of field bokeh`,
  anime_pro:
    `${BASE_NEGATIVE}, 3D rendered, 3D CGI, photorealistic, realistic photography, hyper-realistic texture`,
  soft_cartoon:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, hyper-realistic, realistic fur, realistic skin texture`,
  cute_pet:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, hyper-realistic, realistic photography, volumetric rendering`,
  simple_icon:
    `${BASE_NEGATIVE}, 3D, photorealistic, complex background, realistic, shadows, gradients, detailed texture`,
  kawaii_icon:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, hyper-realistic, realistic fur, realistic skin, dark colors`,
  soft_storybook:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, sharp digital art, neon colors, dark atmosphere`,
  comic_hero:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, anime style, soft colors, watercolor`,

  // 3D styles: block flat/2D
  '3d_cartoon':
    `${BASE_NEGATIVE}, flat design, 2D illustration, anime linework, manga, hand-drawn, watercolor`,

  // Photorealistic styles: block illustration/cartoon
  fashion_avatar:
    `${BASE_NEGATIVE}, cartoon, anime, illustrated, painted, 2D, flat design, sketch`,
  business_profile:
    `${BASE_NEGATIVE}, cartoon, anime, illustrated, painted, artistic filter, 2D, overly stylized`,
  pet_portrait_pro:
    `${BASE_NEGATIVE}, cartoon, flat design, anime, simple illustration, childish style`,
  couple_avatar:
    `${BASE_NEGATIVE}, cartoon, anime style, flat illustration, overly stylized`,
  cyberpunk:
    `${BASE_NEGATIVE}, cute, pastel colors, soft lighting, cartoon, watercolor`,
};

const STYLE_CORE: Record<string, string> = {
  // ─── 2D FLAT ANIME ────────────────────────────────────────────────────────

  anime_basic:
    'Transform the entire scene into a 2D flat Japanese anime illustration. Render the subject with clean cel-shading using solid color fills, precise black outlines, and large expressive anime eyes with deep luminous irises and bright catchlights. Stylize fur and hair into smooth 2D flowing strands in warm amber and cream tones. Convert background into clean 2D anime environment with simplified shapes. Pure 2D anime illustration art, webtoon quality, warm cinematic color palette.',

  anime_pro:
    'Transform the entire scene into a breathtaking masterpiece-level 2D Japanese anime illustration. Extraordinary cel-shading with beautiful gradient fills and razor-clean black outlines. Crystalline iris gradients with prismatic star catchlights. Fur and hair rendered as magnificent 2D layered strands with warm glow. Background elevated into a premium 2D anime environment with dramatic three-point lighting expressed through 2D shading. Studio Trigger meets Ufotable production quality. Pure 2D illustration, pixiv masterpiece tier.',

  soft_cartoon:
    'Transform the entire scene into a warm premium 2D soft cartoon illustration. Render the subject with rounded smooth shapes, velvety shading with gentle gradient fills, and lovable expressive cartoon eyes. Background converted into a cozy inviting 2D cartoon world. Warm honey and ivory color palette with gentle diffused lighting. Clean 2D cartoon art style. Cartoon Saloon meets Illumination Entertainment 2D animation quality.',

  cute_pet:
    'Transform the entire scene into an utterly adorable 2D kawaii illustration. Render the subject as an irresistibly cute 2D kawaii character — fluffy fur stylized into soft overlapping 2D strokes in cream and golden tones, oversized sparkling 2D anime eyes with starpoint and heart-shaped catchlights, tiny button nose. Background converted into a dreamy 2D pastel kawaii world. Clean 2D illustration art, warm pastel color palette. Premium Japanese kawaii mascot character quality.',

  simple_icon:
    'Transform the subject into a sophisticated flat 2D minimalist icon. Simplify facial and body features into clean geometric graphic shapes. Pure flat design with solid color fills, subtle soft gradient accents, no shadows, no 3D depth. Crisp precise vector-quality linework. Background neutralized to a clean gradient. 2D flat design only. Japanese minimalism meets modern brand identity, premium iOS app icon quality.',

  soft_storybook:
    'Transform the entire scene into an enchanting 2D hand-painted watercolor storybook illustration. Render with visible brushstroke texture on warm paper grain, soft dreamy edges, organic flowing shapes. Warm golden lamplight atmosphere suffusing every element. Background converted into a magical 2D illustrated world with soft washes of color. 2D watercolor painting art. Studio Ghibli warmth meets Beatrix Potter delicacy.',

  comic_hero:
    'Transform the entire scene into a premium 2D superhero comic book illustration. Subject rendered as a powerful heroic figure with bold ink outlines, dramatic chiaroscuro ink shadows and brilliant highlight accents, dynamic energy effects at edges. Background converted into a dramatic 2D comic environment. Halftone texture in shadows. 2D comic illustration art, Alex Ross painted realism meets modern Marvel/DC premium quality.',

  kawaii_icon:
    'Transform the subject into a super-premium flat 2D kawaii character icon. Ultra-soft dreamy macaroon color palette of lavender, mint and peach. Luminous flat skin with round rosy blush marks, eyes overflowing with 2D starlight sparkles and heart reflections. Bouncy perfectly rounded shapes throughout, clean simple outlines. Background converted to a flat pastel pattern or solid. Pure 2D flat illustration. Sanrio professional character design quality.',

  // ─── 3D CGI ───────────────────────────────────────────────────────────────

  '3d_cartoon':
    'Transform the entire scene into a breathtaking 3D CGI animated character render. Subject transformed into a charming 3D animated character with Pixar-level physically-based subsurface skin scattering, volumetric rim lighting, three-dimensional fur/hair with thousands of individual dynamic strands simulated by 3D software. Expressive 3D animated eyes with volumetric depth. Background converted into a beautiful 3D animated movie environment with cinematic global illumination. Disney-Pixar big-budget production quality 3D render.',

  // ─── HYPER-DETAILED ILLUSTRATION ──────────────────────────────────────────

  pet_portrait_pro:
    'Transform the entire scene into a majestic fine-art animal portrait. Subject rendered with extraordinary hyper-detailed realism: Baroque Rembrandt-style dramatic warm lighting with rich deep shadows, individual fur strands rendered at micro-detail level showing texture and sheen, soulful eyes with extraordinary emotional depth and inner light. Background transformed into a rich jewel-toned painterly studio environment. Dutch Golden Age old-master oil painting quality meets David Yarrow luxury wildlife photography.',

  // ─── CINEMATIC PHOTOREALISTIC ─────────────────────────────────────────────

  fashion_avatar:
    'Transform the entire scene into an ultra-luxury Vogue editorial fashion portrait. Subject rendered with professional studio Rembrandt lighting — perfect key-fill-hair light triangle, luminous flawless skin with natural pore texture visible. Background converted to elegant shallow-bokeh studio environment with seamless gradient. Sophisticated desaturated cinematic color grading. Photorealistic editorial photography quality. Helmut Newton meets Annie Leibovitz.',

  business_profile:
    'Transform the entire scene into a premium professional executive portrait. Subject rendered with immaculate three-point studio lighting, composed and authoritative, razor-sharp detail with professional skin refinement. Background neutralized and softened to a clean professional dark gradient. Subtle warm Kodak Portra film grain. Photorealistic studio photography quality. Fortune 500 CEO board portrait.',

  cyberpunk:
    'Transform the entire scene into a cinematic cyberpunk world. Subject rendered with dramatic electric cyan and magenta neon rim lighting slicing through atmospheric volumetric fog. Rain-slicked textures with micro-detail. Background converted into a dark neon-drenched dystopian cityscape with holographic signage. Cinematic color grade with deep blacks. Blade Runner 2049 cinematography meets Ghost in the Shell. Photorealistic cinematic quality.',

  couple_avatar:
    'Transform the entire scene into a cinematic romantic portrait. Subjects bathed in warm golden-hour backlight creating luminous rim lighting. Amber and rose cinematic color grading, intimate emotionally resonant composition. Background converted into a beautiful bokeh-filled golden-hour environment. Subtle film photography texture with dreamy lens flare. Photorealistic cinematic quality. Wes Anderson visual symmetry meets Terrence Malick golden-hour poetry.',
};

const QUALITY_SUFFIX =
  'Ultra-detailed, premium quality, stunning visual impact, professional result.';

export function getPromptForStyle(styleId: string): { prompt: string; negativePrompt: string } {
  const core = STYLE_CORE[styleId] ?? `${styleId} style portrait transformation`;
  const neg = STYLE_NEGATIVE[styleId] ?? BASE_NEGATIVE;
  return {
    prompt: `${core} ${QUALITY_SUFFIX}`,
    negativePrompt: neg,
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

export const MODEL_PARAMS: Record<'free' | 'paid' | 'premium', ModelParams> = {
  free:    { strength: 0.72, num_inference_steps: 25, guidance_scale: 3.0 },
  paid:    { strength: 0.76, num_inference_steps: 35, guidance_scale: 3.5 },
  premium: { strength: 0.80, num_inference_steps: 40, guidance_scale: 4.0 },
};
