import { Cloudinary } from '@cloudinary/url-gen';
import { CLOUDINARY_CONFIG } from './env';

export const cloudinary = new Cloudinary({
  cloud: {
    cloudName: CLOUDINARY_CONFIG.CLOUD_NAME
  }
});

// Export the config object for backward compatibility
export const CLOUDINARY_CONFIG_LEGACY = {
  cloudName: CLOUDINARY_CONFIG.CLOUD_NAME,
  apiKey: CLOUDINARY_CONFIG.API_KEY,
  uploadPreset: CLOUDINARY_CONFIG.UPLOAD_PRESET,
  folder: CLOUDINARY_CONFIG.FOLDER
};

// Export individual values
export const {
  CLOUD_NAME: CLOUDINARY_CLOUD_NAME,
  API_KEY: CLOUDINARY_API_KEY,
  UPLOAD_PRESET: CLOUDINARY_UPLOAD_PRESET,
  FOLDER: CLOUDINARY_FOLDER
} = CLOUDINARY_CONFIG;