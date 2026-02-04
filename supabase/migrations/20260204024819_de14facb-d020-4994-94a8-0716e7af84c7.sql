-- Create table for user push subscriptions
CREATE TABLE public.user_push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own push subscriptions
CREATE POLICY "Users can view their own push subscriptions"
ON public.user_push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
ON public.user_push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
ON public.user_push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Create table for reminder settings
CREATE TABLE public.user_reminder_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_time TIME NOT NULL DEFAULT '20:00',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  last_sent_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_reminder_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own reminder settings
CREATE POLICY "Users can view their own reminder settings"
ON public.user_reminder_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminder settings"
ON public.user_reminder_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminder settings"
ON public.user_reminder_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to get users who need reminders NOW
CREATE OR REPLACE FUNCTION public.get_users_due_for_reminder()
RETURNS TABLE (
  user_id UUID,
  reminder_time TIME,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    AND (r.last_sent_at IS NULL OR r.last_sent_at < CURRENT_DATE)
    AND (
      -- Check if current time in user's timezone matches reminder time (within 5 min window)
      (CURRENT_TIME AT TIME ZONE r.timezone) >= r.reminder_time
      AND (CURRENT_TIME AT TIME ZONE r.timezone) < r.reminder_time + INTERVAL '5 minutes'
    );
END;
$$;

-- Function to mark reminder as sent for today
CREATE OR REPLACE FUNCTION public.mark_reminder_sent(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_reminder_settings
  SET last_sent_at = CURRENT_DATE, updated_at = now()
  WHERE user_id = target_user_id;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_user_reminder_settings_updated_at
BEFORE UPDATE ON public.user_reminder_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();