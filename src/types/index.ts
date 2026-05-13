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
}

export interface GenerateResult {
  projectId: string;
  variants: { id: string; imageUrl: string }[];
  creditsUsed: number;
  hasWatermark: boolean;
}
