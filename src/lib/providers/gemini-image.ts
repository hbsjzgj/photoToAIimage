import { GoogleGenAI } from '@google/genai';
import { AIProvider, GenerateParams, NonRetriableError } from './types';
import { getGeminiPrompt } from '@/lib/prompts';
import { getStorageProvider } from '@/lib/storage';

const MODEL_ID = 'gemini-2.5-flash-image';

export interface GeminiDebugState {
  keyPresent: boolean;
  modelId: string;
  requestStarted: boolean;
  responseReceived: boolean;
  imageReturned: boolean;
  errorMessage: string | null;
  errorJson: string | null;
}

let _lastDebug: GeminiDebugState | null = null;

export function getGeminiLastDebug(): GeminiDebugState | null {
  return _lastDebug;
}

export function resetGeminiDebug(): void {
  _lastDebug = null;
}

function serializeError(err: unknown): string {
  if (err instanceof Error) {
    const obj: Record<string, unknown> = { name: err.name, message: err.message, stack: err.stack };
    for (const key of Object.keys(err)) obj[key] = (err as unknown as Record<string, unknown>)[key];
    try { return JSON.stringify(obj, null, 2); } catch { return `${err.name}: ${err.message}`; }
  }
  try { return JSON.stringify(err, null, 2); } catch { return String(err); }
}

type GeminiCandidate = {
  finishReason?: string;
  safetyRatings?: unknown;
  content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string }; text?: string }> };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
};

export class GeminiImageProvider implements AIProvider {
  readonly name = 'gemini';
  readonly isTextToImage = false;

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async generate(params: GenerateParams): Promise<string[]> {
    const debug: GeminiDebugState = {
      keyPresent: !!process.env.GEMINI_API_KEY,
      modelId: MODEL_ID,
      requestStarted: false,
      responseReceived: false,
      imageReturned: false,
      errorMessage: null,
      errorJson: null,
    };
    _lastDebug = debug;

    if (!params.imageBase64) {
      const err = new Error('GeminiImageProvider requires imageBase64');
      debug.errorMessage = err.message;
      throw err;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const b64 = params.imageBase64.includes(',')
      ? params.imageBase64.split(',')[1]
      : params.imageBase64;

    const basePrompt = getGeminiPrompt({
      functionMode: params.functionMode,
      styleId: params.style,
      customPrompt: params.prompt || undefined,
    });

    const strengthLevel = params.styleStrength ?? 5;
    const strengthPrefix = strengthLevel <= 3
      ? 'Apply only a very subtle, light style transformation. Preserve the original person\'s face and features as closely as possible. '
      : strengthLevel >= 8
      ? 'Apply a dramatic, bold, full style transformation. Fully reimagine the image in the target artistic style. '
      : '';
    const prompt = strengthPrefix + basePrompt;

    console.log(`[GEMINI] start — model=${MODEL_ID} functionMode=${params.functionMode ?? 'none'} style=${params.style} count=${params.count}`);

    // Generate all images in parallel for speed; each is a separate API call
    const jobs = Array.from({ length: params.count }, (_, i) =>
      this._generateOne(ai, b64, prompt, debug, i, params.count)
    );

    const results = await Promise.all(jobs);
    console.log(`[GEMINI] success — ${results.length} image(s)`);
    return results;
  }

  private async _generateOne(
    ai: GoogleGenAI,
    b64: string,
    prompt: string,
    debug: GeminiDebugState,
    index: number,
    total: number,
  ): Promise<string> {
    console.log(`[GEMINI] generating image ${index + 1}/${total}...`);
    debug.requestStarted = true;

    const timeoutMs = 55_000;
    const generatePromise = ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: b64 } },
            { text: prompt },
          ],
        },
      ],
      config: { responseModalities: ['IMAGE'] },
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GeminiImageProvider: timeout after 55s')), timeoutMs)
    );

    let rawResponse: unknown;
    try {
      rawResponse = await Promise.race([generatePromise, timeoutPromise]);
    } catch (apiErr) {
      const errJson = serializeError(apiErr);
      debug.errorMessage = apiErr instanceof Error ? apiErr.message : String(apiErr);
      debug.errorJson = errJson;
      console.error(`[GEMINI] API call FAILED:\n${errJson}`);
      throw apiErr;
    }

    debug.responseReceived = true;
    const response = rawResponse as GeminiResponse;

    // Safety block at prompt level
    if (response.promptFeedback?.blockReason) {
      const msg = 'safetyBlocked';
      debug.errorMessage = msg;
      debug.errorJson = JSON.stringify({ blockReason: response.promptFeedback.blockReason });
      console.warn('[GEMINI] prompt blocked:', response.promptFeedback.blockReason);
      throw new NonRetriableError(msg);
    }

    const candidate = response.candidates?.[0];

    // Safety block at candidate level
    if (candidate?.finishReason === 'SAFETY') {
      const msg = 'safetyBlocked';
      debug.errorMessage = msg;
      debug.errorJson = JSON.stringify({ finishReason: 'SAFETY', safetyRatings: candidate.safetyRatings });
      console.warn('[GEMINI] candidate blocked by safety filter');
      throw new NonRetriableError(msg);
    }

    const parts = candidate?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      const msg = `GeminiImageProvider: no image in response (parts=${parts.length}, finishReason=${candidate?.finishReason ?? 'unknown'})`;
      debug.errorMessage = msg;
      debug.errorJson = JSON.stringify({ parts: parts.map((p) => ({ hasInlineData: !!p.inlineData, hasText: !!p.text })), finishReason: candidate?.finishReason });
      console.error(`[GEMINI] ${msg}`);
      throw new Error(msg);
    }

    debug.imageReturned = true;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    console.log(`[GEMINI] image ${index + 1} received — ${imageBuffer.length} bytes, mimeType=${mimeType}`);

    const filename = `gemini_${crypto.randomUUID()}.${ext}`;
    try {
      const stored = await getStorageProvider().upload(imageBuffer, filename);
      console.log(`[GEMINI] storage upload OK: ${stored}`);

      if (stored.startsWith('/api/outputs/') && !!process.env.VERCEL) {
        console.log('[GEMINI] Vercel + LocalProvider → converted to data URL');
        return `data:${mimeType};base64,${imagePart.inlineData.data}`;
      }
      return stored;
    } catch (storageErr) {
      const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
      console.error(`[GEMINI] storage FAILED (using data URL): ${msg}`);
      return `data:${mimeType};base64,${imagePart.inlineData.data}`;
    }
  }
}
