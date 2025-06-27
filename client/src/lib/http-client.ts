import { Capacitor, CapacitorHttp as Http } from '@capacitor/core';
import { API_BASE_URL } from '@/config/api';

interface HttpOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  data?: any;
}

interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

async function httpRequestInternal(options: HttpOptions): Promise<Response> {
  const { url, method, headers = {}, data } = options;
  
  // Obter tokens de autenticação
  const authToken = localStorage.getItem('authToken');
  const sessionId = localStorage.getItem('sessionID');
  
  // Verificar se é FormData
  const isFormData = data instanceof FormData;
  console.log(`[httpRequestInternal] Tipo de dados:`, {
    isFormData,
    dataType: data?.constructor?.name,
    hasData: !!data
  });
  
  // Construir headers com autenticação
  const authHeaders: Record<string, string> = {
    ...headers,
  };
  
  // Só adicionar Content-Type se não for FormData
  if (!isFormData && !headers['Content-Type']) {
    authHeaders['Content-Type'] = 'application/json';
  }
  
  // Adicionar tokens de autenticação se disponíveis
  if (authToken) {
    authHeaders['X-Auth-Token'] = authToken;
    authHeaders['Authorization'] = `Bearer ${authToken}`;
  }
  
  if (sessionId) {
    authHeaders['X-Session-ID'] = sessionId;
  }
  
  // Se estamos no iOS/Android, usar Http nativo
  if (Capacitor.isNativePlatform()) {
    try {
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
      console.log(`[Native HTTP] ${method} ${fullUrl}`);
      console.log(`[Native HTTP] Headers:`, {
        ...authHeaders,
        'X-Auth-Token': authHeaders['X-Auth-Token'] ? 'PRESENTE' : 'AUSENTE',
        'Authorization': authHeaders['Authorization'] ? 'PRESENTE' : 'AUSENTE'
      });
      
      // Para FormData no Capacitor, precisamos converter para objeto
      let requestData = data;
      if (isFormData) {
        console.log('[Native HTTP] Convertendo FormData para objeto...');
        // FormData não é suportado diretamente pelo Capacitor HTTP
        // Vamos usar fetch nativo mesmo no iOS
        throw new Error('FormData requires native fetch');
      }
      
      const response = await Http.request({
        url: fullUrl,
        method,
        headers: authHeaders,
        data: requestData,
      });
      
      console.log(`[Native HTTP] Response status: ${response.status}`);
      
      // Verificar se a resposta foi bem-sucedida
      if (response.status >= 400) {
        console.error(`[Native HTTP] Erro HTTP ${response.status}:`, response.data);
      }
      
      // Converter resposta do Capacitor para Response padrão
      return new Response(JSON.stringify(response.data), {
        status: response.status,
        headers: response.headers,
      });
    } catch (error: any) {
      console.error('[Native HTTP] Error completo:', {
        message: error.message,
        code: error.code,
        url: url,
        headers: authHeaders,
        errorType: error.constructor?.name
      });
      
      // Se for erro de FormData, usar fetch nativo
      if (error.message === 'FormData requires native fetch') {
        console.log('[Native HTTP] Fallback para fetch nativo com FormData');
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        
        try {
          console.log('[Native Fetch] Tentando fetch nativo para FormData...');
          console.log('[Native Fetch] URL:', fullUrl);
          console.log('[Native Fetch] Headers:', {
            ...authHeaders,
            'X-Auth-Token': authHeaders['X-Auth-Token'] ? 'PRESENTE' : 'AUSENTE',
            'Authorization': authHeaders['Authorization'] ? 'PRESENTE' : 'AUSENTE'
          });
          
          // Usar fetch nativo para FormData
          const nativeResponse = await fetch(fullUrl, {
            method,
            headers: authHeaders,
            body: data, // FormData deve ser passado diretamente
            credentials: 'include'
          });
          
          console.log('[Native Fetch] Response status:', nativeResponse.status);
          console.log('[Native Fetch] Response ok:', nativeResponse.ok);
          
          return nativeResponse;
        } catch (fetchError: any) {
          console.error('[Native Fetch] Erro no fetch nativo:', fetchError);
          throw fetchError;
        }
      } else {
        // Criar uma resposta de erro mais detalhada
        const errorResponse = new Response(JSON.stringify({
          error: error.message || 'Network request failed',
          code: error.code,
          url: fullUrl
        }), {
          status: error.status || 500,
          statusText: error.message || 'Internal Server Error'
        });
        
        return errorResponse;
      }
    }
  }
  
  // Se estamos na web ou precisamos fazer fallback, usar fetch normal
  console.log('[Web Fetch] Usando fetch normal para:', url);
  console.log('[Web Fetch] Headers:', {
    ...authHeaders,
    'X-Auth-Token': authHeaders['X-Auth-Token'] ? 'PRESENTE' : 'AUSENTE',
    'Authorization': authHeaders['Authorization'] ? 'PRESENTE' : 'AUSENTE'
  });
  console.log('[Web Fetch] É FormData?', isFormData);
  
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  return fetch(fullUrl, {
    method,
    headers: authHeaders,
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: 'include',
  });
}

// Exportar função principal
export async function httpRequest(options: HttpOptions): Promise<Response>;
export async function httpRequest<T = any>(url: string, options?: HttpRequestOptions): Promise<T>;
export async function httpRequest<T = any>(urlOrOptions: string | HttpOptions, maybeOptions?: HttpRequestOptions): Promise<T | Response> {
  // Se o primeiro argumento é uma string, é a versão antiga
  if (typeof urlOrOptions === 'string') {
    const url = urlOrOptions;
    const options = maybeOptions || { method: 'GET' };
    
    const httpOptions: HttpOptions = {
      url,
      method: options.method,
      headers: options.headers,
      data: options.body
    };
    
    const response = await httpRequestInternal(httpOptions);
    
    // Para a versão antiga, retornar o JSON parseado
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    
    return response.json();
  }
  
  // Se o primeiro argumento é um objeto, chamar a função principal
  return httpRequestInternal(urlOrOptions as HttpOptions);
}