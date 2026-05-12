import { AIProvider, GenerateParams } from './types';

export class MockProvider implements AIProvider {
  readonly name = 'mock';
  readonly isTextToImage = true;

  isAvailable(): boolean {
    return true;
  }

  async generate(params: GenerateParams): Promise<string[]> {
    const seed = Math.floor(Math.random() * 1000);
    const urls: string[] = [];

    for (let i = 0; i < params.count; i++) {
      urls.push(`https://picsum.photos/seed/${seed + i}/512/512`);
    }

    return urls;
  }
}
