-- Migration: Update partner subscription plan prices (double the values)
-- Date: 2025-01-14
-- Description: Doubling the prices of all partner subscription plans as requested

-- Update the monthly prices of partner subscription plans
UPDATE partner_subscription_plans 
SET monthly_price = CASE 
    WHEN plan_type = 'free' THEN 0.00      -- Keep free plan at 0
    WHEN plan_type = 'basic' THEN 199.80   -- Was 99.90, now doubled
    WHEN plan_type = 'premium' THEN 599.80 -- Was 299.90, now doubled
    WHEN plan_type = 'ultra' THEN 1199.80  -- Was 599.90, now doubled
    ELSE monthly_price
END,
updated_at = NOW()
WHERE plan_type IN ('free', 'basic', 'premium', 'ultra');

-- Log the price update
INSERT INTO audit_logs (action, details, created_at)
VALUES ('partner_plan_prices_updated', '{"change": "doubled prices for all paid plans", "date": "2025-01-14"}', NOW());