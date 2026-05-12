import { fal } from '@fal-ai/client';
import { AIProvider, GenerateParams } from './types';

// Crafted per-style prompts: preserve identity, premium feel, SNS-avatar ready
const FAL_STYLE_PROMPTS: Record<string, string> = {
  anime_basic:
    'anime style portrait, beautiful cel-shaded illustration, clean expressive line art, vivid saturated colors, soft color gradients, detailed sparkling eyes, gentle highlights, kawaii aesthetics, square avatar crop',
  soft_cartoon:
    'soft cartoon character portrait, warm pastel color palette, friendly rounded face, Disney-Pixar inspired illustration, gentle shadow work, charming likeable expression, cozy storybook feel',
  cute_pet:
    'adorable kawaii chibi animal character avatar, big luminous sparkly eyes, soft pastel fur texture, cute anthropomorphic design, SNS profile picture, Japan-style illustration',
  simple_icon:
    'minimalist flat vector portrait icon, bold geometric face simplification, clean flat color fills, modern mobile UI icon style, single vivid accent color, crisp white outline',
  '3d_cartoon':
    'Pixar Disney 3D animated character, highly expressive face, realistic subsurface skin scattering, cinematic studio rim lighting, photoreal 3D render, top-tier CGI quality',
  anime_pro:
    'premium professional anime character portrait, dynamic dramatic illustration, rich jewel-tone colors, intricate hair and eye detail, top Japanese animation studio quality, volumetric lighting',
  soft_storybook:
    'enchanting watercolor storybook portrait, dreamy soft warm tones, delicate hand-painted brushwork texture, fairy-tale picture-book cover illustration, gentle glowing atmosphere',
  cyberpunk:
    'cyberpunk neon portrait, holographic scanline overlay, dark futuristic megacity backdrop, electric cyan and magenta neon highlights, tech-enhanced augmented look, glitch-art aesthetic',
  comic_hero:
    'Marvel DC comic book superhero portrait, dynamic bold ink outlines, halftone dot shading, primary color blocking, heroic confident expression, action-pose energy',
  fashion_avatar:
    'high-fashion editorial portrait avatar, luxury couture styling, dramatic contour makeup, high-contrast glamour lighting, Vogue magazine cover aesthetic, premium SNS influencer vibe',
  business_profile:
    'polished professional business headshot, neutral gradient backdrop, confident poised expression, executive leadership presence, modern business attire, LinkedIn ready, approachable smile',
  pet_portrait_pro:
    'fine-art professional studio pet portrait, ultra-detailed realistic fur rendering, creamy bokeh background, warm golden-hour rim lighting, gallery exhibition quality photograph',
  couple_avatar:
    'matching couple chibi cartoon portrait pair, harmonious coordinated color palette, sweet romantic mood, coordinated matching outfits, cute SNS couple profile icon',
  kawaii_icon:
    'ultra-kawaii hyper-cute chibi illustration, cotton-candy pastel palette, enormous luminous glitter eyes, rosy blush cheeks, heart motifs, premium Japan SNS avatar style',
};

interface FluxImg2ImgOutput {
  images: Array<{ url: string; width: number; height: number; content_type: string }>;
  seed: number;
  prompt: string;
}

export class FalProvider implements AIProvider {
  readonly name = 'fal';
  readonly isTextToImage = false;

  isAvailable(): boolean {
    return !!process.env.FAL_KEY;
  }

  async generate(params: GenerateParams): Promise<string[]> {
    if (!params.imageBase64) throw new Error('FalProvider requires imageBase64');

    fal.config({ credentials: process.env.FAL_KEY });

    // Upload base64 image to fal storage to obtain a CDN URL
    const b64 = params.imageBase64.includes(',')
      ? params.imageBase64.split(',')[1]
      : params.imageBase64;
    const imageBuffer = Buffer.from(b64, 'base64');
    const file = new File([imageBuffer], 'upload.jpg', { type: 'image/jpeg' });
    const imageUrl = await fal.storage.upload(file);

    const stylePrompt =
      params.prompt || FAL_STYLE_PROMPTS[params.style] || `${params.style} style portrait`;
    const fullPrompt = `${stylePrompt}, portrait orientation, face-centered composition, high resolution, masterpiece`;

    const falRequest = fal.subscribe('fal-ai/flux/dev/image-to-image', {
      input: {
        image_url: imageUrl,
        prompt: fullPrompt,
        // 0.78 preserves facial identity while strongly applying the style
        strength: 0.78,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: params.count,
        output_format: 'jpeg',
        enable_safety_checker: true,
      },
      logs: false,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('FalProvider: timeout after 45s')), 45_000)
    );

    const result = await Promise.race([falRequest, timeoutPromise]);
    const data = result.data as FluxImg2ImgOutput;
    if (!data?.images?.length) throw new Error('FalProvider: no images returned');
    return data.images.map((img) => img.url);
  }
}
