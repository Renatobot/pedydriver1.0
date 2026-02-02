-- Create table to track payment intents (link user to payment before it happens)
CREATE TABLE public.payment_intents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' or 'annual'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'expired'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour'),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

-- Users can create their own payment intents
CREATE POLICY "Users can insert own payment intents"
ON public.payment_intents FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own payment intents
CREATE POLICY "Users can view own payment intents"
ON public.payment_intents FOR SELECT
USING (auth.uid() = user_id);

-- Index for quick lookup by recent pending intents
CREATE INDEX idx_payment_intents_pending ON public.payment_intents (user_email, status, created_at DESC)
WHERE status = 'pending';