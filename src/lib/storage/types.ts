export interface StorageProvider {
  upload(buffer: Buffer, filename: string): Promise<string>;
}
