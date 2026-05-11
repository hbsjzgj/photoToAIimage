export interface GenerateParams {
  style: string;
  prompt: string;
  count: 1 | 4;
  outputSize: string;
  imageBase64?: string;
}

export interface ProviderResult {
  urls: string[];
  provider: string;
  fallbackUsed: boolean;
  durationMs: number;
  isTextToImage: boolean;
}

export interface AIProvider {
  readonly name: string;
  readonly isTextToImage: boolean;
  isAvailable(): boolean;
  generate(params: GenerateParams): Promise<string[]>;
}
