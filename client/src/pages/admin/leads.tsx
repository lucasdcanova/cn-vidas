import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Phone, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Lead {
  id: number;
  name: string;
  whatsapp: string;
  campaign: string;
  createdAt: string;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [searchTerm, leads]);

  const fetchLeads = async () => {
    try {
      const response = await fetch("/api/campaign-leads", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar leads");
      }

      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leads.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    const filtered = leads.filter(lead => 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.whatsapp.includes(searchTerm) ||
      lead.campaign.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLeads(filtered);
  };

  const formatWhatsApp = (whatsapp: string) => {
    if (!whatsapp) return "";
    const cleaned = whatsapp.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return whatsapp;
  };

  const exportToCSV = () => {
    const headers = ["Nome", "WhatsApp", "Campanha", "Data de Cadastro"];
    const data = filteredLeads.map(lead => [
      lead.name,
      formatWhatsApp(lead.whatsapp),
      lead.campaign,
      format(new Date(lead.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
    ]);

    const csvContent = [
      headers.join(","),
      ...data.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_cnvidas_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída",
      description: `${filteredLeads.length} leads exportados com sucesso.`,
    });
  };

  const getCampaignBadge = (campaign: string) => {
    const campaignMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "taquari-hospital-sao-jose": { label: "Taquari - Hospital São José", variant: "default" },
      "brasilia-plano-piloto": { label: "Brasília - Plano Piloto", variant: "secondary" },
    };

    const config = campaignMap[campaign] || { label: campaign, variant: "outline" as const };
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: leads.length,
    taquari: leads.filter(l => l.campaign === "taquari-hospital-sao-jose").length,
    brasilia: leads.filter(l => l.campaign === "brasilia-plano-piloto").length,
    today: leads.filter(l => {
      const leadDate = new Date(l.createdAt);
      const today = new Date();
      return leadDate.toDateString() === today.toDateString();
    }).length,
    week: leads.filter(l => {
      const leadDate = new Date(l.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return leadDate >= weekAgo;
    }).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leads de Campanhas</h1>
          <p className="text-muted-foreground">
            Gerencie os leads capturados através das campanhas de marketing
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanha Taquari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.taquari}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanha Brasília</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.brasilia}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Últimos 7 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.week}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Leads</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhum lead encontrado com esses critérios." : "Nenhum lead cadastrado ainda."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {formatWhatsApp(lead.whatsapp)}
                        </div>
                      </TableCell>
                      <TableCell>{getCampaignBadge(lead.campaign)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(lead.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const whatsappNumber = lead.whatsapp.replace(/\D/g, "");
                            window.open(`https://wa.me/55${whatsappNumber}`, "_blank");
                          }}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}