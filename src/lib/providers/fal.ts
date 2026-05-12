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

// Per-call debug state — written during generate(), read by the debug API
export interface FalDebugState {
  keyPresent: boolean;
  keyPrefix: string;
  initialized: boolean;
  uploadStart: boolean;
  uploadSuccess: boolean;
  uploadUrl: string | null;
  modelInvoked: boolean;
  modelId: string;
  requestPayload: Record<string, unknown> | null;
  rawResponse: unknown;
  errorMessage: string | null;
  errorStack: string | null;
  errorJson: string | null;
}

let _lastDebug: FalDebugState | null = null;

export function getFalLastDebug(): FalDebugState | null {
  return _lastDebug;
}

export function resetFalDebug(): void {
  _lastDebug = null;
}

// Serialize any thrown value into a JSON-safe string, capturing all properties
function serializeError(err: unknown): string {
  if (err instanceof Error) {
    const obj: Record<string, unknown> = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
    // fal SDK errors carry status/body/etc. as enumerable own properties
    for (const key of Object.keys(err)) {
      obj[key] = (err as unknown as Record<string, unknown>)[key];
    }
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return `${err.name}: ${err.message}\n${err.stack}`;
    }
  }
  try {
    return JSON.stringify(err, null, 2);
  } catch {
    return String(err);
  }
}

const MODEL_ID = 'fal-ai/flux/dev/image-to-image';

export class FalProvider implements AIProvider {
  readonly name = 'fal';
  readonly isTextToImage = false;

  isAvailable(): boolean {
    return !!process.env.FAL_KEY;
  }

  async generate(params: GenerateParams): Promise<string[]> {
    const debug: FalDebugState = {
      keyPresent: !!process.env.FAL_KEY,
      keyPrefix: process.env.FAL_KEY
        ? `${process.env.FAL_KEY.substring(0, 8)}...`
        : '(none)',
      initialized: false,
      uploadStart: false,
      uploadSuccess: false,
      uploadUrl: null,
      modelInvoked: false,
      modelId: MODEL_ID,
      requestPayload: null,
      rawResponse: null,
      errorMessage: null,
      errorStack: null,
      errorJson: null,
    };
    _lastDebug = debug;

    console.log(`[FAL] start — keyPresent=${debug.keyPresent} keyPrefix=${debug.keyPrefix}`);

    if (!params.imageBase64) {
      const err = new Error('FalProvider requires imageBase64');
      debug.errorMessage = err.message;
      throw err;
    }

    // ── Init SDK ──────────────────────────────────────────────
    fal.config({ credentials: process.env.FAL_KEY });
    debug.initialized = true;
    console.log('[FAL] initialized');

    // ── Upload image ──────────────────────────────────────────
    console.log('[FAL] upload image start');
    debug.uploadStart = true;

    const b64 = params.imageBase64.includes(',')
      ? params.imageBase64.split(',')[1]
      : params.imageBase64;
    const imageBuffer = Buffer.from(b64, 'base64');
    console.log(`[FAL] image buffer size: ${imageBuffer.length} bytes`);

    let imageUrl: string;
    try {
      const file = new File([imageBuffer], 'upload.jpg', { type: 'image/jpeg' });
      imageUrl = await fal.storage.upload(file);
      debug.uploadSuccess = true;
      debug.uploadUrl = imageUrl;
      console.log(`[FAL] upload image success: ${imageUrl}`);
    } catch (uploadErr) {
      const errJson = serializeError(uploadErr);
      debug.errorMessage = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
      debug.errorStack = uploadErr instanceof Error ? (uploadErr.stack ?? null) : null;
      debug.errorJson = errJson;
      console.error(`[FAL] upload FAILED:\n${errJson}`);
      throw uploadErr;
    }

    // ── Model invoke ──────────────────────────────────────────
    const stylePrompt =
      params.prompt || FAL_STYLE_PROMPTS[params.style] || `${params.style} style portrait`;
    const fullPrompt = `${stylePrompt}, portrait orientation, face-centered composition, high resolution, masterpiece`;

    const payload = {
      image_url: imageUrl,
      prompt: fullPrompt,
      strength: 0.78,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: params.count,
      output_format: 'jpeg' as 'jpeg' | 'png',
      enable_safety_checker: true,
    };
    debug.requestPayload = payload;
    debug.modelInvoked = true;
    console.log(`[FAL] model invoke start — model=${MODEL_ID}`);
    console.log(`[FAL] request payload: ${JSON.stringify(payload)}`);

    let rawResult: unknown;
    try {
      const falRequest = fal.subscribe(MODEL_ID, { input: payload, logs: false });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('FalProvider: timeout after 45s')), 45_000)
      );
      rawResult = await Promise.race([falRequest, timeoutPromise]);
    } catch (modelErr) {
      const errJson = serializeError(modelErr);
      debug.errorMessage = modelErr instanceof Error ? modelErr.message : String(modelErr);
      debug.errorStack = modelErr instanceof Error ? (modelErr.stack ?? null) : null;
      debug.errorJson = errJson;
      console.error(`[FAL] model FAILED:\n${errJson}`);
      throw modelErr;
    }

    debug.rawResponse = rawResult;
    console.log(`[FAL] raw response: ${JSON.stringify(rawResult)}`);

    const data = (rawResult as { data: FluxImg2ImgOutput }).data;
    if (!data?.images?.length) {
      const msg = `FalProvider: no images in response — raw=${JSON.stringify(rawResult)}`;
      debug.errorMessage = msg;
      throw new Error(msg);
    }

    console.log(`[FAL] success — ${data.images.length} image(s): ${data.images.map(i => i.url).join(', ')}`);
    return data.images.map((img) => img.url);
  }
}
