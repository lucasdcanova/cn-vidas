import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  address?: {
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
  } | null;
}

export default function AddressModal({
  isOpen,
  onClose,
  onSuccess,
  address,
}: AddressModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    isPrimary: false,
  });

  useEffect(() => {
    if (address) {
      setFormData({
        name: address.name,
        cep: address.cep,
        logradouro: address.logradouro,
        numero: address.numero,
        complemento: address.complemento || '',
        bairro: address.bairro,
        cidade: address.cidade,
        estado: address.estado,
        isPrimary: address.isPrimary,
      });
    } else {
      setFormData({
        name: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        isPrimary: false,
      });
    }
  }, [address]);

  const handleCepSearch = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    
    if (cep.length !== 8) {
      toast({
        title: 'CEP inválido',
        description: 'O CEP deve conter 8 dígitos',
        variant: 'destructive',
      });
      return;
    }

    setSearchingCep(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({
          title: 'CEP não encontrado',
          description: 'Verifique o CEP informado',
          variant: 'destructive',
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível buscar o CEP',
        variant: 'destructive',
      });
    } finally {
      setSearchingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = address
        ? `/api/partners/addresses/${address.id}`
        : '/api/partners/addresses';
      
      const method = address ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar endereço');
      }

      toast({
        title: 'Sucesso',
        description: address
          ? 'Endereço atualizado com sucesso'
          : 'Endereço criado com sucesso',
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar endereço',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {address ? 'Editar Endereço' : 'Adicionar Endereço'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do endereço onde seu serviço será prestado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do endereço *</Label>
            <Input
              id="name"
              placeholder="Ex: Consultório Centro"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={formData.cep}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formatted = value.replace(/(\d{5})(\d)/, '$1-$2');
                  setFormData({ ...formData, cep: formatted });
                }}
                maxLength={9}
                required
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCepSearch}
                disabled={searchingCep}
                className="w-full"
              >
                {searchingCep ? 'Buscando...' : 'Buscar CEP'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3">
              <Label htmlFor="logradouro">Logradouro *</Label>
              <Input
                id="logradouro"
                placeholder="Rua, Avenida, etc"
                value={formData.logradouro}
                onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="numero">Número *</Label>
              <Input
                id="numero"
                placeholder="123"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="complemento">Complemento</Label>
            <Input
              id="complemento"
              placeholder="Apto, Sala, etc"
              value={formData.complemento}
              onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="bairro">Bairro *</Label>
            <Input
              id="bairro"
              placeholder="Centro"
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                placeholder="São Paulo"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado *</Label>
              <Input
                id="estado"
                placeholder="SP"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                maxLength={2}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPrimary"
              checked={formData.isPrimary}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isPrimary: checked as boolean })
              }
            />
            <Label htmlFor="isPrimary" className="font-normal">
              Definir como endereço principal
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : address ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}