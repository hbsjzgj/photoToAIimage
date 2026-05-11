import { v2 as cloudinary } from 'cloudinary';
import { StorageProvider } from './types';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export class CloudinaryProvider implements StorageProvider {
  async upload(buffer: Buffer, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const publicId = filename.replace(/\.[^.]+$/, '');
      const stream = cloudinary.uploader.upload_stream(
        { public_id: `forma/outputs/${publicId}`, resource_type: 'image', format: 'png' },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error('Cloudinary upload failed'));
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });
  }
}
