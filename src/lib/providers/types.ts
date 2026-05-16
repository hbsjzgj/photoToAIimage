export interface GenerateParams {
  style: string;
  prompt: string;
  count: 1 | 4;
  outputSize: string;
  imageBase64?: string;
  mode?: 'free' | 'paid';
  functionMode?: string;
  styleStrength?: number; // 1–10, default 5 = current behavior
}

/** Thrown by providers for errors that must not be retried with the next provider. */
export class NonRetriableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetriableError';
  }
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
