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
  createdAt: string;
  updatedAt: string;
}

export default function PartnerAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/partners/addresses', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar endereços');
      }

      const data = await response.json();
      setAddresses(data);
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os endereços',
        variant: 'destructive',
      });
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

      {addresses.length === 0 ? (
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