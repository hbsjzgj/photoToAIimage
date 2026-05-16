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
  | 'kawaii_icon'
  | 'ghibli'
  | 'oil_painting'
  | 'pixel_art'
  | 'pop_art'
  | 'pencil_sketch'
  | 'van_gogh'
  | 'lego_figure'
  | 'action_figure'
  | 'claymation'
  | 'sumi_e'
  | 'dark_fantasy'
  | 'kpop_idol'
  | 'neon_portrait'
  | 'vintage_film'
  | 'ukiyo_e'
  | 'tarot_card'
  | 'webtoon'
  | 'sticker_art'
  | '3d_clay'
  | 'impressionist';

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
  'kawaii_icon',
  'ghibli',
  'oil_painting',
  'pixel_art',
  'pop_art',
  'pencil_sketch',
  'van_gogh',
  'lego_figure',
  'action_figure',
  'claymation',
  'sumi_e',
  'dark_fantasy',
  'kpop_idol',
  'neon_portrait',
  'vintage_film',
  'ukiyo_e',
  'tarot_card',
  'webtoon',
  'sticker_art',
  '3d_clay',
  'impressionist'
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
  kawaii_icon: 'Digital Art',
  ghibli: 'Digital Art',
  oil_painting: 'Photographic (Default)',
  pixel_art: 'Line art',
  pop_art: 'Comic book',
  pencil_sketch: 'Line art',
  van_gogh: 'Fantasy art',
  lego_figure: 'Digital Art',
  action_figure: 'Digital Art',
  claymation: 'Digital Art',
  sumi_e: 'Fantasy art',
  dark_fantasy: 'Fantasy art',
  kpop_idol: 'Photographic (Default)',
  neon_portrait: 'Neonpunk',
  vintage_film: 'Photographic (Default)',
  ukiyo_e: 'Line art',
  tarot_card: 'Fantasy art',
  webtoon: 'Digital Art',
  sticker_art: 'Digital Art',
  '3d_clay': 'Digital Art',
  impressionist: 'Fantasy art'
};


export type CreditPackage = 'starter' | 'creator' | 'pro';

export const CREDIT_AMOUNTS: Record<CreditPackage, number> = {
  starter: 10,
  creator: 30,
  pro: 100
};

export const FREE_DAILY_LIMIT = 3;        // logged-in users
export const FREE_DAILY_LIMIT_ANON = 3;   // anonymous (IP-based)
export const FREE_OUTPUT_SIZE = '1024x1024';
export const PAID_OUTPUT_SIZES = ['1024x1024', '1536x1536'] as const;

export interface GenerateRequest {
  imageBase64: string;
  style: StyleId;
  mode: GenerationMode;
  count: 1 | 4;
  outputSize?: string;
  styleStrength?: number; // 1–10
}

export interface GenerateResult {
  projectId: string;
  variants: { id: string; imageUrl: string }[];
  creditsUsed: number;
  hasWatermark: boolean;
}
