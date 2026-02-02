-- Add weekly goals columns to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS weekly_goal_earnings numeric NOT NULL DEFAULT 1500,
ADD COLUMN IF NOT EXISTS weekly_goal_services integer NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS weekly_goal_km numeric NOT NULL DEFAULT 300,
ADD COLUMN IF NOT EXISTS weekly_goal_hours numeric NOT NULL DEFAULT 40;