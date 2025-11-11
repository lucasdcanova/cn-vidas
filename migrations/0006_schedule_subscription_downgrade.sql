-- Ensure user_subscriptions supports scheduling downgrades
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS scheduled_plan_id INTEGER REFERENCES subscription_plans(id);

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS scheduled_plan_applied BOOLEAN DEFAULT FALSE;
