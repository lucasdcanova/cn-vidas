import { isNativeApp } from '@/utils/platform';

// Determine the API base URL based on the environment
export const getApiBaseUrl = (): string => {
  // For native apps, we need to use the full URL
  if (isNativeApp()) {
    // Always use relative URLs since Capacitor will handle the routing
    return '';
  }
  
  // For web, we can use relative URLs
  return '';
};

export const API_BASE_URL = getApiBaseUrl();