import { AIProvider, GenerateParams, ProviderResult, NonRetriableError } from './types';
import { FalProvider } from './fal';
import { HuggingFaceProvider } from './huggingface';
import { MockProvider } from './mock';
import { GeminiImageProvider } from './gemini-image';

function getProviderChain(): AIProvider[] {
  const forced = process.env.AI_PROVIDER;

  if (forced === 'mock') {
    console.log('[AI] Using MockProvider (AI_PROVIDER=mock)');
    return [new MockProvider()];
  }

  if (forced === 'gemini') {
    console.log('[AI] Using GeminiImageProvider (AI_PROVIDER=gemini)');
    return [new GeminiImageProvider(), new FalProvider(), new MockProvider()];
  }

  if (forced === 'fal') {
    console.log('[AI] Using FalProvider (AI_PROVIDER=fal)');
    return [new FalProvider(), new MockProvider()];
  }

  if (forced === 'huggingface') {
    console.log('[AI] Using HuggingFace chain (AI_PROVIDER=huggingface)');
    return [new HuggingFaceProvider(), new MockProvider()];
  }

  // Default: prefer Gemini if key set, then Fal, then HuggingFace, then Mock
  if (process.env.GEMINI_API_KEY) {
    console.log('[AI] Using GeminiImageProvider → Fal → Mock chain (GEMINI_API_KEY set)');
    return [new GeminiImageProvider(), new FalProvider(), new MockProvider()];
  }

  if (process.env.FAL_KEY) {
    console.log('[AI] Using FalProvider → Mock chain (FAL_KEY set)');
    return [new FalProvider(), new MockProvider()];
  }

  if (process.env.HUGGINGFACE_API_TOKEN) {
    console.log('[AI] Using HuggingFace → Mock chain (HUGGINGFACE_API_TOKEN set)');
    return [new HuggingFaceProvider(), new MockProvider()];
  }

  console.log('[AI] Using MockProvider (no keys set)');
  return [new MockProvider()];
}

function serializeError(err: unknown): string {
  if (err instanceof Error) {
    const obj: Record<string, unknown> = { name: err.name, message: err.message, stack: err.stack };
    for (const key of Object.keys(err)) obj[key] = (err as unknown as Record<string, unknown>)[key];
    try { return JSON.stringify(obj, null, 2); } catch { return `${err.name}: ${err.message}`; }
  }
  try { return JSON.stringify(err, null, 2); } catch { return String(err); }
}

export async function generateWithFallback(params: GenerateParams): Promise<ProviderResult> {
  const chain = getProviderChain();
  const start = Date.now();
  let firstProvider = true;

  for (const provider of chain) {
    if (!provider.isAvailable()) {
      console.log(`[AI] ${provider.name}: not available, skipping`);
      continue;
    }
    try {
      console.log(`[AI] trying ${provider.name}...`);
      const urls = await provider.generate(params);
      const durationMs = Date.now() - start;
      console.log(`[AI] ${provider.name} succeeded in ${durationMs}ms, urls: ${urls.join(', ')}`);
      return { urls, provider: provider.name, fallbackUsed: !firstProvider, durationMs, isTextToImage: provider.isTextToImage };
    } catch (err) {
      // Non-retriable errors (e.g. safety blocks) must not fall through to the next provider
      if (err instanceof NonRetriableError) throw err;
      // Log the full error before falling back — message alone hides SDK response bodies
      const errJson = serializeError(err);
      console.error(`[AI] ${provider.name} FAILED — fallback reason:\n${errJson}`);
      if (provider.name === 'gemini') console.log('[AI] Gemini failed, falling back to FalProvider');
      firstProvider = false;
    }
  }

  throw new Error('All AI providers failed');
}
