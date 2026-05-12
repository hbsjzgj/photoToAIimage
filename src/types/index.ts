export type Locale = 'ja' | 'en' | 'zh';

export type GenerationMode = 'free' | 'paid';

export type StyleId =
  | 'anime_basic'
  | 'soft_cartoon'
  | 'cute_pet'
  | 'simple_icon'
  | '3d_cartoon'
  | 'anime_pro'
  | 'soft_storybook'
  | 'cyberpunk'
  | 'comic_hero'
  | 'fashion_avatar'
  | 'business_profile'
  | 'pet_portrait_pro'
  | 'couple_avatar'
  | 'kawaii_icon';

export const FREE_STYLES: StyleId[] = [
  'anime_basic',
  'soft_cartoon',
  'cute_pet',
  'simple_icon'
];

export const PAID_STYLES: StyleId[] = [
  '3d_cartoon',
  'anime_pro',
  'soft_storybook',
  'cyberpunk',
  'comic_hero',
  'fashion_avatar',
  'business_profile',
  'pet_portrait_pro',
  'couple_avatar',
  'kawaii_icon'
];

export const ALL_STYLES: StyleId[] = [...FREE_STYLES, ...PAID_STYLES];

// Replicate PhotoMaker style name mapping
export const STYLE_TO_REPLICATE: Record<StyleId, string> = {
  anime_basic: 'Digital Art',
  soft_cartoon: 'Disney Character',
  cute_pet: 'Disney Character',
  simple_icon: 'Line art',
  '3d_cartoon': 'Digital Art',
  anime_pro: 'Digital Art',
  soft_storybook: 'Fantasy art',
  cyberpunk: 'Neonpunk',
  comic_hero: 'Comic book',
  fashion_avatar: 'Photographic (Default)',
  business_profile: 'Photographic (Default)',
  pet_portrait_pro: 'Disney Character',
  couple_avatar: 'Disney Character',
  kawaii_icon: 'Digital Art'
};

// Style-specific prompts
export const STYLE_PROMPTS: Record<StyleId, string> = {
  anime_basic: 'anime style portrait, cute character, digital art, clean lines',
  soft_cartoon: 'soft cartoon portrait, warm colors, friendly character, rounded features',
  cute_pet: 'cute cartoon pet avatar, adorable animal character, kawaii style',
  simple_icon: 'simple icon avatar, minimal flat design, clean vector art',
  '3d_cartoon': 'pixar style 3D cartoon character, expressive, high quality render',
  anime_pro: 'professional anime artwork, detailed character design, vibrant colors',
  soft_storybook: 'storybook illustration style, soft watercolor, whimsical character',
  cyberpunk: 'cyberpunk portrait, neon colors, futuristic, sci-fi aesthetic',
  comic_hero: 'comic book hero portrait, bold lines, dynamic, superhero style',
  fashion_avatar: 'fashion portrait avatar, stylish, modern, trendy look',
  business_profile: 'professional business headshot, clean background, confident look',
  pet_portrait_pro: 'professional pet portrait, realistic fur detail, warm lighting',
  couple_avatar: 'couple cartoon avatar, matching art style, cute and sweet',
  kawaii_icon: 'kawaii chibi icon, super cute, pastel colors, big eyes'
};

// Instruction-style prompts for instruct-pix2pix img2img
export const STYLE_INSTRUCTIONS: Record<StyleId, string> = {
  anime_basic: 'convert this photo to anime style with clean lines and soft colors',
  soft_cartoon: 'transform into a soft cartoon with warm colors and rounded friendly features',
  cute_pet: 'convert into a cute kawaii cartoon pet avatar with adorable proportions',
  simple_icon: 'simplify into a minimal flat vector icon avatar with clean lines',
  '3d_cartoon': 'transform into a Pixar-style 3D cartoon character with expressive features',
  anime_pro: 'convert to professional anime artwork with detailed character design and vibrant colors',
  soft_storybook: 'transform into a soft watercolor storybook illustration style',
  cyberpunk: 'convert to a cyberpunk portrait with neon colors and futuristic sci-fi aesthetic',
  comic_hero: 'transform into a comic book hero portrait with bold lines and dynamic style',
  fashion_avatar: 'convert to a stylish fashion portrait avatar with modern trendy look',
  business_profile: 'transform into a professional business headshot with clean background',
  pet_portrait_pro: 'convert to a professional pet portrait with realistic fur detail and warm lighting',
  couple_avatar: 'transform into a cute matching couple cartoon avatar style',
  kawaii_icon: 'convert into a kawaii chibi icon with pastel colors and big expressive eyes'
};

export type CreditPackage = 'starter' | 'creator' | 'pro';

export const CREDIT_AMOUNTS: Record<CreditPackage, number> = {
  starter: 10,
  creator: 30,
  pro: 100
};

export const FREE_DAILY_LIMIT = 3;        // logged-in users
export const FREE_DAILY_LIMIT_ANON = 1;   // anonymous (IP-based)
export const FREE_OUTPUT_SIZE = '512x512';
export const PAID_OUTPUT_SIZES = ['1024x1024', '1536x1536'] as const;

export interface GenerateRequest {
  imageBase64: string;
  style: StyleId;
  mode: GenerationMode;
  count: 1 | 4;
  outputSize?: string;
}

export interface GenerateResult {
  projectId: string;
  variants: { id: string; imageUrl: string }[];
  creditsUsed: number;
  hasWatermark: boolean;
}
