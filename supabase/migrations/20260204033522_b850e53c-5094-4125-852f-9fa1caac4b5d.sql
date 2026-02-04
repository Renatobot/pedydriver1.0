
-- Drop and recreate the function with correct timezone handling
CREATE OR REPLACE FUNCTION public.get_users_due_for_reminder()
RETURNS TABLE(
  user_id uuid,
  reminder_time time,
  endpoint text,
  p256dh text,
  auth text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_time_utc timestamptz := NOW();
BEGIN
  RETURN QUERY
  SELECT 
    r.user_id,
    r.reminder_time,
    p.endpoint,
    p.p256dh,
    p.auth
  FROM user_reminder_settings r
  INNER JOIN user_push_subscriptions p ON r.user_id = p.user_id
  WHERE r.enabled = true
    AND (r.last_sent_at IS NULL OR r.last_sent_at::date < (current_time_utc AT TIME ZONE r.timezone)::date)
    AND (
      -- Check if current time in user's timezone matches reminder time (within 5 min window)
      (current_time_utc AT TIME ZONE r.timezone)::time >= r.reminder_time
      AND (current_time_utc AT TIME ZONE r.timezone)::time < r.reminder_time + INTERVAL '5 minutes'
    );
END;
$$;
