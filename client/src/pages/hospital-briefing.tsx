import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building, 
  Users, 
  TrendingUp, 
  Shield, 
  Stethoscope, 
  DollarSign, 
  CheckCircle, 
  ArrowRight,
  Heart,
  Clock,
  Award,
  Smartphone,
  Video,
  FileText,
  BarChart3,
  Globe,
  Zap,
  Building2
} from 'lucide-react';

const SimpleCounter = ({ value }: { value: string }) => {
  return (
    <span className="font-bold">
      {value}
    </span>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: {
  icon: any;
  title: string;
  description: string;
}) => (
  <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 transform hover:-translate-y-1 hover:scale-105">
    <CardHeader className="text-center">
      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mb-4 transform transition-transform duration-300 hover:rotate-12">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-600 text-center">{description}</p>
    </CardContent>
  </Card>
);

const StatCard = ({ icon: Icon, value, label, color = "blue" }: {
  icon: any;
  value: string;
  label: string;
  color?: string;
}) => (
  <Card className="text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
    <CardContent className="pt-6">
      <div className={`mx-auto w-12 h-12 bg-gradient-to-br from-${color}-500 to-${color}-700 rounded-full flex items-center justify-center mb-4 animate-pulse`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl font-bold text-gray-800 transition-all duration-300 hover:scale-110">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </CardContent>
  </Card>
);

const ROICalculator = () => {
  const [leitos, setLeitos] = useState('100');
  const [planosVendidosMes1, setPlanosVendidosMes1] = useState('50');
  const [planosVendidosMes2, setPlanosVendidosMes2] = useState('70');
  const [planosVendidosMes3, setPlanosVendidosMes3] = useState('80');
  const [mesesProjecao, setMesesProjecao] = useState(12);
  
  const calcularROI = () => {
    const numLeitos = parseInt(leitos) || 0;
    const mes1 = parseInt(planosVendidosMes1) || 0;
    const mes2 = parseInt(planosVendidosMes2) || 0;
    const mes3 = parseInt(planosVendidosMes3) || 0;
    
    // Valor fixo por plano ativo
    const valorPorPlano = 25;
    
    // Calculando planos ativos acumulados
    const planosAtivos = {
      mes1: mes1,
      mes2: mes1 + mes2,
      mes3: mes1 + mes2 + mes3,
      mes6: mes1 + mes2 + mes3 + (mes3 * 3), // Assumindo mesma taxa do mês 3
      mes12: mes1 + mes2 + mes3 + (mes3 * 9) // Assumindo mesma taxa do mês 3
    };
    
    // Receitas mensais
    const receitaMes1 = planosAtivos.mes1 * valorPorPlano;
    const receitaMes3 = planosAtivos.mes3 * valorPorPlano;
    const receitaMes6 = planosAtivos.mes6 * valorPorPlano;
    const receitaMes12 = planosAtivos.mes12 * valorPorPlano;
    
    // Receita anual (soma de todos os meses)
    let receitaAnualTotal = 0;
    for (let i = 1; i <= 12; i++) {
      if (i === 1) receitaAnualTotal += planosAtivos.mes1 * valorPorPlano;
      else if (i === 2) receitaAnualTotal += (mes1 + mes2) * valorPorPlano;
      else if (i === 3) receitaAnualTotal += planosAtivos.mes3 * valorPorPlano;
      else receitaAnualTotal += (planosAtivos.mes3 + (mes3 * (i - 3))) * valorPorPlano;
    }
    
    const receitaPorLeito = numLeitos > 0 ? Math.floor(receitaAnualTotal / numLeitos) : 0;
    
    return {
      receitaMes1,
      receitaMes3,
      receitaMes6,
      receitaMes12,
      receitaAnualTotal,
      receitaPorLeito,
      planosAtivos,
      valorPorPlano
    };
  };

  const resultado = calcularROI();

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 shadow-xl transition-all duration-500 hover:shadow-2xl">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-800 mb-4">
          Calculadora de Retorno Financeiro
        </h3>
        <p className="text-gray-600 text-lg">
          Descubra quanto seu hospital pode faturar com o CNVidas
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de leitos do hospital
            </label>
            <Input
              type="number"
              placeholder="Ex: 100"
              value={leitos}
              onChange={(e) => setLeitos(e.target.value)}
              className="text-lg transition-all duration-300 focus:scale-105 focus:shadow-lg"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Projeção de vendas mensais</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mês 1 - Novos planos
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 50"
                  value={planosVendidosMes1}
                  onChange={(e) => setPlanosVendidosMes1(e.target.value)}
                  className="text-lg transition-all duration-300 focus:scale-105 focus:shadow-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mês 2 - Novos planos
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 70"
                  value={planosVendidosMes2}
                  onChange={(e) => setPlanosVendidosMes2(e.target.value)}
                  className="text-lg transition-all duration-300 focus:scale-105 focus:shadow-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mês 3+ - Novos planos/mês
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 80"
                  value={planosVendidosMes3}
                  onChange={(e) => setPlanosVendidosMes3(e.target.value)}
                  className="text-lg transition-all duration-300 focus:scale-105 focus:shadow-lg"
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700">
              <strong>Modelo de receita:</strong> R$ 25 por plano ativo/mês
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Receita recorrente acumulativa - cada plano vendido gera R$ 25/mês indefinidamente
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-white/90 backdrop-blur shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Evolução da Receita Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Mês 1</span>
                  <span className="font-semibold text-gray-800">
                    {resultado.planosAtivos.mes1} planos = R$ {resultado.receitaMes1.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm text-gray-600">Mês 3</span>
                  <span className="font-semibold text-blue-700">
                    {resultado.planosAtivos.mes3} planos = R$ {resultado.receitaMes3.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm text-gray-600">Mês 6</span>
                  <span className="font-semibold text-green-700">
                    {resultado.planosAtivos.mes6} planos = R$ {resultado.receitaMes6.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-sm font-medium text-gray-700">Mês 12</span>
                  <span className="font-bold text-purple-700 text-lg">
                    {resultado.planosAtivos.mes12} planos = R$ {resultado.receitaMes12.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 animate-pulse" />
                <div className="text-3xl font-bold mb-2">
                  R$ {resultado.receitaAnualTotal.toLocaleString()}
                </div>
                <div className="text-sm opacity-90">Receita Total no Primeiro Ano</div>
              </div>
            </CardContent>
          </Card>

          {resultado.receitaPorLeito > 0 && (
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardContent className="pt-6 text-center">
                <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700">
                  R$ {resultado.receitaPorLeito.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Receita por leito no primeiro ano</div>
              </CardContent>
            </Card>
          )}

          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-600 font-medium mb-2">💡 Como funciona:</p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Cada plano vendido gera R$ {resultado.valorPorPlano}/mês</div>
              <div>• Receita é acumulativa (planos não cancelam)</div>
              <div>• Hospital recebe 100% da comissão</div>
              <div>• Pagamento mensal direto na conta do hospital</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HospitalBriefing() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToROI = () => {
    console.log('Clicou no botão Calcular ROI');
    // Rolar até a seção de ROI dentro do contêiner rolável da página
    const el = document.getElementById('roi-calculator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openDemo = () => {
    console.log('Clicou no botão Ver Demonstração');
    window.open('https://www.homologacao.cnvidas.com.br', '_blank');
  };

  const beneficios = [
    {
      icon: DollarSign,
      title: "Receita Recorrente",
      description: "R$ 25 por plano ativo mensalmente, receita acumulativa e vitalícia."
    },
    {
      icon: Zap,
      title: "Zero Investimento",
      description: "Implementação 100% gratuita. CNVidas assume todos os custos operacionais."
    },
    {
      icon: Building2,
      title: "Marca Própria",
      description: "Sistema totalmente personalizado com logo e identidade visual do hospital."
    },
    {
      icon: Shield,
      title: "Gestão Completa",
      description: "CNVidas gerencia seguros, parceiros e toda operação técnica."
    },
    {
      icon: Heart,
      title: "Cuidado 24/7",
      description: "Telemedicina de emergência disponível para pacientes a qualquer momento."
    },
    {
      icon: Users,
      title: "Fidelização",
      description: "Mantenha pacientes conectados ao hospital através do seu próprio app."
    }
  ];

  const funcionalidades = [
    {
      icon: Video,
      title: "Telemedicina 24/7",
      description: "Consultas médicas por vídeo disponíveis a qualquer hora, conectando pacientes com médicos qualificados."
    },
    {
      icon: Stethoscope,
      title: "40+ Especialidades",
      description: "Ampla rede de especialistas médicos para atender todas as necessidades dos pacientes."
    },
    {
      icon: FileText,
      title: "Prontuário Digital",
      description: "Sistema completo de registros médicos eletrônicos com IA para transcrição."
    },
    {
      icon: Smartphone,
      title: "App Personalizado",
      description: "Aplicativo móvel com a marca do hospital para iOS e Android."
    },
    {
      icon: Clock,
      title: "Agendamento Inteligente",
      description: "Sistema automatizado para agendamento de consultas e exames."
    },
    {
      icon: Shield,
      title: "Cobertura Hospitalar",
      description: "Até R$ 500/dia para internações e procedimentos de emergência."
    }
  ];

  return (
    // Contêiner rolável próprio da página para contornar body/html com overflow hidden
    <div className="w-full h-screen overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/assets/Logotipo_cnvidas_comprido_transparent_advanced_fuzz3.png" 
                alt="CNVidas"
                className="h-12 w-auto"
              />
              <div>
                <p className="text-sm text-gray-600">Whitelabel para Hospitais</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                console.log('Botão Header clicado!');
                openDemo();
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 cursor-pointer"
            >
              Solicitar Demonstração
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className={`container mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mb-12">
            <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-green-100 text-blue-800 text-sm px-4 py-2 animate-bounce">
              Solução Whitelabel Premium
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
              Transforme seu
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent animate-gradient-x">
                {" "}Hospital
              </span>
              <br />em uma Plataforma Digital
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              O CNVidas oferece uma solução completa de telemedicina com sua marca, 
              gerando receita recorrente sem investimento inicial para hospitais visionários.
            </p>
            
            {/* Botões de debug removidos: usavam scroll da window e não do contêiner */}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => {
                  console.log('Botão Ver Demonstração clicado!');
                  openDemo();
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-4 text-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <Building className="w-5 h-5 mr-2" />
                Ver Demonstração
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => {
                  console.log('Botão Calcular ROI clicado!');
                  scrollToROI();
                }}
                className="border-2 border-blue-600 text-blue-700 hover:bg-blue-50 px-8 py-4 text-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Calcular ROI
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className={`grid md:grid-cols-4 gap-8 mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <StatCard
              icon={Users}
              value="50.000+"
              label="Vidas Ativas"
            />
            <StatCard
              icon={Building}
              value="15+"
              label="Hospitais Parceiros"
              color="green"
            />
            <StatCard
              icon={DollarSign}
              value="R$ 2.5M+"
              label="Receita Gerada"
              color="purple"
            />
            <StatCard
              icon={Stethoscope}
              value="95%"
              label="Satisfação Médica"
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section id="roi-calculator" className="py-16 px-6">
        <div className="container mx-auto animate-fade-in">
          <ROICalculator />
        </div>
      </section>

      {/* Pricing Table Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto animate-fade-in">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Tabela de Valores dos Planos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Valores que os pacientes pagarão diretamente pelo app do hospital
            </p>
          </div>

          {/* Planos Individuais */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-700 mb-6 text-center">Planos Individuais</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 transform hover:-translate-y-2 hover:scale-105">
                <CardHeader className="bg-gradient-to-br from-gray-50 to-gray-100">
                  <CardTitle className="text-xl">Básico</CardTitle>
                  <div className="text-3xl font-bold text-gray-800 mt-2">
                    R$ 89,90<span className="text-base font-normal">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">2 teleconsultas de emergência/mês</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">30% desconto em especialistas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">R$ 300/dia seguro hospitalar</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1">
                    Mais Popular
                  </Badge>
                </div>
                <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardTitle className="text-xl">Premium</CardTitle>
                  <div className="text-3xl font-bold text-blue-700 mt-2">
                    R$ 129,90<span className="text-base font-normal">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">Teleconsultas ilimitadas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">50% desconto em especialistas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Agendamento prioritário</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">R$ 300/dia seguro hospitalar</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200 transform hover:-translate-y-2 hover:scale-105">
                <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardTitle className="text-xl">Ultra</CardTitle>
                  <div className="text-3xl font-bold text-purple-700 mt-2">
                    R$ 169,90<span className="text-base font-normal">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">Teleconsultas ilimitadas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">70% desconto em especialistas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Prioridade máxima agendamento</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">R$ 500/dia seguro hospitalar</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Planos Familiares */}
          <div>
            <h3 className="text-2xl font-bold text-gray-700 mb-6 text-center">Planos Familiares</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200">
                <CardHeader className="bg-gradient-to-br from-green-50 to-green-100">
                  <CardTitle className="text-xl">Básico Familiar</CardTitle>
                  <div className="text-3xl font-bold text-green-700 mt-2">
                    R$ 149,90<span className="text-base font-normal">/mês</span>
                  </div>
                  <Badge className="mt-2 bg-green-200 text-green-800">Até 4 pessoas</Badge>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">2 teleconsultas/mês por pessoa</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">30% desconto em especialistas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">R$ 300/dia seguro hospitalar</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1">
                    Melhor Custo-Benefício
                  </Badge>
                </div>
                <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardTitle className="text-xl">Premium Familiar</CardTitle>
                  <div className="text-3xl font-bold text-blue-700 mt-2">
                    R$ 199,90<span className="text-base font-normal">/mês</span>
                  </div>
                  <Badge className="mt-2 bg-blue-200 text-blue-800">Até 4 pessoas</Badge>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">Teleconsultas ilimitadas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">50% desconto em especialistas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Agendamento prioritário</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">R$ 300/dia seguro hospitalar</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200 transform hover:-translate-y-2 hover:scale-105">
                <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardTitle className="text-xl">Ultra Familiar</CardTitle>
                  <div className="text-3xl font-bold text-purple-700 mt-2">
                    R$ 239,90<span className="text-base font-normal">/mês</span>
                  </div>
                  <Badge className="mt-2 bg-purple-200 text-purple-800">Até 4 pessoas</Badge>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">Teleconsultas ilimitadas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">70% desconto em especialistas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Prioridade máxima agendamento</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">R$ 500/dia seguro hospitalar</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-lg font-medium text-gray-800 mb-2">
                  💰 Hospital recebe R$ 25 por plano ativo mensalmente
                </p>
                <p className="text-sm text-gray-600">
                  Receita recorrente garantida enquanto o cliente permanecer ativo no sistema
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-white/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Por que escolher o CNVidas?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Uma parceria estratégica que transforma seu hospital em uma plataforma 
              digital de saúde, gerando receita recorrente e fidelizando pacientes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {beneficios.map((beneficio, index) => (
              <FeatureCard
                key={index}
                icon={beneficio.icon}
                title={beneficio.title}
                description={beneficio.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Funcionalidades Completas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Plataforma completa de telemedicina com tecnologia de ponta 
              para oferecer o melhor cuidado aos seus pacientes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {funcionalidades.map((funcionalidade, index) => (
              <FeatureCard
                key={index}
                icon={funcionalidade.icon}
                title={funcionalidade.title}
                description={funcionalidade.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="container mx-auto text-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Pronto para Transformar seu Hospital?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Junte-se aos hospitais que já estão gerando receita recorrente 
              com nossa plataforma de telemedicina whitelabel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                onClick={openDemo}
                className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 text-lg"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Agendar Reunião
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => window.open('https://www.cnvidas.com.br', '_blank')}
                className="border-2 border-white text-white hover:bg-white hover:text-blue-700 px-8 py-4 text-lg"
              >
                <Globe className="w-5 h-5 mr-2" />
                Visitar Site CNVidas
              </Button>
            </div>
            <p className="text-sm text-blue-200 mt-6">
              Implementação gratuita • Suporte 24/7 • Sem compromisso
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/assets/Logotipo_cnvidas_comprido_transparent_advanced_fuzz3.png" 
                  alt="CNVidas"
                  className="h-10 w-auto filter brightness-0 invert transform transition-transform duration-300 hover:scale-110"
                />
              </div>
              <p className="text-gray-400">
                Transformando o cuidado em saúde através da tecnologia e inovação.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <div className="space-y-2 text-gray-400">
                <p>📧 contato@cnvidas.com.br</p>
                <p>📱 (11) 9999-9999</p>
                <p>🌐 www.cnvidas.com.br</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soluções</h4>
              <div className="space-y-2 text-gray-400">
                <p>• Telemedicina 24/7</p>
                <p>• App Personalizado</p>
                <p>• Prontuário Digital</p>
                <p>• Whitelabel Hospitalar</p>
              </div>
            </div>
          </div>
          <Separator className="my-8 bg-gray-800" />
          <div className="text-center text-gray-400">
            <p>&copy; 2024 CNVidas. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}