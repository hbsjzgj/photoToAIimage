import { AIProvider, GenerateParams } from './types';
import { saveBufferToOutputs } from './utils';
import { getPromptForStyle } from '@/lib/prompts';

const HF_MODEL = 'timbrooks/instruct-pix2pix';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 20_000;

export class HuggingFaceProvider implements AIProvider {
  readonly name = 'huggingface';
  readonly isTextToImage = false;

  isAvailable(): boolean {
    return !!process.env.HUGGINGFACE_API_TOKEN;
  }

  async generate(params: GenerateParams): Promise<string[]> {
    if (!params.imageBase64) {
      throw new Error('HuggingFace instruct-pix2pix requires imageBase64');
    }

    const token = process.env.HUGGINGFACE_API_TOKEN!;
    const { prompt: autoPrompt } = getPromptForStyle(params.style);
    const instruction = params.prompt || autoPrompt;

    // Strip data URI prefix: "data:image/jpeg;base64,<data>" → "<data>"
    const base64Data = params.imageBase64.includes(',')
      ? params.imageBase64.split(',')[1]
      : params.imageBase64;

    const urls: string[] = [];
    for (let i = 0; i < params.count; i++) {
      const url = await this.generateOne(token, base64Data, instruction);
      urls.push(url);
    }
    return urls;
  }

  private async generateOne(token: string, base64Data: string, prompt: string): Promise<string> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const res = await fetch(
        `https://api-inference.huggingface.co/models/${HF_MODEL}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: base64Data,
            parameters: { prompt }
          })
        }
      );

      if (res.status === 503) {
        const json = (await res.json().catch(() => ({}))) as { estimated_time?: number };
        const wait = (json.estimated_time ?? RETRY_DELAY_MS / 1000) * 1000;
        console.log(`[HuggingFace] Model loading, retry ${attempt + 1}/${MAX_RETRIES} in ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`HuggingFace API error ${res.status}: ${text}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      return saveBufferToOutputs(buffer, 'hf');
    }

    throw new Error(`HuggingFace: model still loading after ${MAX_RETRIES} retries`);
  }
}
