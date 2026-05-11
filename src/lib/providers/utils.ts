import { getStorageProvider } from '@/lib/storage';

export async function saveBufferToOutputs(buffer: Buffer, prefix = 'gen'): Promise<string> {
  const filename = `${prefix}_${crypto.randomUUID()}.png`;
  return getStorageProvider().upload(buffer, filename);
}
