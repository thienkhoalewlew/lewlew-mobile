import Constants from 'expo-constants';

// Helper function to get environment variable
const getEnvVar = (name: string): string => {
  const value = Constants.expoConfig?.extra?.[name] || process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not defined`);
  }
  return value;
};

// Mapbox Configuration
export const MAPBOX_CONFIG = {
  ACCESS_TOKEN: getEnvVar('EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN'),
  DOWNLOAD_TOKEN: getEnvVar('EXPO_PUBLIC_MAPBOX_DOWNLOAD_TOKEN'),
} as const;

// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: getEnvVar('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME'),
  API_KEY: getEnvVar('EXPO_PUBLIC_CLOUDINARY_API_KEY'),
  UPLOAD_PRESET: getEnvVar('EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET'),
  FOLDER: getEnvVar('EXPO_PUBLIC_CLOUDINARY_FOLDER'),
} as const;

// Export individual values for convenience
export const {
  ACCESS_TOKEN: MAPBOX_ACCESS_TOKEN,
  DOWNLOAD_TOKEN: MAPBOX_DOWNLOAD_TOKEN
} = MAPBOX_CONFIG;

export const {
  CLOUD_NAME: CLOUDINARY_CLOUD_NAME,
  API_KEY: CLOUDINARY_API_KEY,
  UPLOAD_PRESET: CLOUDINARY_UPLOAD_PRESET,
  FOLDER: CLOUDINARY_FOLDER
} = CLOUDINARY_CONFIG;