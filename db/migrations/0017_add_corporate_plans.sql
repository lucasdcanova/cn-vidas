-- Migration: Add Corporate Plans Support
-- Date: 2025-01-15
-- Description: Adds support for corporate subscription plans with tiered pricing

-- 1. Add corporate fields to partners table
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_color_primary VARCHAR(7),
ADD COLUMN IF NOT EXISTS brand_color_secondary VARCHAR(7),
ADD COLUMN IF NOT EXISTS is_corporate BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS active_employees_count INTEGER DEFAULT 0;

-- 2. Add corporate partner reference to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS corporate_partner_id INTEGER REFERENCES partners(id),
ADD COLUMN IF NOT EXISTS is_corporate_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS corporate_plan_type VARCHAR(50);

-- 3. Create corporate subscription plans table
CREATE TABLE IF NOT EXISTS corporate_subscription_plans (
  id SERIAL PRIMARY KEY,
  plan_type VARCHAR(50) NOT NULL, -- 'basic_corp', 'premium_corp', 'ultra_corp'
  min_employees INTEGER NOT NULL,
  max_employees INTEGER, -- NULL for unlimited
  monthly_price_per_employee DECIMAL(10, 2) NOT NULL,
  features JSON DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Insert corporate plan tiers
INSERT INTO corporate_subscription_plans (plan_type, min_employees, max_employees, monthly_price_per_employee) VALUES
-- Basic Corporate
('basic_corp', 5, 50, 74.90),
('basic_corp', 51, 200, 69.90),
('basic_corp', 201, NULL, 64.90),
-- Premium Corporate
('premium_corp', 5, 50, 109.90),
('premium_corp', 51, 200, 99.90),
('premium_corp', 201, NULL, 89.90),
-- Ultra Corporate
('ultra_corp', 5, 50, 149.90),
('ultra_corp', 51, 200, 139.90),
('ultra_corp', 201, NULL, 129.90);

-- 5. Create corporate subscriptions table
CREATE TABLE IF NOT EXISTS corporate_subscriptions (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL,
  employee_tier VARCHAR(20) NOT NULL, -- '5-50', '51-200', '201+'
  monthly_price_per_employee DECIMAL(10, 2) NOT NULL,
  billing_period VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'semiannual', 'annual'
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  current_billing_date DATE,
  next_billing_date DATE,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create corporate invitations table
CREATE TABLE IF NOT EXISTS corporate_invitations (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Create corporate employees table (tracks active employees)
CREATE TABLE IF NOT EXISTS corporate_employees (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'removed'
  added_at TIMESTAMP DEFAULT NOW(),
  removed_at TIMESTAMP,
  last_active_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(partner_id, user_id)
);

-- 8. Create corporate usage reports table
CREATE TABLE IF NOT EXISTS corporate_usage_reports (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  report_month DATE NOT NULL,
  total_employees INTEGER DEFAULT 0,
  total_consultations INTEGER DEFAULT 0,
  total_emergency_consultations INTEGER DEFAULT 0,
  total_claims INTEGER DEFAULT 0,
  total_sick_days INTEGER DEFAULT 0,
  report_data JSON DEFAULT '{}',
  generated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Create medical certificates table for corporate reports
CREATE TABLE IF NOT EXISTS medical_certificates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id),
  doctor_id INTEGER NOT NULL REFERENCES doctors(id),
  corporate_partner_id INTEGER REFERENCES partners(id),
  certificate_number VARCHAR(100) UNIQUE,
  sick_days INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cid_code VARCHAR(10),
  diagnosis_description TEXT,
  issued_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Update partner_subscription_plans to support corporate plans
DELETE FROM partner_subscription_plans WHERE plan_type IN ('basic', 'premium', 'ultra', 'free');

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_corporate_employees_partner_id ON corporate_employees(partner_id);
CREATE INDEX IF NOT EXISTS idx_corporate_employees_user_id ON corporate_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_corporate_invitations_token ON corporate_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_corporate_invitations_partner_id ON corporate_invitations(partner_id);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_user_id ON medical_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_certificates_corporate_partner_id ON medical_certificates(corporate_partner_id);

-- 12. Create function to update employee count
CREATE OR REPLACE FUNCTION update_corporate_employee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE partners 
    SET active_employees_count = (
      SELECT COUNT(*) 
      FROM corporate_employees 
      WHERE partner_id = NEW.partner_id AND status = 'active'
    )
    WHERE id = NEW.partner_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE partners 
    SET active_employees_count = (
      SELECT COUNT(*) 
      FROM corporate_employees 
      WHERE partner_id = OLD.partner_id AND status = 'active'
    )
    WHERE id = OLD.partner_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 13. Create triggers
DROP TRIGGER IF EXISTS update_corporate_employee_count_trigger ON corporate_employees;
CREATE TRIGGER update_corporate_employee_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON corporate_employees
FOR EACH ROW
EXECUTE FUNCTION update_corporate_employee_count();

-- 14. Remove existing non-corporate collaborators
DELETE FROM partner_collaborators;

-- 15. Add comment for documentation
COMMENT ON TABLE corporate_subscription_plans IS 'Stores corporate plan tiers with per-employee pricing based on company size';
COMMENT ON TABLE corporate_subscriptions IS 'Active corporate subscriptions with billing information';
COMMENT ON TABLE corporate_employees IS 'Tracks employees added by corporate partners';
COMMENT ON TABLE corporate_invitations IS 'Manages email invitations for corporate employees';
COMMENT ON TABLE medical_certificates IS 'Stores medical certificates for corporate reporting';