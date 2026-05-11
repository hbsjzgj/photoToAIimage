import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { StorageProvider } from './types';

export class LocalProvider implements StorageProvider {
  async upload(buffer: Buffer, filename: string): Promise<string> {
    const isVercel = !!process.env.VERCEL;
    const dir = isVercel
      ? path.join('/tmp', 'outputs')
      : path.join(process.cwd(), 'public', 'outputs');

    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);

    return isVercel ? `/api/outputs/${filename}` : `/outputs/${filename}`;
  }
}
