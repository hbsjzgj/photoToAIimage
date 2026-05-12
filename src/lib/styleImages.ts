import type { StyleId } from '@/types';

const BASE = 'https://image.pollinations.ai/prompt';
const PARAMS = 'width=512&height=682&nologo=true&enhance=false';

const PROMPTS: Record<StyleId, { prompt: string; seed: number }> = {
  anime_basic:      { prompt: 'anime style portrait young woman clean lines soft lighting pastel blue background high quality',          seed: 1001 },
  anime_pro:        { prompt: 'professional anime girl portrait cinematic dramatic lighting dark atmospheric background ultra detailed',  seed: 1002 },
  soft_cartoon:     { prompt: 'cute soft cartoon girl portrait round face warm pastel tones gentle smile disney pixar inspired',         seed: 1003 },
  cute_pet:         { prompt: 'kawaii cat girl anime portrait fluffy white ears big sparkly eyes pastel pink background adorable',       seed: 1004 },
  simple_icon:      { prompt: 'flat vector portrait minimal design two tone clean geometric shapes modern icon style white background',  seed: 1005 },
  '3d_cartoon':     { prompt: '3D rendered cartoon girl portrait pixar cgi quality round face studio lighting vibrant smooth render',   seed: 1006 },
  soft_storybook:   { prompt: 'watercolor portrait illustration storybook art style soft pastel colors dreamy gentle brushwork',        seed: 1007 },
  cyberpunk:        { prompt: 'cyberpunk girl portrait neon purple cyan lights futuristic dark city dramatic shadows edgy aesthetic',   seed: 1008 },
  comic_hero:       { prompt: 'comic book hero girl portrait bold ink lines bright saturated colors dynamic superhero style artwork',   seed: 1009 },
  fashion_avatar:   { prompt: 'fashion illustration portrait elegant woman high fashion runway style warm golden tones chic magazine',  seed: 1010 },
  business_profile: { prompt: 'professional headshot woman clean studio background confident expression smart business attire',         seed: 1011 },
  pet_portrait_pro: { prompt: 'hyperrealistic cat portrait detailed fur texture soft studio lighting dark background award winning',    seed: 1012 },
  couple_avatar:    { prompt: 'cute couple cartoon portrait matching manga style soft romantic pink tones loving expression',           seed: 1013 },
  kawaii_icon:      { prompt: 'super cute kawaii chibi girl huge round eyes pastel pink blue adorable sticker illustration',           seed: 1014 },
};

export function getStyleImageUrl(styleId: StyleId): string {
  const { prompt, seed } = PROMPTS[styleId];
  return `${BASE}/${encodeURIComponent(prompt)}?${PARAMS}&seed=${seed}`;
}

export const STYLE_IMAGE_URLS: Record<StyleId, string> = Object.fromEntries(
  (Object.keys(PROMPTS) as StyleId[]).map((id) => [id, getStyleImageUrl(id)])
) as Record<StyleId, string>;
