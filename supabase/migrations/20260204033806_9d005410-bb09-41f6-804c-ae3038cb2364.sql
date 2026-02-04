
-- Delete old push subscriptions that are now incompatible with the new VAPID keys
-- Users will need to re-subscribe with the new keys
DELETE FROM user_push_subscriptions 
WHERE created_at < NOW() - INTERVAL '1 minute';
