import { fal } from '@fal-ai/client';
import { AIProvider, GenerateParams } from './types';
import { getPromptForStyle, MODEL_PARAMS } from '@/lib/prompts';

interface FluxPulidOutput {
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

function serializeError(err: unknown): string {
  if (err instanceof Error) {
    const obj: Record<string, unknown> = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
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

const MODEL_ID = 'fal-ai/flux-pulid';

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
    const { id_weight, num_inference_steps, guidance_scale } = MODEL_PARAMS[tier];

    const payload = {
      reference_image_url: imageUrl,
      prompt: finalPrompt,
      negative_prompt: negativePrompt,
      id_weight,
      num_inference_steps,
      guidance_scale,
      image_size: 'square_hd' as const,  // 1024×1024 — best quality for all tiers
      max_sequence_length: '256' as const,  // ensures long prompts are fully processed
      enable_safety_checker: true,
    };
    debug.requestPayload = payload;
    debug.modelInvoked = true;
    console.log(`[FAL] model invoke start — model=${MODEL_ID} count=${params.count}`);
    console.log(`[FAL] request payload: ${JSON.stringify(payload)}`);

    // PuLID doesn't support num_images — run parallel calls for count > 1
    const calls = Array.from({ length: params.count }, () =>
      fal.subscribe(MODEL_ID, { input: payload, logs: false })
    );

    let rawResults: unknown[];
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('FalProvider: timeout after 50s')), 50_000)
      );
      rawResults = await Promise.race([Promise.all(calls), timeoutPromise]);
    } catch (modelErr) {
      const errJson = serializeError(modelErr);
      debug.errorMessage = modelErr instanceof Error ? modelErr.message : String(modelErr);
      debug.errorStack = modelErr instanceof Error ? (modelErr.stack ?? null) : null;
      debug.errorJson = errJson;
      console.error(`[FAL] model FAILED:\n${errJson}`);
      throw modelErr;
    }

    debug.rawResponse = rawResults;

    const allImages: FluxPulidOutput['images'] = [];
    for (const raw of rawResults) {
      const data = (raw as { data: FluxPulidOutput }).data;
      if (!data?.images?.length) {
        const msg = `FalProvider: no images in response — raw=${JSON.stringify(raw)}`;
        debug.errorMessage = msg;
        throw new Error(msg);
      }
      // NSFW safety check
      if (data.has_nsfw_concepts?.some(Boolean)) {
        debug.errorMessage = 'nsfwContent';
        debug.errorJson = JSON.stringify({ nsfwDetected: true, has_nsfw_concepts: data.has_nsfw_concepts });
        console.warn('[FAL] NSFW content detected — blocking result');
        throw new Error('nsfwContent');
      }
      allImages.push(...data.images);
    }

    const urls = allImages.map((img) => img.url);
    console.log(`[FAL] success — ${urls.length} image(s): ${urls.join(', ')}`);
    return urls;
  }
}
