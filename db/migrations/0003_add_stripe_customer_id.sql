-- Add stripeCustomerId to partners table
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;