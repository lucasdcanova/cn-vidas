import { isNativeApp } from '@/utils/platform';

// Determine the API base URL based on the environment
export const getApiBaseUrl = (): string => {
  // For native apps, we need to use the full URL
  if (isNativeApp()) {
    // In production, this should be your production server URL
    // For development, you can use your local IP address (e.g., http://192.168.1.100:8080)
    // or use ngrok to expose your local server
    return 'https://cnvidas.onrender.com'; // Production URL
    // return 'http://192.168.1.100:8080'; // Development - replace with your local IP
  }
  
  // For web, we can use relative URLs
  return '';
};

export const API_BASE_URL = getApiBaseUrl();