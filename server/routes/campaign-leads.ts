import { Router } from "express";
import { db } from "../db.js";
import { campaignLeads, insertCampaignLeadSchema } from "../../shared/schema.js";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { desc, eq } from "drizzle-orm";

const router = Router();

// Criar novo lead (público)
router.post("/", async (req, res) => {
  try {
    const data = insertCampaignLeadSchema.parse(req.body);
    
    const [newLead] = await db
      .insert(campaignLeads)
      .values({
        name: data.name,
        whatsapp: data.whatsapp,
        campaign: data.campaign || "taquari-hospital-sao-jose",
      })
      .returning();

    res.json({
      success: true,
      lead: newLead,
    });
  } catch (error: any) {
    console.error("Error creating campaign lead:", error);
    res.status(400).json({
      error: "Failed to create lead",
      details: error.message,
    });
  }
});

// Listar leads (admin only)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log("[Campaign Leads] Buscando todos os leads...");
    console.log("[Campaign Leads] Usuário autenticado:", (req as any).user?.email);

    const leads = await db
      .select()
      .from(campaignLeads)
      .orderBy(desc(campaignLeads.createdAt));

    console.log(`[Campaign Leads] ${leads.length} leads encontrados`);

    res.json({
      success: true,
      leads
    });
  } catch (error: any) {
    console.error("[Campaign Leads] Erro ao buscar leads:", error);
    console.error("[Campaign Leads] Stack:", error.stack);

    // Verificar se é erro de tabela não existir
    if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
      return res.status(500).json({
        error: "Tabela campaign_leads não existe",
        details: "A migration para criar a tabela precisa ser executada",
      });
    }

    res.status(500).json({
      error: "Failed to fetch leads",
      details: error.message,
    });
  }
});

// Buscar leads por campanha (admin only)
router.get("/campaign/:campaign", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { campaign } = req.params;
    
    const leads = await db
      .select()
      .from(campaignLeads)
      .where(eq(campaignLeads.campaign, campaign))
      .orderBy(desc(campaignLeads.createdAt));

    res.json({ 
      success: true, 
      leads,
      campaign 
    });
  } catch (error: any) {
    console.error("Error fetching campaign leads:", error);
    res.status(500).json({
      error: "Failed to fetch leads",
      details: error.message,
    });
  }
});

export default router;