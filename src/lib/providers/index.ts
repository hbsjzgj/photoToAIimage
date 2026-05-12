import { AIProvider, GenerateParams, ProviderResult } from './types';
import { HuggingFaceProvider } from './huggingface';
import { MockProvider } from './mock';

function getProviderChain(): AIProvider[] {
  const forced = process.env.AI_PROVIDER;
  if (forced === 'mock') return [new MockProvider()];
  if (forced === 'huggingface') return [new HuggingFaceProvider(), new MockProvider()];
  // Default: only try HuggingFace when token is actually set — otherwise go straight to mock
  if (process.env.HUGGINGFACE_API_TOKEN) return [new HuggingFaceProvider(), new MockProvider()];
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
      console.log(`[AI] ${provider.name} succeeded in ${durationMs}ms`);
      return { urls, provider: provider.name, fallbackUsed: !firstProvider, durationMs, isTextToImage: provider.isTextToImage };
    } catch (err) {
      console.error(`[AI] ${provider.name} failed:`, err instanceof Error ? err.message : err);
      firstProvider = false;
    }
  }

  throw new Error('All AI providers failed');
}
