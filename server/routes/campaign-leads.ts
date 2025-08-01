import { Router } from "express";
import { db } from "../db.js";
import { campaignLeads, insertCampaignLeadSchema } from "../../shared/schema.js";
import { requireAdmin } from "../middleware/auth";
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
router.get("/", requireAdmin, async (req, res) => {
  try {
    const leads = await db
      .select()
      .from(campaignLeads)
      .orderBy(desc(campaignLeads.createdAt));

    res.json({ 
      success: true, 
      leads 
    });
  } catch (error: any) {
    console.error("Error fetching campaign leads:", error);
    res.status(500).json({
      error: "Failed to fetch leads",
      details: error.message,
    });
  }
});

// Buscar leads por campanha (admin only)
router.get("/campaign/:campaign", requireAdmin, async (req, res) => {
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