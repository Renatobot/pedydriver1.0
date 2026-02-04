-- 1. Remove duplicate push subscriptions, keeping only the most recent one per endpoint
DELETE FROM user_push_subscriptions a
USING user_push_subscriptions b
WHERE a.created_at < b.created_at 
  AND a.endpoint = b.endpoint;

-- 2. Add UNIQUE constraint on endpoint to prevent future duplicates
ALTER TABLE user_push_subscriptions 
ADD CONSTRAINT user_push_subscriptions_endpoint_unique UNIQUE (endpoint);

-- 3. Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user_id ON user_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);