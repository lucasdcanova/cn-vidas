import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Users, Heart, Star } from "lucide-react";

export function CampaignTaquari() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

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
          campaign: "taquari-hospital-sao-jose",
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="pt-12 pb-12">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Cadastro Realizado com Sucesso!
            </h2>
            <p className="text-gray-600 mb-8">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Logos */}
        <div className="flex justify-center items-center gap-8 mb-8">
          <img 
            src="/cnvidas-logo.png" 
            alt="CNVidas" 
            className="h-16 object-contain"
          />
          <div className="text-2xl font-bold text-gray-400">+</div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-900">Hospital São José</div>
            <div className="text-sm text-gray-600">Taquari/RS</div>
          </div>
        </div>

        {/* Card Principal */}
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-8">
            <div className="space-y-2">
              <div className="bg-red-500 text-white text-sm font-bold px-4 py-1 rounded-full inline-block mb-4">
                🔥 PROMOÇÃO DE LANÇAMENTO
              </div>
              <h1 className="text-3xl font-bold">
                CNVidas chega a Taquari!
              </h1>
              <p className="text-blue-100 text-lg">
                Seja um dos primeiros a ter acesso exclusivo à telemedicina de qualidade
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {/* Benefícios */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Médicos 24h</h3>
                <p className="text-sm text-gray-600">
                  Consultas online a qualquer hora do dia
                </p>
              </div>
              <div className="text-center">
                <Heart className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Parceria Local</h3>
                <p className="text-sm text-gray-600">
                  Em parceria com o Hospital São José
                </p>
              </div>
              <div className="text-center">
                <Star className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Condições Especiais</h3>
                <p className="text-sm text-gray-600">
                  Preços exclusivos para moradores de Taquari
                </p>
              </div>
            </div>

            {/* Formulário */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-center mb-6">
                📋 Cadastre-se na Lista de Espera
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
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
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={whatsapp}
                    onChange={handleWhatsAppChange}
                    disabled={loading}
                    className="w-full"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    "Garantir Minha Vaga"
                  )}
                </Button>
              </form>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                Ao cadastrar-se, você concorda em receber comunicações do CNVidas via WhatsApp
              </p>
            </div>

            {/* Urgência */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ⏰ <span className="font-semibold">Vagas limitadas!</span> Garanta já seu acesso com condições especiais.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}