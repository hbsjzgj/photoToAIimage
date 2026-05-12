import { AIProvider, GenerateParams } from './types';

const DEMO_FILES = ['demo-1.jpg', 'demo-2.jpg', 'demo-3.jpg', 'demo-4.jpg'];

export class MockProvider implements AIProvider {
  readonly name = 'mock';
  readonly isTextToImage = true;

  isAvailable(): boolean {
    return true;
  }

  async generate(params: GenerateParams): Promise<string[]> {
    const urls: string[] = [];
    for (let i = 0; i < params.count; i++) {
      const idx = (Math.floor(Math.random() * DEMO_FILES.length) + i) % DEMO_FILES.length;
      urls.push(`/demo-results/${DEMO_FILES[idx]}`);
    }
    return urls;
  }
}
