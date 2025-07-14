-- Migration: Add Partner B2B Tables
-- Description: Adds support for partner enterprise plans and collaborator management

-- 1. Partner subscription plans (for enterprise partners)
CREATE TABLE IF NOT EXISTS partner_subscription_plans (
  id SERIAL PRIMARY KEY,
  plan_name VARCHAR(50) NOT NULL,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('basic', 'premium', 'ultra', 'free')),
  monthly_price DECIMAL(10, 2) NOT NULL,
  max_collaborators INTEGER,
  features JSONB DEFAULT '{}',
  commission_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage commission on services
  priority_support BOOLEAN DEFAULT FALSE,
  custom_branding BOOLEAN DEFAULT FALSE,
  analytics_access BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Partner subscriptions (active subscriptions)
CREATE TABLE IF NOT EXISTS partner_subscriptions (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES partner_subscription_plans(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'suspended', 'trial')),
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP,
  next_billing_date DATE,
  payment_method_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Partner collaborators
CREATE TABLE IF NOT EXISTS partner_collaborators (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'collaborator' CHECK (role IN ('admin', 'manager', 'collaborator')),
  department VARCHAR(100),
  permissions JSONB DEFAULT '{}',
  can_manage_services BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  can_manage_collaborators BOOLEAN DEFAULT FALSE,
  can_access_billing BOOLEAN DEFAULT FALSE,
  invitation_token VARCHAR(255) UNIQUE,
  invitation_sent_at TIMESTAMP,
  invitation_accepted_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partner_id, user_id)
);

-- 4. Partner billing history
CREATE TABLE IF NOT EXISTS partner_billing_history (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES partner_subscriptions(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  stripe_payment_intent_id VARCHAR(255),
  invoice_number VARCHAR(50) UNIQUE,
  invoice_url TEXT,
  paid_at TIMESTAMP,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Add enterprise fields to partners table
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS is_enterprise BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_document VARCHAR(20), -- CNPJ
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_address JSONB,
ADD COLUMN IF NOT EXISTS collaborator_count INTEGER DEFAULT 0;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_subscriptions_partner_id ON partner_subscriptions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_collaborators_partner_id ON partner_collaborators(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_collaborators_user_id ON partner_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_collaborators_invitation_token ON partner_collaborators(invitation_token);
CREATE INDEX IF NOT EXISTS idx_partner_billing_partner_id ON partner_billing_history(partner_id);

-- 7. Insert default partner subscription plans
INSERT INTO partner_subscription_plans (plan_name, plan_type, monthly_price, max_collaborators, features, commission_rate, priority_support, custom_branding, analytics_access, api_access) VALUES
('Gratuito', 'free', 0.00, 1, '{"services_limit": 5, "monthly_bookings": 20}', 30.00, FALSE, FALSE, FALSE, FALSE),
('Básico', 'basic', 99.90, 5, '{"services_limit": 20, "monthly_bookings": 100}', 25.00, FALSE, FALSE, TRUE, FALSE),
('Premium', 'premium', 299.90, 20, '{"services_limit": 50, "monthly_bookings": 500}', 20.00, TRUE, TRUE, TRUE, FALSE),
('Ultra', 'ultra', 599.90, NULL, '{"services_limit": null, "monthly_bookings": null}', 15.00, TRUE, TRUE, TRUE, TRUE);

-- 8. Create function to update collaborator count
CREATE OR REPLACE FUNCTION update_partner_collaborator_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE partners 
    SET collaborator_count = collaborator_count + 1 
    WHERE id = NEW.partner_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE partners 
    SET collaborator_count = GREATEST(collaborator_count - 1, 0) 
    WHERE id = OLD.partner_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Create triggers for collaborator count
DROP TRIGGER IF EXISTS update_partner_collaborator_count_insert ON partner_collaborators;
CREATE TRIGGER update_partner_collaborator_count_insert
AFTER INSERT ON partner_collaborators
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION update_partner_collaborator_count();

DROP TRIGGER IF EXISTS update_partner_collaborator_count_delete ON partner_collaborators;
CREATE TRIGGER update_partner_collaborator_count_delete
AFTER DELETE ON partner_collaborators
FOR EACH ROW
WHEN (OLD.status = 'active')
EXECUTE FUNCTION update_partner_collaborator_count();

-- 10. Create view for partner subscription details
CREATE OR REPLACE VIEW partner_subscription_details AS
SELECT 
  p.id AS partner_id,
  p.business_name AS partner_name,
  u.email AS partner_email,
  p.is_enterprise,
  p.company_name,
  p.collaborator_count,
  ps.id AS subscription_id,
  ps.status AS subscription_status,
  ps.start_date,
  ps.next_billing_date,
  psp.plan_name,
  psp.plan_type,
  psp.monthly_price,
  psp.max_collaborators,
  psp.commission_rate,
  psp.features
FROM partners p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN partner_subscriptions ps ON p.id = ps.partner_id AND ps.status = 'active'
LEFT JOIN partner_subscription_plans psp ON ps.plan_id = psp.id;

-- 11. Add RLS policies for security
ALTER TABLE partner_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_billing_history ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can only see their own subscriptions
CREATE POLICY partner_subscriptions_policy ON partner_subscriptions
FOR ALL USING (
  partner_id IN (
    SELECT id FROM partners WHERE user_id = current_setting('app.user_id')::INTEGER
  )
);

-- Policy: Partners can only see their own collaborators
CREATE POLICY partner_collaborators_policy ON partner_collaborators
FOR ALL USING (
  partner_id IN (
    SELECT id FROM partners WHERE user_id = current_setting('app.user_id')::INTEGER
  )
);

-- Policy: Partners can only see their own billing history
CREATE POLICY partner_billing_history_policy ON partner_billing_history
FOR ALL USING (
  partner_id IN (
    SELECT id FROM partners WHERE user_id = current_setting('app.user_id')::INTEGER
  )
);