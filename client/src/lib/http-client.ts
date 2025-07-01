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
      
      // Para FormData no Capacitor, converter para base64
      let requestData = data;
      
      if (isFormData) {
        console.log('[Native HTTP] FormData detectado, convertendo para base64...');
        
        // Extrair o blob do FormData
        const entries = Array.from(data.entries());
        console.log('[Native HTTP] FormData entries:', entries.map(([k, v]) => `${k}: ${v instanceof Blob ? 'Blob' : typeof v}`));
        
        // Procurar por qualquer blob (profileImage ou audio)
        const blobEntry = entries.find(([key, value]) => value instanceof Blob);
        
        if (blobEntry && blobEntry[1] instanceof Blob) {
          const [fieldName, blob] = blobEntry;
          console.log('[Native HTTP] Blob encontrado:', { 
            fieldName, 
            size: blob.size, 
            type: blob.type 
          });
          
          // Converter blob para base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const base64 = reader.result as string;
              // Remover o prefixo data:image/jpeg;base64,
              const base64Data = base64.split(',')[1] || base64;
              console.log('[Native HTTP] Base64 result length:', base64Data.length);
              resolve(base64Data);
            };
            reader.onerror = (error) => {
              console.error('[Native HTTP] FileReader error:', error);
              reject(error);
            };
          });
          reader.readAsDataURL(blob);
          
          try {
            const base64Data = await base64Promise;
            console.log('[Native HTTP] Base64 criado com sucesso, primeiros 50 chars:', base64Data.substring(0, 50));
            
            // Criar objeto com todos os campos do FormData
            requestData = {};
            entries.forEach(([key, value]) => {
              if (value instanceof Blob) {
                // Para o blob, enviar o base64
                requestData[key] = base64Data;
                requestData[`${key}MimeType`] = blob.type || 'application/octet-stream';
              } else {
                // Para outros valores, enviar como string
                requestData[key] = value.toString();
              }
            });
            
            // Atualizar headers para JSON
            authHeaders['Content-Type'] = 'application/json';
            console.log('[Native HTTP] Request data preparado para envio:', Object.keys(requestData));
            
          } catch (error) {
            console.error('[Native HTTP] Erro ao converter para base64:', error);
            throw error;
          }
        } else {
          console.log('[Native HTTP] Nenhum blob encontrado no FormData');
          // Converter FormData para objeto simples
          requestData = {};
          entries.forEach(([key, value]) => {
            requestData[key] = value.toString();
          });
        }
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
        errorType: error.constructor?.name
      });
      
      // Criar uma resposta de erro mais detalhada
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
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