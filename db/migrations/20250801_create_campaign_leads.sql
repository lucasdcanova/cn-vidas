-- Create campaign_leads table
CREATE TABLE IF NOT EXISTS campaign_leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  campaign VARCHAR(100) NOT NULL DEFAULT 'taquari-hospital-sao-jose',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index on campaign for faster filtering
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign ON campaign_leads(campaign);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_campaign_leads_created_at ON campaign_leads(created_at DESC);