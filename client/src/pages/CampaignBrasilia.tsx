import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Users, Globe, Shield, Building2, Clock, Stethoscope } from "lucide-react";

export function CampaignBrasilia() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  // Garantir viewport correto para mobile
  useEffect(() => {
    // Verificar se existe meta viewport, se não, adicionar
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      document.head.appendChild(viewport);
    }
  }, []);

  const formatWhatsApp = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    
    // Aplica a máscara
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsapp(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !whatsapp.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    // Validar WhatsApp
    const whatsappNumbers = whatsapp.replace(/\D/g, "");
    if (whatsappNumbers.length < 10 || whatsappNumbers.length > 11) {
      toast({
        title: "WhatsApp inválido",
        description: "Por favor, insira um número de WhatsApp válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("/api/campaign-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          whatsapp: whatsappNumbers,
          campaign: "brasilia-plano-piloto",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar dados");
      }

      setSubmitted(true);
      toast({
        title: "Cadastro realizado!",
        description: "Entraremos em contato em breve pelo WhatsApp.",
      });
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar o cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="pt-8 pb-8 px-4 sm:pt-12 sm:pb-12 sm:px-6">
            <CheckCircle className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Cadastro Realizado com Sucesso!
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
              Obrigado por se cadastrar, {name}! 
              <br />
              Em breve entraremos em contato pelo WhatsApp informado.
            </p>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setName("");
                setWhatsapp("");
              }}
              variant="outline"
            >
              Fazer Novo Cadastro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 max-w-4xl">
        {/* Logo CNVidas centralizado */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <img 
            src="/images/logo.png" 
            alt="CN Vidas" 
            className="h-12 sm:h-16 w-auto"
          />
        </div>

        {/* Card Principal */}
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white text-center py-6 sm:py-8 px-4 sm:px-6">
            <div className="space-y-2">
              <div className="bg-yellow-400 text-green-900 text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 rounded-full inline-block mb-2 sm:mb-4">
                🏛️ EXCLUSIVO BRASÍLIA
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
                CNVidas chega ao Plano Piloto e região!
              </h1>
              <p className="text-green-100 text-sm sm:text-base md:text-lg">
                Telemedicina premium para moradores do DF e região
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 md:p-8">
            {/* Benefícios específicos de Brasília */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="text-center">
                <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-2 sm:mb-3" />
                <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Atende todo o DF</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Plano Piloto, Lagos, Sudoeste e regiões administrativas
                </p>
              </div>
              <div className="text-center">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-2 sm:mb-3" />
                <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Planos Completos</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Consultas ilimitadas e especialistas disponíveis
                </p>
              </div>
              <div className="text-center">
                <Globe className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-2 sm:mb-3" />
                <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Cobertura Nacional</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Atendimento em todo Brasil para suas viagens
                </p>
              </div>
            </div>

            {/* Diferenciais adicionais */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-3 text-center">Por que escolher o CNVidas?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Sem filas de espera</p>
                    <p className="text-xs text-gray-600">Consultas médicas em até 3 minutos</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Stethoscope className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Especialistas 24h</p>
                    <p className="text-xs text-gray-600">Médicos formados nas melhores universidades</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Planos familiares</p>
                    <p className="text-xs text-gray-600">Proteja toda sua família com um único plano</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">100% digital e seguro</p>
                    <p className="text-xs text-gray-600">Prontuário eletrônico e receitas digitais</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-center mb-4 sm:mb-6">
                🚀 Garanta seu acesso com desconto de lançamento
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto" noValidate>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full h-12 text-base"
                    autoComplete="name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                  />
                </div>
                
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="(61) 00000-0000"
                    value={whatsapp}
                    onChange={handleWhatsAppChange}
                    disabled={loading}
                    className="w-full h-12 text-base"
                    autoComplete="tel"
                    inputMode="numeric"
                    enterKeyHint="done"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    "Quero meu desconto exclusivo"
                  )}
                </Button>
              </form>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                Ao cadastrar-se, você concorda em receber comunicações do CNVidas via WhatsApp
              </p>
            </div>

            {/* Urgência e credibilidade */}
            <div className="mt-4 sm:mt-6 text-center space-y-2">
              <p className="text-xs sm:text-sm text-gray-600">
                ⏰ <span className="font-semibold">Oferta por tempo limitado!</span> Apenas para os primeiros 500 cadastros.
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">+10.000 famílias</span> já confiam no CNVidas em todo Brasil
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}