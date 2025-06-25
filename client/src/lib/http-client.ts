import { Capacitor, CapacitorHttp as Http } from '@capacitor/core';
import { API_BASE_URL } from '@/config/api';

interface HttpOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  data?: any;
}

export async function httpRequest(options: HttpOptions): Promise<Response> {
  const { url, method, headers = {}, data } = options;
  
  // Se estamos no iOS/Android, usar Http nativo
  if (Capacitor.isNativePlatform()) {
    try {
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
      console.log(`[Native HTTP] ${method} ${fullUrl}`);
      
      const response = await Http.request({
        url: fullUrl,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        data,
      });
      
      console.log(`[Native HTTP] Response status: ${response.status}`);
      
      // Converter resposta do Capacitor para Response padrão
      return new Response(JSON.stringify(response.data), {
        status: response.status,
        headers: response.headers,
      });
    } catch (error) {
      console.error('[Native HTTP] Error:', error);
      throw error;
    }
  }
  
  // Se estamos na web, usar fetch normal
  return fetch(API_BASE_URL + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });
}