import { AIProvider, GenerateParams, ProviderResult } from './types';
import { FalProvider } from './fal';
import { HuggingFaceProvider } from './huggingface';
import { MockProvider } from './mock';

function getProviderChain(): AIProvider[] {
  const forced = process.env.AI_PROVIDER;

  if (forced === 'mock') {
    console.log('[AI] Using MockProvider (AI_PROVIDER=mock)');
    return [new MockProvider()];
  }

  if (forced === 'fal') {
    console.log('[AI] Using FalProvider (AI_PROVIDER=fal)');
    return [new FalProvider(), new MockProvider()];
  }

  if (forced === 'huggingface') {
    console.log('[AI] Using HuggingFace chain (AI_PROVIDER=huggingface)');
    return [new HuggingFaceProvider(), new MockProvider()];
  }

  // Default: prefer Fal if key is set, else HuggingFace if token set, else Mock
  if (process.env.FAL_KEY) {
    console.log('[AI] Using FalProvider → Mock chain (FAL_KEY set)');
    return [new FalProvider(), new MockProvider()];
  }

  if (process.env.HUGGINGFACE_API_TOKEN) {
    console.log('[AI] Using HuggingFace → Mock chain (HUGGINGFACE_API_TOKEN set)');
    return [new HuggingFaceProvider(), new MockProvider()];
  }

  console.log('[AI] Using MockProvider (no FAL_KEY, no HUGGINGFACE_API_TOKEN)');
  return [new MockProvider()];
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
      console.error(`[AI] ${provider.name} failed:`, err instanceof Error ? err.message : err);
      firstProvider = false;
    }
  }

  throw new Error('All AI providers failed');
}
