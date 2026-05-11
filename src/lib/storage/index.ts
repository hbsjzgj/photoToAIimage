import { StorageProvider } from './types';
import { LocalProvider } from './local';
import { CloudinaryProvider } from './cloudinary';

let _provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!_provider) {
    const useCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;
    _provider = useCloudinary ? new CloudinaryProvider() : new LocalProvider();
  }
  return _provider;
}
