import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Plus, MapPin, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import AddressModal from './AddressModal';
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { PartnerOnboardingGuard } from '@/components/partner/partner-onboarding-guard';

interface Address {
  id: number;
  name: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  isPrimary: boolean;
  isProfileAddress?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PartnerAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profileAddress, setProfileAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses();
    fetchPartnerProfile();
  }, []);

  const fetchPartnerProfile = async () => {
    try {
      const response = await fetch('/api/partners/me', {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Erro na resposta:', response.status);
        return;
      }

      const partner = await response.json();
      console.log('Partner profile data:', partner);
      console.log('Address fields:', {
        street: partner.street,
        address: partner.address,
        number: partner.number,
        neighborhood: partner.neighborhood,
        city: partner.city,
        state: partner.state,
        zipcode: partner.zipcode,
        postalCode: partner.postalCode
      });
      
      // Criar endereço principal a partir dos dados do perfil
      // Verificar se existe algum campo de endereço preenchido
      const hasAddress = partner && (
        partner.street || 
        partner.address || 
        partner.zipcode || 
        partner.postalCode ||
        partner.city ||
        partner.state
      );
      
      if (hasAddress) {
        const profileAddr: Address = {
          id: -1, // ID especial para o endereço do perfil
          name: 'Endereço do Perfil',
          cep: partner.zipcode || partner.postalCode || '',
          logradouro: partner.street || partner.address || '',
          numero: partner.number || '',
          complemento: partner.complement || '',
          bairro: partner.neighborhood || '',
          cidade: partner.city || '',
          estado: partner.state || '',
          isPrimary: true,
          isProfileAddress: true,
          createdAt: partner.createdAt || new Date().toISOString(),
          updatedAt: partner.updatedAt || new Date().toISOString(),
        };
        console.log('Profile address created:', profileAddr);
        setProfileAddress(profileAddr);
      } else {
        console.log('No address data found in partner profile');
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do parceiro - detalhes:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/partners/addresses', {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Erro na resposta de endereços:', response.status);
        // Ainda assim vamos tentar processar a resposta
      }

      // Tentar processar a resposta com tratamento de erro específico para iOS
      let data;
      try {
        const text = await response.text();
        console.log('Resposta raw:', text);
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Erro ao fazer parse JSON:', parseError);
        data = [];
      }
      
      console.log('Endereços processados:', data);
      
      if (Array.isArray(data)) {
        setAddresses(data);
      } else {
        console.error('Resposta não é um array:', data);
        setAddresses([]);
      }
    } catch (error) {
      console.error('Erro ao buscar endereços - detalhes:', error);
      // Não mostrar toast se for erro de parsing ou similar
      if (error instanceof Error && error.message.includes('JSON')) {
        console.error('Erro ao processar resposta JSON');
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os endereços',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) {
      return;
    }

    try {
      const response = await fetch(`/api/partners/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir endereço');
      }

      toast({
        title: 'Sucesso',
        description: 'Endereço excluído com sucesso',
      });

      fetchAddresses();
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o endereço',
        variant: 'destructive',
      });
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      const response = await fetch(`/api/partners/addresses/${id}/set-primary`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao definir endereço principal');
      }

      toast({
        title: 'Sucesso',
        description: 'Endereço principal atualizado',
      });

      fetchAddresses();
    } catch (error) {
      console.error('Erro ao definir endereço principal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o endereço principal',
        variant: 'destructive',
      });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchAddresses();
    // Também atualizar o endereço do perfil se necessário
    if (editingAddress?.isProfileAddress) {
      fetchPartnerProfile();
    }
  };

  if (loading) {
    return (
      <PartnerOnboardingGuard>
        <DashboardLayout title="Meus Endereços">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando endereços...</p>
            </div>
          </div>
        </DashboardLayout>
      </PartnerOnboardingGuard>
    );
  }

  return (
    <PartnerOnboardingGuard>
      <DashboardLayout title="Meus Endereços">
        <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Endereços</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os endereços dos seus serviços
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Endereço
        </Button>
      </div>

      {addresses.length === 0 && !profileAddress ? (
        <Card className="p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum endereço cadastrado
          </h3>
          <p className="text-gray-600 mb-6">
            Adicione endereços para seus serviços
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Endereço
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Mostrar endereço do perfil primeiro se existir */}
          {profileAddress && (
            <Card key="profile-address" className="p-6 border-primary/20 bg-primary/5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{profileAddress.name}</h3>
                  <Badge variant="default" className="mt-1">
                    Principal
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        // Redirecionar para página de perfil para editar
                        window.location.href = '/profile#address';
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar no Perfil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  {profileAddress.logradouro}, {profileAddress.numero}
                  {profileAddress.complemento && ` - ${profileAddress.complemento}`}
                </p>
                <p>
                  {profileAddress.bairro} - {profileAddress.cidade}/{profileAddress.estado}
                </p>
                <p>CEP: {profileAddress.cep}</p>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-500 italic">
                  Este é o endereço cadastrado no seu perfil
                </p>
              </div>
            </Card>
          )}
          
          {/* Mostrar outros endereços */}
          {addresses.map((address) => (
            <Card key={address.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{address.name}</h3>
                  {address.isPrimary && (
                    <Badge variant="secondary" className="mt-1">
                      Principal
                    </Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingAddress(address);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {!address.isPrimary && (
                      <DropdownMenuItem
                        onClick={() => handleSetPrimary(address.id)}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Definir como principal
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  {address.logradouro}, {address.numero}
                  {address.complemento && ` - ${address.complemento}`}
                </p>
                <p>
                  {address.bairro} - {address.cidade}/{address.estado}
                </p>
                <p>CEP: {address.cep}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddressModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        address={editingAddress}
      />
    </div>
      </DashboardLayout>
    </PartnerOnboardingGuard>
  );
}