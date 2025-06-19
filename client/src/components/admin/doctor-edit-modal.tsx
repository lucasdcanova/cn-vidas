import React, { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import ProfileImageUploader from "@/components/shared/ProfileImageUploader";
import DoctorAvailabilityManager from "@/components/admin/doctor-availability-manager";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Stethoscope,
  DollarSign,
  Clock,
  Activity,
  FileText,
  Languages,
  Award,
  Briefcase,
  Save,
  X
} from "lucide-react";
import type { Doctor, User as UserType } from "@/shared/types";

interface DoctorWithUser extends Doctor {
  user?: UserType;
  email?: string;
  phone?: string;
  fullName?: string;
  profileImage?: string;
}

interface DoctorEditModalProps {
  doctor: DoctorWithUser;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DoctorEditModal: React.FC<DoctorEditModalProps> = ({
  doctor,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [profileImage, setProfileImage] = useState(doctor.profileImage || "");
  
  // Form states
  const [formData, setFormData] = useState({
    // Personal info
    fullName: doctor.fullName || "",
    email: doctor.email || "",
    phone: doctor.phone || "",
    cpf: doctor.user?.cpf || "",
    birthDate: doctor.user?.birthDate || "",
    
    // Professional info
    specialization: doctor.specialization || "",
    licenseNumber: doctor.licenseNumber || "",
    education: doctor.education || "",
    experienceYears: doctor.experienceYears || 0,
    fullBio: doctor.fullBio || doctor.biography || "",
    
    // Areas and languages
    areasOfExpertise: doctor.areasOfExpertise || [],
    languagesSpoken: doctor.languagesSpoken || [],
    achievements: doctor.achievements || "",
    
    // Financial
    consultationFee: doctor.consultationFee || 0,
    consultationPriceDescription: doctor.consultationPriceDescription || "",
    pixKeyType: doctor.pixKeyType || "",
    pixKey: doctor.pixKey || "",
    bankName: doctor.bankName || "",
    accountType: doctor.accountType || "",
    
    // Status
    availableForEmergency: doctor.availableForEmergency || false,
    onboardingCompleted: doctor.onboardingCompleted || false,
    welcomeCompleted: doctor.welcomeCompleted || false,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/users/${doctor.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }
      return response.json();
    },
  });

  // Update doctor profile mutation
  const updateDoctorMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/doctors/${doctor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update doctor profile");
      }
      return response.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Update user info first
      await updateUserMutation.mutateAsync({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        birthDate: formData.birthDate,
        profileImage: profileImage,
      });

      // Then update doctor profile
      await updateDoctorMutation.mutateAsync({
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        education: formData.education,
        experienceYears: parseInt(formData.experienceYears.toString()),
        biography: formData.fullBio, // Usar fullBio para ambos campos
        fullBio: formData.fullBio,
        areasOfExpertise: formData.areasOfExpertise,
        languagesSpoken: formData.languagesSpoken,
        achievements: formData.achievements,
        consultationFee: parseFloat(formData.consultationFee.toString()),
        consultationPriceDescription: formData.consultationPriceDescription,
        pixKeyType: formData.pixKeyType,
        pixKey: formData.pixKey,
        bankName: formData.bankName,
        accountType: formData.accountType,
        availableForEmergency: formData.availableForEmergency,
        onboardingCompleted: formData.onboardingCompleted,
        welcomeCompleted: formData.welcomeCompleted,
        profileImage: profileImage,
      });

      toast({
        title: "Médico atualizado",
        description: "As informações do médico foram atualizadas com sucesso.",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o médico.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAreaOfExpertiseAdd = (area: string) => {
    if (area && !formData.areasOfExpertise.includes(area)) {
      handleInputChange("areasOfExpertise", [...formData.areasOfExpertise, area]);
    }
  };

  const handleAreaOfExpertiseRemove = (area: string) => {
    handleInputChange("areasOfExpertise", formData.areasOfExpertise.filter(a => a !== area));
  };

  const handleLanguageAdd = (language: string) => {
    if (language && !formData.languagesSpoken.includes(language)) {
      handleInputChange("languagesSpoken", [...formData.languagesSpoken, language]);
    }
  };

  const handleLanguageRemove = (language: string) => {
    handleInputChange("languagesSpoken", formData.languagesSpoken.filter(l => l !== language));
  };

  const getInitials = (name?: string) => {
    if (!name) return "MD";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Editar Médico</DialogTitle>
            <DialogDescription>
              Atualize as informações do perfil do médico
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-200px)]">
            <div className="p-6 pt-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="personal">Pessoal</TabsTrigger>
                  <TabsTrigger value="professional">Profissional</TabsTrigger>
                  <TabsTrigger value="financial">Financeiro</TabsTrigger>
                  <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
                  <TabsTrigger value="status">Status</TabsTrigger>
                </TabsList>

                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Pessoais</CardTitle>
                      <CardDescription>
                        Dados pessoais e contato do médico
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Profile Image */}
                      <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={profileImage} />
                          <AvatarFallback>{getInitials(formData.fullName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <ProfileImageUploader
                            currentImage={profileImage}
                            onImageUpdate={(url) => setProfileImage(url)}
                            userId={doctor.userId}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Nome Completo</Label>
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange("fullName", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cpf">CPF</Label>
                          <Input
                            id="cpf"
                            value={formData.cpf}
                            onChange={(e) => handleInputChange("cpf", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="birthDate">Data de Nascimento</Label>
                          <Input
                            id="birthDate"
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => handleInputChange("birthDate", e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Professional Information Tab */}
                <TabsContent value="professional" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Profissionais</CardTitle>
                      <CardDescription>
                        Especialização, experiência e qualificações
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
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="licenseNumber">Número do CRM</Label>
                          <Input
                            id="licenseNumber"
                            value={formData.licenseNumber}
                            onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                            placeholder="Ex: CRM/SP 123456"
                            required
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
                          <Label htmlFor="experienceYears">Anos de Experiência</Label>
                          <Input
                            id="experienceYears"
                            type="number"
                            value={formData.experienceYears}
                            onChange={(e) => handleInputChange("experienceYears", e.target.value)}
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fullBio">Biografia profissional</Label>
                        <Textarea
                          id="fullBio"
                          value={formData.fullBio}
                          onChange={(e) => handleInputChange("fullBio", e.target.value)}
                          placeholder="Descrição detalhada da experiência e qualificações..."
                          rows={5}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Áreas de Especialização</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Adicionar área..."
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAreaOfExpertiseAdd((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.querySelector('input[placeholder="Adicionar área..."]') as HTMLInputElement;
                              if (input) {
                                handleAreaOfExpertiseAdd(input.value);
                                input.value = "";
                              }
                            }}
                          >
                            Adicionar
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.areasOfExpertise.map((area) => (
                            <Badge key={area} variant="secondary" className="gap-1">
                              {area}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleAreaOfExpertiseRemove(area)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Idiomas</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Adicionar idioma..."
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleLanguageAdd((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.querySelector('input[placeholder="Adicionar idioma..."]') as HTMLInputElement;
                              if (input) {
                                handleLanguageAdd(input.value);
                                input.value = "";
                              }
                            }}
                          >
                            Adicionar
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.languagesSpoken.map((lang) => (
                            <Badge key={lang} variant="secondary" className="gap-1">
                              {lang}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => handleLanguageRemove(lang)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="achievements">Conquistas e Certificações</Label>
                        <Textarea
                          id="achievements"
                          value={formData.achievements}
                          onChange={(e) => handleInputChange("achievements", e.target.value)}
                          placeholder="Certificações, prêmios, publicações..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Financeiras</CardTitle>
                      <CardDescription>
                        Valores de consulta e dados bancários
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="consultationFee">Valor da Consulta (R$)</Label>
                          <Input
                            id="consultationFee"
                            type="number"
                            value={formData.consultationFee}
                            onChange={(e) => handleInputChange("consultationFee", e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="consultationPriceDescription">Descrição do Valor</Label>
                          <Input
                            id="consultationPriceDescription"
                            value={formData.consultationPriceDescription}
                            onChange={(e) => handleInputChange("consultationPriceDescription", e.target.value)}
                            placeholder="Ex: Consulta de 30 minutos"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-4">Dados para Recebimento</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="pixKeyType">Tipo de Chave PIX</Label>
                            <select
                              id="pixKeyType"
                              className="w-full p-2 border rounded-md"
                              value={formData.pixKeyType}
                              onChange={(e) => handleInputChange("pixKeyType", e.target.value)}
                            >
                              <option value="">Selecione...</option>
                              <option value="cpf">CPF</option>
                              <option value="cnpj">CNPJ</option>
                              <option value="email">Email</option>
                              <option value="phone">Telefone</option>
                              <option value="random">Chave Aleatória</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="pixKey">Chave PIX</Label>
                            <Input
                              id="pixKey"
                              value={formData.pixKey}
                              onChange={(e) => handleInputChange("pixKey", e.target.value)}
                              placeholder="Digite a chave PIX"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="bankName">Banco</Label>
                            <Input
                              id="bankName"
                              value={formData.bankName}
                              onChange={(e) => handleInputChange("bankName", e.target.value)}
                              placeholder="Ex: Banco do Brasil"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="accountType">Tipo de Conta</Label>
                            <select
                              id="accountType"
                              className="w-full p-2 border rounded-md"
                              value={formData.accountType}
                              onChange={(e) => handleInputChange("accountType", e.target.value)}
                            >
                              <option value="">Selecione...</option>
                              <option value="corrente">Conta Corrente</option>
                              <option value="poupanca">Conta Poupança</option>
                              <option value="pagamento">Conta de Pagamento</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Availability Tab */}
                <TabsContent value="availability" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Disponibilidade e Horários</CardTitle>
                      <CardDescription>
                        Configure os horários de atendimento do médico
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DoctorAvailabilityManager doctorId={doctor.id} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Status Tab */}
                <TabsContent value="status" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Status e Configurações</CardTitle>
                      <CardDescription>
                        Controle o status e acesso do médico
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="availableForEmergency">Disponível para Emergências</Label>
                          <p className="text-sm text-muted-foreground">
                            Permite que o médico atenda consultas de emergência
                          </p>
                        </div>
                        <Switch
                          id="availableForEmergency"
                          checked={formData.availableForEmergency}
                          onCheckedChange={(checked) => handleInputChange("availableForEmergency", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="onboardingCompleted">Onboarding Completo</Label>
                          <p className="text-sm text-muted-foreground">
                            Marca o perfil do médico como verificado
                          </p>
                        </div>
                        <Switch
                          id="onboardingCompleted"
                          checked={formData.onboardingCompleted}
                          onCheckedChange={(checked) => handleInputChange("onboardingCompleted", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="welcomeCompleted">Boas-vindas Completadas</Label>
                          <p className="text-sm text-muted-foreground">
                            Indica que o médico já passou pelo processo de boas-vindas
                          </p>
                        </div>
                        <Switch
                          id="welcomeCompleted"
                          checked={formData.welcomeCompleted}
                          onCheckedChange={(checked) => handleInputChange("welcomeCompleted", checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateUserMutation.isPending || updateDoctorMutation.isPending}
            >
              {updateUserMutation.isPending || updateDoctorMutation.isPending ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorEditModal;