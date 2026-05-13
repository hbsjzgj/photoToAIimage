// FLUX-PuLID prompts: natural language, cinematic specificity, luxury references
// FLUX does NOT need keyword spam — detailed descriptive sentences work better

const IDENTITY_PROMPT =
  "The subject is the exact same person from the reference photo, preserving their unique facial bone structure, eye shape and color, nose, lips, and all distinctive personal characteristics.";

const QUALITY_SUFFIX =
  'Stunning composition, breathtaking quality, ultra-detailed, professional artistry, premium flagship result.';

export const NEGATIVE_PROMPT =
  'ugly, disfigured, deformed face, distorted features, extra limbs, blurry face, low quality, watermark, text, oversaturated colors, flat boring lighting, cheap AI look, amateur composition';

const STYLE_CORE: Record<string, string> = {
  anime_basic:
    'An exquisite anime-style portrait with crystalline luminous eyes featuring detailed iris gradients and bright catchlights, clean precise cel-shading, soft butterfly lighting, subtle cherry blossom bokeh, polished premium webtoon character art aesthetic',

  anime_pro:
    'A breathtaking masterpiece-level Japanese anime illustration — razor-sharp linework with extraordinary detail, stunning luminous eyes with prismatic iris gradients and star catchlights, dramatic cinematic three-point rim lighting with ethereal atmospheric depth, silky smooth skin with subsurface glow, Studio Trigger meets modern premium anime aesthetic, pixiv trending quality',

  soft_cartoon:
    'A charming premium soft cartoon portrait with velvety smooth shading, warm honey and ivory color palette, gentle cinematic wrap lighting creating soft shadows, lovable expressive character design, Cartoon Saloon meets Illumination Entertainment premium animation aesthetic, warm and inviting emotional atmosphere',

  cute_pet:
    'An utterly adorable kawaii pet portrait with extraordinarily fluffy textured fur showing individual strand detail, sparkling doe eyes with bright starpoint catchlights, dreamy pastel color palette, ultra-detailed fur rendering, soft professional studio box lighting, premium Japanese character mascot illustration quality',

  simple_icon:
    'A sophisticated minimalist premium icon portrait, elegant geometric simplification of facial features into a clean graphic, crisp vector-quality linework, contemporary flat design with subtle gradient accents, Japanese minimalism meets modern brand identity design, premium iOS App Store app icon aesthetic',

  '3d_cartoon':
    'A breathtaking premium 3D animated character portrait — physically-based subsurface skin scattering, Pixar-level cinematic global illumination, clean topology with perfect character proportions, volumetric rim lighting creating gorgeous depth, Disney-Pixar big-budget production quality render with warm inviting color palette',

  soft_storybook:
    'An enchanting hand-painted watercolor illustration with visible paper texture and delicate brushstroke detail, warm golden lamplight atmosphere, emotional depth and narrative mood, Studio Ghibli magic meets Beatrix Potter delicacy, premium artisan childrens book illustration quality with timeless appeal',

  cyberpunk:
    'An electrifying cinematic cyberpunk portrait — dramatic electric cyan and magenta neon rim lighting slicing through atmospheric volumetric fog, rain-slicked skin with micro-detail pores, holographic iris implants with circuitry glow, neural interface hardware, Blade Runner 2049 cinematography meets Ghost in the Shell artistry, ultra-detailed 8K cinematic quality',

  comic_hero:
    'An epic superhero portrait in the tradition of Alex Ross painted realism — dramatic chiaroscuro lighting with ink-black shadows and brilliant highlight accents, heroic composition radiating unstoppable power, dynamic energy effects crackling at edges, bold and fearless, premium Marvel Studios meets DC Comics painted illustration quality',

  fashion_avatar:
    'An ultra-luxury Vogue editorial fashion portrait — professional Rembrandt lighting setup with perfect key-fill-hair light triangle, luminous flawless complexion with natural skin texture, sophisticated desaturated cinematic color grading, luxurious shallow bokeh at 85mm f/1.4, Helmut Newton meets Annie Leibovitz editorial photography quality',

  business_profile:
    'A premium executive portrait headshot — immaculate three-point studio lighting with perfectly placed catchlight, composed authoritative expression with natural depth, razor-sharp facial detail with professional skin refinement, subtle warm Kodak Portra film grain, Fortune 500 CEO board portrait quality, polished and trustworthy',

  pet_portrait_pro:
    'A majestic fine-art animal portrait in the classical tradition — Baroque Rembrandt-style dramatic warm lighting with rich shadows, hyper-detailed individual fur texture with micro-strand rendering, soulful expressive eyes with extraordinary emotional depth, jewel-toned museum-quality background, Dutch Golden Age oil painting meets David Yarrow wildlife photography',

  couple_avatar:
    'A cinematic romantic portrait — bathed in warm golden-hour backlight creating a luminous halo, amber and rose cinematic color grading, emotionally resonant intimate composition, subtle film photography texture with beautiful lens flare bokeh, Wes Anderson symmetry meets Steven Spielberg emotional storytelling visual poetry',

  kawaii_icon:
    'A super-premium kawaii character icon — ultra-soft dreamy macaroon palette of lavender, mint and peach, luminous pearl-shimmer skin with rosy blush, eyes filled with starlight and sparkles, bouncy rounded modern design language, Sanrio aesthetic meets contemporary streetwear culture, professionally crafted premium LINE sticker character quality',
};

export function getPromptForStyle(styleId: string): { prompt: string; negativePrompt: string } {
  const core = STYLE_CORE[styleId] ?? `${styleId} style portrait`;
  return {
    prompt: `${IDENTITY_PROMPT} ${core}. ${QUALITY_SUFFIX}`,
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
  id_weight: number;
  num_inference_steps: number;
  guidance_scale: number;
}

export const MODEL_PARAMS: Record<'free' | 'paid' | 'premium', ModelParams> = {
  free:    { id_weight: 1.0, num_inference_steps: 20, guidance_scale: 4.0 },
  paid:    { id_weight: 1.0, num_inference_steps: 28, guidance_scale: 5.0 },
  premium: { id_weight: 0.9, num_inference_steps: 35, guidance_scale: 6.0 },
};
