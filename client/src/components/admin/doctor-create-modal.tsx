import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, Phone, User, Shield, Stethoscope, DollarSign, Key } from "lucide-react";

interface DoctorCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DoctorCreateModal: React.FC<DoctorCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    // User data
    fullName: "",
    email: "",
    password: "",
    phone: "",
    cpf: "",
    
    // Doctor data
    specialization: "",
    licenseNumber: "",
    education: "",
    biography: "",
    consultationFee: 150,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          role: "doctor",
          emailVerified: true, // Auto-verify admin-created doctors
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create doctor");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Médico criado",
        description: "O novo médico foi cadastrado com sucesso.",
      });
      onSuccess();
      handleReset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar médico",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, email e senha são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    // Create the doctor
    createUserMutation.mutate({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      cpf: formData.cpf,
      specialty: formData.specialization,
      licenseNumber: formData.licenseNumber,
      education: formData.education,
      biography: formData.biography,
      consultationPrice: formData.consultationFee,
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReset = () => {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      phone: "",
      cpf: "",
      specialization: "",
      licenseNumber: "",
      education: "",
      biography: "",
      consultationFee: 150,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Médico</DialogTitle>
            <DialogDescription>
              Preencha as informações para cadastrar um novo médico no sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Dados básicos do usuário médico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Nome Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder="Dr. João Silva"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="joao.silva@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Senha <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="(11) 98765-4321"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => handleInputChange("cpf", e.target.value)}
                        placeholder="123.456.789-00"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Informações Profissionais
                </CardTitle>
                <CardDescription>
                  Dados profissionais e especialização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Especialização</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange("specialization", e.target.value)}
                      placeholder="Ex: Cardiologia"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">Número do CRM</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                      placeholder="Ex: CRM/SP 123456"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education">Formação</Label>
                    <Input
                      id="education"
                      value={formData.education}
                      onChange={(e) => handleInputChange("education", e.target.value)}
                      placeholder="Ex: USP - Medicina"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="consultationFee">Valor da Consulta (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="consultationFee"
                        type="number"
                        value={formData.consultationFee}
                        onChange={(e) => handleInputChange("consultationFee", parseFloat(e.target.value) || 0)}
                        placeholder="150.00"
                        className="pl-10"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biography">Biografia</Label>
                  <Textarea
                    id="biography"
                    value={formData.biography}
                    onChange={(e) => handleInputChange("biography", e.target.value)}
                    placeholder="Breve descrição profissional do médico..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? (
                <>Criando...</>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Médico
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorCreateModal;