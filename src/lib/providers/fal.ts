import { fal } from '@fal-ai/client';
import { AIProvider, GenerateParams } from './types';

// Premium per-style prompts — cinematic, identity-preserving, SNS-avatar ready
const FAL_STYLE_PROMPTS: Record<string, string> = {
  anime_basic:
    'Japanese anime portrait, precise cel-shading, clean crisp linework, luminous soft eyes with detailed iris, cinematic side lighting, subtle gradient blush, muted pastel harmony, clean background, premium studio-quality digital illustration, face-centered square avatar, no distortion',

  soft_cartoon:
    'gentle cartoon portrait, soft studio lighting, warm cream and blush palette, smooth rounded features, large expressive eyes with soft catchlights, delicate brush texture, natural skin tones, clean minimal background, charming dignified expression, premium editorial illustration quality',

  cute_pet:
    'adorable anthropomorphic animal portrait, soft painterly texture, luminous big eyes with detailed reflections, pastel fur with subtle color variation, cinematic diffused rim light, clean bright background, premium Japan-style character illustration, kawaii but sophisticated, balanced warm palette',

  simple_icon:
    'minimalist geometric portrait icon, clean vector aesthetic, bold flat shapes with subtle gradient, single warm accent against neutral ground, precise linework, refined UI icon style, modern app icon composition, no excessive detail, premium design quality',

  '3d_cartoon':
    'Pixar-quality 3D character portrait, photorealistic subsurface skin scattering, expressive sculpted features, soft cinematic three-point studio lighting, rich ambient occlusion, fine hair strand detail, smooth shading transitions, clean neutral backdrop, high-end CG render quality',

  anime_pro:
    'premium anime portrait by a top Japanese animation studio, exquisite detailed eyes with multilayer iris shading, precise dynamic hair with individual strand rendering, cinematic volumetric side lighting, dramatic soft shadow on face, subtle lens flare, rich saturated jewel tones, editorial illustration quality, no cheap AI artifacts',

  soft_storybook:
    'fine watercolor storybook portrait, translucent layered washes, soft warm backlighting, delicate pencil undertone visible through color, natural paper texture, muted earthy palette with golden highlights, intimate close composition, gentle dreamy atmosphere, premium picture-book illustration quality',

  cyberpunk:
    'premium cyberpunk portrait, dramatic low-key cinematic lighting, electric teal and magenta neon rim light, cool dark background with bokeh city reflections, subtle holographic skin overlay, clean sharp features, high-contrast editorial mood, sophisticated futuristic aesthetic, no garish excess',

  comic_hero:
    'premium comic book portrait, confident dynamic composition, bold clean ink lines, selective limited color palette, subtle halftone texture overlay, strong rim light, heroic expression with depth, editorial quality, inspired by high-end Marvel variant cover art, no cheap filter look',

  fashion_avatar:
    'high-fashion portrait, cinematic butterfly lighting, flawless editorial skin with natural pores, designer styling, subtle film grain, warm golden-hour color grade, bokeh background, Vogue-quality composition, glamorous yet approachable, premium Instagram influencer aesthetic, ultra-sharp detail on face',

  business_profile:
    'premium professional headshot, clean soft-box lighting, warm neutral gradient backdrop, confident natural expression, contemporary business attire, sharp detail on face and eyes, subtle background bokeh, polished yet approachable, LinkedIn executive portrait quality, no harsh shadows',

  pet_portrait_pro:
    'fine-art pet portrait, exquisite micro-detail fur rendering with individual hair strands, warm cinematic split lighting, shallow depth-of-field with soft bokeh, natural eye reflections, museum exhibition quality, rich warm tones, soulful expressive gaze, premium photorealistic illustration',

  couple_avatar:
    'premium matching couple chibi portrait, coordinated warm pastel palette, equal balanced composition, expressive luminous eyes, clean soft gradient background, tender natural chemistry, high-end Japan-style character illustration, Instagram couple avatar quality',

  kawaii_icon:
    'ultra-premium kawaii chibi portrait, cotton-candy gradient palette, large luminous gem-like eyes with multi-layer shine, delicate rosy blush, clean soft background, pastel color harmony, fine digital brushwork, polished Japan SNS avatar quality, sophisticated cute aesthetic, no cheap distortion',
};

interface FluxImg2ImgOutput {
  images: Array<{ url: string; width: number; height: number; content_type: string }>;
  seed: number;
  prompt: string;
  has_nsfw_concepts?: boolean[];
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
    const fullPrompt = `${stylePrompt}, centered portrait, preserve facial features and identity, high resolution, no distortion, no low quality`;

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

    // NSFW safety check — fal.ai safety checker flag
    if (data.has_nsfw_concepts?.some(Boolean)) {
      const msg = 'nsfwContent';
      debug.errorMessage = msg;
      debug.errorJson = JSON.stringify({ nsfwDetected: true, has_nsfw_concepts: data.has_nsfw_concepts });
      console.warn('[FAL] NSFW content detected — blocking result');
      throw new Error(msg);
    }

    console.log(`[FAL] success — ${data.images.length} image(s): ${data.images.map(i => i.url).join(', ')}`);
    return data.images.map((img) => img.url);
  }
}
