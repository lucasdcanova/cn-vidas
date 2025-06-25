import { isNativeApp } from '@/utils/platform';

// Determine the API base URL based on the environment
export const getApiBaseUrl = (): string => {
  // For native apps, we need to use the full URL
  if (isNativeApp()) {
    // PRODUÇÃO: URL correta do Render
    return 'https://cnvidas-updated.onrender.com';
    
    // DESENVOLVIMENTO: Use seu IP local
    // return 'http://192.168.15.20:8080'; // IP LOCAL DO MAC
  }
  
  // For web, we can use relative URLs
  return '';
};

export const API_BASE_URL = getApiBaseUrl();