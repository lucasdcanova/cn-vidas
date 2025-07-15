import React from 'react';
import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { AddressForm, AddressFormValues } from '@/components/forms/address-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Loader2, Home, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import MainLayout from '@/components/layouts/main-layout';
import { User } from '@/shared/types';

export default function AddressPage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultValues, setDefaultValues] = useState<Partial<AddressFormValues>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carregar os dados de endereço do usuário quando a página carregar
  useEffect(() => {
    console.log('Usuário carregado:', user);
    if (user) {
      const values = {
        zipcode: user.zipcode || '',
        street: user.address || '',
        number: '',
        complement: '',
        neighborhood: '',
        city: user.city || '',
        state: user.state || '',
      };
      console.log('Valores padrão do endereço:', values);
      setDefaultValues(values);
    }
  }, [user]);

  const handleAddressSubmit = async (data: AddressFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    console.log('Enviando dados de endereço:', data);
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          address: data.street, // Mapear street para address
        }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar endereço');
      }
      
      toast({
        title: 'Endereço atualizado',
        description: 'Seu endereço foi atualizado com sucesso.',
        variant: 'default',
      });
      
      // Atualizar os dados do usuário
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
      toast({
        title: 'Erro ao atualizar endereço',
        description: 'Ocorreu um erro ao atualizar seu endereço. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Helmet>
        <title>Gerenciar Endereço | CN Vidas</title>
        <meta name="description" content="Atualize seu endereço e informações de contato na plataforma CN Vidas" />
      </Helmet>
      
      <div className="container max-w-4xl py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Gerenciar Endereço</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Atualize seu endereço e informações de contato</p>
          </div>
          <Link href="/profile">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Perfil
            </Button>
          </Link>
        </div>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Seu Endereço
            </CardTitle>
            <CardDescription>
              Preencha seu endereço completo para facilitar o envio de documentos e recebimento de serviços
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Debug info for iOS */}
            <div className="mb-4 p-4 bg-gray-100 rounded text-sm" style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px' }}>
              <p style={{ margin: '4px 0' }}>Debug: User loaded: {user ? 'Yes' : 'No'}</p>
              <p style={{ margin: '4px 0' }}>Debug: User email: {user?.email || 'N/A'}</p>
              <p style={{ margin: '4px 0' }}>Debug: Default values loaded: {Object.keys(defaultValues).length > 0 ? 'Yes' : 'No'}</p>
              <p style={{ margin: '4px 0' }}>Debug: Zipcode: {defaultValues.zipcode || 'empty'}</p>
              <p style={{ margin: '4px 0' }}>Debug: Street: {defaultValues.street || 'empty'}</p>
              <p style={{ margin: '4px 0' }}>Debug: City: {defaultValues.city || 'empty'}</p>
              <p style={{ margin: '4px 0' }}>Debug: State: {defaultValues.state || 'empty'}</p>
            </div>
            
            {/* Teste simples de input para iOS */}
            <div className="mb-4 p-4 border border-gray-300 rounded">
              <h4 className="font-bold mb-2">Teste de Input Simples:</h4>
              <input 
                type="text" 
                placeholder="Digite algo aqui" 
                className="w-full p-2 border border-gray-400 rounded"
                style={{ 
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  border: '1px solid #ccc'
                }}
              />
            </div>
            
            <AddressForm 
              defaultValues={defaultValues}
              onSubmit={handleAddressSubmit}
              isSubmitting={isSubmitting}
              showSubmitButton={false}
              standAlone={true}
            />
            
            <div className="mt-6 flex justify-end">
              <Button 
                type="submit"
                form="address-form"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Endereço
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}