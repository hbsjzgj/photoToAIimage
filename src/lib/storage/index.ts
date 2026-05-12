import { StorageProvider } from './types';
import { LocalProvider } from './local';
import { CloudinaryProvider } from './cloudinary';

const PLACEHOLDER_VALUES = new Set([
  '',
  'your-cloud-name',
  'your-api-key',
  'your-api-secret',
  'your_cloud_name',
  'your_api_key',
  'your_api_secret',
]);

function isConfigured(value: string | undefined): boolean {
  return !!value && !PLACEHOLDER_VALUES.has(value.trim());
}

let _provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!_provider) {
    const useCloudinary =
      isConfigured(process.env.CLOUDINARY_CLOUD_NAME) &&
      isConfigured(process.env.CLOUDINARY_API_KEY) &&
      isConfigured(process.env.CLOUDINARY_API_SECRET);
    _provider = useCloudinary ? new CloudinaryProvider() : new LocalProvider();
    console.log(`[storage] Using ${useCloudinary ? 'Cloudinary' : 'Local'} provider`);
  }
  return _provider;
}
