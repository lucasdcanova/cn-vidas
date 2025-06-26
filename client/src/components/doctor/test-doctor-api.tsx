import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { httpRequest } from '@/lib/http-client';
import { isNativeApp } from '@/utils/platform';
import { getApiBaseUrl } from '@/config/api';

export default function TestDoctorAPI() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const addResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };
  
  const testDoctorProfile = async () => {
    console.log('🧪 Testando /api/doctors/profile com httpRequest...');
    
    try {
      // Primeiro, vamos verificar os tokens
      const authToken = localStorage.getItem('authToken');
      const sessionId = localStorage.getItem('sessionID');
      
      console.log('🔑 Tokens disponíveis:', {
        authToken: authToken ? `${authToken.substring(0, 10)}...` : 'NENHUM',
        sessionId: sessionId ? `${sessionId.substring(0, 10)}...` : 'NENHUM',
        platform: isNativeApp() ? 'iOS' : 'Web'
      });
      
      const response = await httpRequest({
        url: '/api/doctors/profile',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Request-Source': 'iOS-Test',
          'X-Platform': isNativeApp() ? 'iOS' : 'Web'
        }
      });
      
      const data = await response.json();
      console.log('✅ Resposta recebida:', data);
      addResult('/api/doctors/profile (httpRequest)', { 
        status: 'success', 
        data,
        tokens: {
          authToken: authToken ? 'Presente' : 'Ausente',
          sessionId: sessionId ? 'Presente' : 'Ausente'
        }
      });
    } catch (error: any) {
      console.error('❌ Erro detalhado:', error);
      addResult('/api/doctors/profile (httpRequest)', { 
        status: 'error', 
        error: {
          message: error.message,
          code: error.code,
          status: error.status,
          statusText: error.statusText,
          details: JSON.stringify(error),
          tokens: {
            authToken: localStorage.getItem('authToken') ? 'Presente' : 'Ausente',
            sessionId: localStorage.getItem('sessionID') ? 'Presente' : 'Ausente'
          }
        }
      });
    }
  };
  
  const testWithFetch = async () => {
    console.log('🧪 Testando com fetch direto...');
    
    try {
      const token = localStorage.getItem('authToken');
      const sessionId = localStorage.getItem('sessionID');
      const apiUrl = getApiBaseUrl();
      
      console.log('🌐 URL da API:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/doctors/profile`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Auth-Token': token || '',
          'X-Session-ID': sessionId || '',
          'X-Request-Source': 'iOS-Fetch-Test',
          'X-Platform': isNativeApp() ? 'iOS' : 'Web'
        },
        credentials: 'include'
      });
      
      const textResponse = await response.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch {
        data = textResponse;
      }
      
      console.log('✅ Fetch direto - resposta:', data);
      addResult('Fetch direto', { 
        status: response.ok ? 'success' : 'error', 
        data, 
        statusCode: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        tokens: {
          authToken: token ? 'Presente' : 'Ausente',
          sessionId: sessionId ? 'Presente' : 'Ausente'
        }
      });
    } catch (error: any) {
      console.error('❌ Erro no fetch:', error);
      addResult('Fetch direto', { 
        status: 'error', 
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack
      });
    }
  };
  
  const testUserEndpoint = async () => {
    console.log('🧪 Testando /api/user para comparação...');
    
    try {
      const response = await httpRequest({
        url: '/api/user',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Request-Source': 'iOS-Test-User'
        }
      });
      
      const data = await response.json();
      console.log('✅ /api/user resposta:', data);
      addResult('/api/user (comparação)', { 
        status: 'success', 
        data: {
          id: data.id,
          email: data.email,
          role: data.role,
          fullName: data.fullName
        }
      });
    } catch (error: any) {
      console.error('❌ Erro em /api/user:', error);
      addResult('/api/user (comparação)', { 
        status: 'error', 
        error: {
          message: error.message,
          code: error.code
        }
      });
    }
  };
  
  useEffect(() => {
    if (user?.role === 'doctor') {
      // Executar testes automaticamente
      testUserEndpoint();
      setTimeout(() => testDoctorProfile(), 1000);
      setTimeout(() => testWithFetch(), 3000);
    }
  }, [user]);
  
  if (user?.role !== 'doctor') {
    return null;
  }
  
  return (
    <Card className="m-4 bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="text-yellow-800">🧪 Teste de API - Médico (Diagnóstico iOS)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-yellow-100 rounded text-xs">
          <p className="font-semibold">Informações do ambiente:</p>
          <p>Plataforma: {isNativeApp() ? '📱 iOS' : '💻 Web'}</p>
          <p>Usuário: {user.email}</p>
          <p>ID: {user.id}</p>
          <p>API URL: {getApiBaseUrl()}</p>
        </div>
        
        <div className="space-y-2">
          <Button onClick={testUserEndpoint} size="sm" variant="secondary">
            Testar /api/user
          </Button>
          <Button onClick={testDoctorProfile} size="sm">
            Testar /api/doctors/profile
          </Button>
          <Button onClick={testWithFetch} size="sm" variant="outline">
            Testar com Fetch
          </Button>
        </div>
        
        <div className="mt-4 space-y-2">
          <h4 className="font-semibold">Resultados:</h4>
          {testResults.map((result, idx) => (
            <div key={idx} className="p-2 border rounded text-xs bg-white">
              <div className="font-semibold mb-1">{result.test}</div>
              <div className="text-xs text-gray-500 mb-1">{result.timestamp}</div>
              <pre className="overflow-auto whitespace-pre-wrap">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}