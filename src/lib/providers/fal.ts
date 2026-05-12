import { fal } from '@fal-ai/client';
import { AIProvider, GenerateParams } from './types';
import { getPromptForStyle, MODEL_PARAMS } from '@/lib/prompts';

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
    const { prompt: autoPrompt, negativePrompt } = getPromptForStyle(params.style);
    const finalPrompt = params.prompt || autoPrompt;

    const tier = params.mode === 'free' ? 'free' : 'paid';
    const { strength, num_inference_steps, guidance_scale } = MODEL_PARAMS[tier];

    const payload = {
      image_url: imageUrl,
      prompt: finalPrompt,
      negative_prompt: negativePrompt,
      strength,
      num_inference_steps,
      guidance_scale,
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
