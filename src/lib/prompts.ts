const IDENTITY_PROMPT =
  "Preserve the original person's identity, facial structure, hairstyle, eye direction, and overall composition.";

const QUALITY_SUFFIX =
  'high quality, masterpiece, premium sns avatar, aesthetically pleasing, professional composition';

export const NEGATIVE_PROMPT =
  'low quality, blurry, distorted face, bad anatomy, deformed eyes, extra fingers, ugly teeth, duplicated face, oversaturated, cheap ai art, cartoonish, low detail, messy background, unrealistic skin, unnatural lighting, text, watermark, logo, jpeg artifacts';

const STYLE_CORE: Record<string, string> = {
  anime_pro:
    'masterpiece, premium japanese anime portrait, highly detailed face, cinematic rim lighting, soft shadows, detailed iris, clean facial composition, subtle pastel color palette, modern anime illustration, high-end character design, studio-quality rendering, smooth skin texture, expressive eyes, elegant atmosphere, ultra refined anime avatar, professional artstation quality, identity preserving portrait, centered composition, shallow depth of field',

  soft_storybook:
    'dreamy storybook illustration, soft watercolor lighting, warm pastel tones, cozy atmosphere, delicate facial details, gentle smile, hand-painted texture, whimsical cinematic portrait, soft depth of field, premium illustration style, elegant composition, refined anime-inspired storybook art, emotional lighting, peaceful mood',

  cute_pet:
    'adorable premium pet portrait, kawaii japanese illustration style, fluffy fur details, expressive eyes, soft cinematic lighting, clean pastel background, charming animal avatar, high-end pet illustration, ultra cute composition, warm and friendly atmosphere, professional sns pet icon, highly detailed fur texture',

  fashion_avatar:
    'luxury fashion portrait, high-end editorial photography style, cinematic beauty lighting, elegant facial features, luxury magazine aesthetic, premium instagram avatar, stylish composition, subtle glow, soft skin detail, rich color grading, sophisticated atmosphere, modern fashion campaign quality, centered portrait, identity preserving',

  business_profile:
    'professional executive portrait, modern corporate photography, clean luxury lighting, premium linkedin style profile photo, sharp facial detail, subtle cinematic contrast, elegant business atmosphere, realistic skin texture, confident expression, studio portrait quality, high-end branding portrait, professional sns avatar',

  cyberpunk:
    'premium cyberpunk portrait, cinematic neon rim lighting, futuristic atmosphere, high-detail facial rendering, moody sci-fi lighting, sharp eyes, advanced holographic glow, luxury cyber aesthetic, high-end game cinematic quality, dark futuristic city ambiance, identity preserving portrait, ultra detailed composition',

  kawaii_icon:
    'super cute japanese kawaii icon, clean minimal illustration, soft pastel palette, adorable facial expression, highly polished anime icon style, premium social avatar, charming composition, soft glow lighting, rounded design language, modern japanese sns aesthetic, ultra cute portrait',

  comic_hero:
    'cinematic superhero portrait, premium comic illustration, dramatic lighting, sharp jawline, intense eyes, dynamic atmosphere, marvel-inspired composition, high-detail rendering, epic hero aesthetic, bold cinematic shadows, powerful expression, modern graphic novel quality',

  soft_cartoon:
    'soft premium cartoon portrait, smooth clean shading, elegant cartoon rendering, warm cinematic lighting, expressive eyes, high-end animation style, polished character design, cozy atmosphere, premium family-friendly avatar aesthetic, subtle gradients, centered portrait',

  '3d_cartoon':
    'premium 3d animated portrait, pixar-inspired lighting, cinematic rendering, ultra clean 3d character design, realistic facial proportions, soft global illumination, high-end animated movie quality, charming expression, luxury avatar style, smooth skin rendering, detailed eyes',

  simple_icon:
    'minimal premium avatar icon, clean flat illustration, elegant japanese minimalism, smooth linework, centered composition, subtle pastel colors, soft gradients, modern app icon aesthetic, highly polished vector-inspired portrait, professional social avatar design',

  pet_portrait_pro:
    'luxury pet portrait photography illustration, highly detailed fur texture, cinematic studio lighting, elegant animal composition, rich warm tones, premium instagram pet aesthetic, ultra refined rendering, expressive animal eyes, professional commercial pet portrait style',

  couple_avatar:
    'romantic couple portrait, cinematic emotional lighting, elegant anime-inspired composition, soft pastel atmosphere, premium relationship avatar aesthetic, warm facial expressions, highly detailed illustration, luxury sns couple icon, emotional storytelling mood, harmonious composition',

  anime_basic:
    'clean anime portrait, modern japanese illustration, soft lighting, expressive eyes, polished character rendering, centered avatar composition, smooth anime shading, attractive face detail, pleasant color palette, sns-ready anime profile picture',
};

export function getPromptForStyle(styleId: string): { prompt: string; negativePrompt: string } {
  const core = STYLE_CORE[styleId] ?? `${styleId} style portrait`;
  return {
    prompt: `${IDENTITY_PROMPT} ${core}, ${QUALITY_SUFFIX}`,
    negativePrompt: NEGATIVE_PROMPT,
  };
}

export interface ModelParams {
  strength: number;
  num_inference_steps: number;
  guidance_scale: number;
}

export const MODEL_PARAMS: Record<'free' | 'paid' | 'premium', ModelParams> = {
  free:    { strength: 0.72, num_inference_steps: 18, guidance_scale: 2.8 },
  paid:    { strength: 0.78, num_inference_steps: 28, guidance_scale: 3.5 },
  premium: { strength: 0.82, num_inference_steps: 35, guidance_scale: 4.0 },
};
