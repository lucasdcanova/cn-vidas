import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { getServices } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, QrCode, Loader2 } from "lucide-react";
import AppointmentForm from "@/components/forms/appointment-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UpgradePlanMessage } from "@/components/ui/upgrade-plan-message";
import { httpRequest } from "@/lib/http-client";

// Função para obter a imagem do serviço com sistema de fallback
const getServiceImage = (service: any) => {
  // Primeiro tenta usar a imagem específica do serviço
  if (service.serviceImage) {
    return service.serviceImage;
  }
  
  // Se não tiver imagem do serviço, tenta usar a imagem do perfil do parceiro
  if (service.partner && service.partner.profileImage) {
    return service.partner.profileImage;
  }
  
  // Caso não tenha nenhuma imagem, retorna o logo do CN Vidas com fundo branco
  return "/logo_cn_vidas_white_bg.svg";
};

const Services: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showUpgradeMessage, setShowUpgradeMessage] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  
  // Query para serviços filtrados por localização (padrão)
  const { data: services = [], error, isError, isLoading } = useQuery<any[]>({
    queryKey: ["/api/services", showAllServices, user?.city],
    queryFn: async () => {
      // Use getServices da API que já usa httpRequest internamente
      const userCity = !showAllServices && user?.city ? user.city : undefined;
      
      console.log('[Services] Fetching services with city:', userCity);
      console.log('[Services] Show all services:', showAllServices);
      
      return await getServices(undefined, userCity);
    },
    retry: false,
  });

  // Log para depuração quando os dados mudam
  useEffect(() => {
    if (services && services.length > 0) {
      console.log("Serviços recebidos:", services);
      console.log("Exemplo de serviço completo:", services[0]);
      console.log("serviceImage:", services[0].serviceImage);
      console.log("partner:", services[0].partner);
      if (services[0].partner) {
        console.log("partner.profileImage:", services[0].partner.profileImage);
      }
      // Verificar se há algum serviço com imagem
      const servicesWithImages = services.filter(s => s.serviceImage);
      console.log(`Serviços com imagem: ${servicesWithImages.length} de ${services.length}`);
    }
  }, [services]);
  
  // Verificar se o erro é de restrição de plano que exige upgrade
  useEffect(() => {
    if (
      isError &&
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as any).response?.data?.requiresUpgrade
    ) {
      setShowUpgradeMessage(true);
    }
  }, [isError, error]);
  
  // Get unique categories from services and add "Farmácias" as a fixed option
  const dynamicCategories = ["all", ...new Set(services.map(service => service.category))];
  // Adicione "Farmácias" se ainda não estiver na lista
  const categories = dynamicCategories.includes("Farmácias") 
    ? dynamicCategories 
    : [...dynamicCategories, "Farmácias"];
  
  // Filter services based on search term and category
  const filteredServices = services.filter(service => {
    const matchesSearch = searchTerm === "" || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Redireciona para o WhatsApp do parceiro
  const handleContactPartner = (service: any) => {
    // Log para depuração
    console.log("Serviço selecionado:", service);
    console.log("Informações do parceiro:", service.partner);

    // Verifica se o serviço tem informações do parceiro
    if (service.partner && service.partner.id) {
      let phoneNumber = '';
      
      // Tenta usar o telefone do parceiro registrado no sistema
      if (service.partner.phone && service.partner.phone.trim() !== '') {
        phoneNumber = service.partner.phone.replace(/\D/g, '');
      }
      
      // Se não tiver telefone do parceiro, usa o número padrão da CN Vidas
      if (!phoneNumber) {
        console.log("Número do parceiro não encontrado, usando número padrão da CN Vidas");
        phoneNumber = "5551999862303"; // Número da CN Vidas com código do país
      }
      
      // Se o número não começar com código do país, adiciona o código do Brasil
      if (!phoneNumber.startsWith('55')) {
        phoneNumber = '55' + phoneNumber;
      }
      
      console.log("Número formatado para WhatsApp:", phoneNumber);
      
      // Mensagem predefinida
      const partnerName = service.partner.name || service.partner.businessName || service.partner.tradingName || 'parceiro';
      const message = encodeURIComponent(
        `Olá! Sou cliente CN Vidas e gostaria de obter mais informações sobre o serviço "${service.name}" oferecido por ${partnerName}.`
      );
      
      // Abrindo o WhatsApp em uma nova aba
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      console.log("URL do WhatsApp:", whatsappUrl);
      window.open(whatsappUrl, '_blank');
    } else {
      // Se não tiver parceiro, ainda assim abre o WhatsApp com o número padrão
      const defaultPhone = "5551999862303"; // Número da CN Vidas com código do país
      const message = encodeURIComponent(
        `Olá! Sou cliente CN Vidas e gostaria de obter mais informações sobre o serviço "${service.name}".`
      );
      window.open(`https://wa.me/${defaultPhone}?text=${message}`, '_blank');
    }
  };
  
  // Abre o modal para mostrar o cartão virtual com QR code
  const handleShowQrCode = () => {
    // Navega para a página de QR code
    navigate('/qr-code');
  };
  
  // Esta função foi removida (duplicada) pois já temos a função getServiceImage definida no topo do arquivo
  
  return (
    <DashboardLayout title="Serviços">
      {/* Mostrar mensagem de upgrade em modal quando necessário */}
      {showUpgradeMessage && (
        <UpgradePlanMessage 
          feature="services" 
          onClose={() => setShowUpgradeMessage(false)} 
        />
      )}
      
      <div className="max-w-7xl mx-auto">
      
        {/* Header section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Serviços em Destaque {user?.city ? `em ${user.city} e região` : ''}
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.city 
                  ? `Serviços próximos a ${user.city} (até 50km) com descontos exclusivos`
                  : 'Explore e agende serviços com descontos exclusivos para membros CN Vidas'
                }
              </p>
            </div>
            {user?.city && (
              <div className="mt-4 sm:mt-0">
                <Button
                  variant={showAllServices ? "default" : "outline"}
                  onClick={() => setShowAllServices(!showAllServices)}
                  className="w-full sm:w-auto"
                >
                  {showAllServices ? 'Mostrar serviços próximos' : 'Ver todos os serviços'}
                </Button>
              </div>
            )}
          </div>
          
          {/* Search and filters */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="w-full md:w-64">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category, index) => (
                    <SelectItem key={index} value={category}>
                      {category === "all" ? "Todas as categorias" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Service cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-3 text-center py-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-gray-600 font-medium mb-2">
                  Aguarde enquanto localizamos os serviços...
                </p>
                <p className="text-gray-500 text-sm">
                  Buscando parceiros disponíveis na sua região
                </p>
              </div>
            </div>
          ) : filteredServices.length > 0 ? (
            filteredServices.map((service, index) => (
              <Card key={service.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <img 
                  src={getServiceImage(service)}
                  alt={service.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    // Se falhar ao carregar a imagem, mostre um plano de fundo genérico
                    e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/64748b?text=CN+Vidas";
                  }} 
                />
                <CardHeader className="pb-2">
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>{service.category}</CardDescription>
                  <div className="flex flex-col space-y-1">
                    {service.isNational ? (
                      <p className="text-xs font-medium text-green-600">
                        🌍 Atendimento em todo território nacional
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500">
                          {service.closestAddressName ? (
                            <>
                              {service.closestAddressName} - {service.closestAddressCity}
                            </>
                          ) : (
                            service.partner && service.partner.neighborhood && service.partner.city ? 
                              `${service.partner.neighborhood}, ${service.partner.city}` : ''
                          )}
                        </p>
                        {service.distance !== undefined && service.distance !== null && (
                          <p className="text-xs font-medium text-blue-600">
                            📍 {service.distance}km de distância
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      {/* Linha superior com preço riscado ou "Preços variáveis" */}
                      {service.regularPrice && service.regularPrice > 0 ? (
                        <p className="text-xs text-gray-500 line-through">
                          R$ {(service.regularPrice / 100).toFixed(2).replace('.', ',')}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">Preços variáveis</p>
                      )}
                      
                      {/* Linha inferior com preço de desconto ou "Consulte" */}
                      {(service.discountPrice && service.discountPrice > 0) ? (
                        <p className="text-base font-bold text-primary-600">
                          R$ {(service.discountPrice / 100).toFixed(2).replace('.', ',')}
                        </p>
                      ) : (
                        <p className="text-base font-bold text-primary-600">Consulte</p>
                      )}
                    </div>
                    {service.discountPercentage ? (
                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full bg-green-100 text-green-800 shadow-sm">
                        {service.discountPercentage}% de desconto
                      </span>
                    ) : null}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 p-4">
                  <Button 
                    className="w-full mb-2 justify-center"
                    onClick={() => handleContactPartner(service)}
                    variant="outline"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Entrar em contato
                  </Button>
                  <Button 
                    className="w-full justify-center"
                    onClick={() => handleShowQrCode()}
                    variant="default"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    Mostrar cartão virtual
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-gray-500">Nenhum serviço encontrado com os filtros selecionados.</p>
            </div>
          )}
        </div>
        
        {/* Information about services */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Sobre Nossos Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>
                Como assinante do CN Vidas, você tem acesso a uma rede exclusiva de parceiros que 
                oferecem serviços de saúde com descontos especiais. Todos os serviços 
                são prestados por profissionais qualificados e estabelecimentos credenciados.
              </p>
              
              <h3>Benefícios exclusivos</h3>
              <ul>
                <li>Descontos de até 70% em consultas presenciais, exames e procedimentos</li>
                <li>Acesso a uma ampla rede de clínicas, laboratórios e especialistas</li>
                <li>Rede de parceiros em constante expansão</li>
                <li>QR Code digital para identificação rápida</li>
              </ul>
              
              <h3>Como utilizar os serviços?</h3>
              <ol>
                <li>Escolha o serviço desejado entre as opções disponíveis</li>
                <li>Clique em "Entrar em contato" para falar diretamente com o parceiro</li>
                <li>Agende seu atendimento diretamente com o estabelecimento</li>
                <li>No dia do atendimento, apresente seu QR Code CN Vidas (disponível em seu perfil) para garantir o desconto</li>
              </ol>
              
              <p className="text-sm text-gray-600 mt-4">
                <strong>Importante:</strong> O agendamento deve ser feito diretamente com o parceiro. 
                O QR Code é sua identificação como assinante CN Vidas e garante os descontos exclusivos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Appointment scheduling dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Agendar Serviço</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para agendar o serviço selecionado.
            </DialogDescription>
          </DialogHeader>
          <AppointmentForm initialServiceId={selectedService || undefined} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Services;
