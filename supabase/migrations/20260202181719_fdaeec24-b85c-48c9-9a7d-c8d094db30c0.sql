-- Create referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_id UUID,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  referrer_device_fingerprint TEXT NOT NULL,
  referred_device_fingerprint TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create device_fingerprints table
CREATE TABLE public.device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, fingerprint)
);

-- Create index for faster lookups
CREATE INDEX idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX idx_device_fingerprints_fingerprint ON public.device_fingerprints(fingerprint);
CREATE INDEX idx_device_fingerprints_user_id ON public.device_fingerprints(user_id);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view own referrals as referrer"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view own referrals as referred"
ON public.referrals FOR SELECT
USING (auth.uid() = referred_id);

CREATE POLICY "Users can insert own referrals"
ON public.referrals FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

-- RLS policies for device_fingerprints
CREATE POLICY "Users can view own fingerprints"
ON public.device_fingerprints FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fingerprints"
ON public.device_fingerprints FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to get or create user's referral code
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(_device_fingerprint TEXT)
RETURNS TABLE(referral_code TEXT, total_referrals INTEGER, pending_referrals INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_code TEXT;
  v_attempts INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has a referral entry
  SELECT r.referral_code INTO v_code
  FROM public.referrals r
  WHERE r.referrer_id = v_user_id
  LIMIT 1;

  -- If no code exists, create one
  IF v_code IS NULL THEN
    LOOP
      v_code := public.generate_referral_code();
      v_attempts := v_attempts + 1;
      
      -- Check if code already exists
      IF NOT EXISTS (SELECT 1 FROM public.referrals WHERE referrals.referral_code = v_code) THEN
        -- Insert the new referral entry
        INSERT INTO public.referrals (referrer_id, referral_code, referrer_device_fingerprint, status)
        VALUES (v_user_id, v_code, _device_fingerprint, 'active');
        EXIT;
      END IF;
      
      IF v_attempts > 10 THEN
        RAISE EXCEPTION 'Could not generate unique code';
      END IF;
    END LOOP;
  END IF;

  -- Store device fingerprint
  INSERT INTO public.device_fingerprints (user_id, fingerprint)
  VALUES (v_user_id, _device_fingerprint)
  ON CONFLICT (user_id, fingerprint) DO NOTHING;

  RETURN QUERY
  SELECT 
    v_code,
    (SELECT COUNT(*)::INTEGER FROM public.referrals WHERE referrer_id = v_user_id AND status = 'completed'),
    (SELECT COUNT(*)::INTEGER FROM public.referrals WHERE referrer_id = v_user_id AND status = 'pending' AND referred_id IS NOT NULL);
END;
$$;

-- Function to validate and complete referral
CREATE OR REPLACE FUNCTION public.validate_referral(
  _referral_code TEXT,
  _device_fingerprint TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referred_id UUID := auth.uid();
  v_referrer_id UUID;
  v_referrer_fingerprint TEXT;
  v_referral_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF v_referred_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Find the referral by code
  SELECT r.id, r.referrer_id, r.referrer_device_fingerprint
  INTO v_referral_id, v_referrer_id, v_referrer_fingerprint
  FROM public.referrals r
  WHERE r.referral_code = upper(_referral_code)
    AND r.status = 'active'
  LIMIT 1;

  IF v_referral_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'invalid_code');
  END IF;

  -- Check if referring self
  IF v_referrer_id = v_referred_id THEN
    RETURN json_build_object('success', false, 'error', 'self_referral');
  END IF;

  -- Check if device fingerprint matches referrer's (fraud detection)
  IF v_referrer_fingerprint = _device_fingerprint THEN
    -- Create rejected referral record
    INSERT INTO public.referrals (referrer_id, referred_id, referral_code, status, referrer_device_fingerprint, referred_device_fingerprint, rejection_reason)
    VALUES (v_referrer_id, v_referred_id, public.generate_referral_code(), 'rejected', v_referrer_fingerprint, _device_fingerprint, 'same_device');
    
    RETURN json_build_object('success', false, 'error', 'same_device');
  END IF;

  -- Check if device was already used for another referral
  IF EXISTS (
    SELECT 1 FROM public.device_fingerprints 
    WHERE fingerprint = _device_fingerprint 
    AND user_id != v_referred_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'device_already_used');
  END IF;

  -- Check if user was already referred
  IF EXISTS (
    SELECT 1 FROM public.referrals 
    WHERE referred_id = v_referred_id 
    AND status = 'completed'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'already_referred');
  END IF;

  -- Store referred user's fingerprint
  INSERT INTO public.device_fingerprints (user_id, fingerprint)
  VALUES (v_referred_id, _device_fingerprint)
  ON CONFLICT (user_id, fingerprint) DO NOTHING;

  -- Create new completed referral entry
  INSERT INTO public.referrals (
    referrer_id, 
    referred_id, 
    referral_code, 
    status, 
    referrer_device_fingerprint, 
    referred_device_fingerprint,
    completed_at
  )
  VALUES (
    v_referrer_id, 
    v_referred_id, 
    public.generate_referral_code(), 
    'completed', 
    v_referrer_fingerprint, 
    _device_fingerprint,
    now()
  );

  -- Apply 7 days PRO to referred user
  SELECT GREATEST(COALESCE(s.expires_at, now()), now()) + interval '7 days'
  INTO v_expires_at
  FROM public.subscriptions s
  WHERE s.user_id = v_referred_id;

  UPDATE public.subscriptions
  SET 
    plan = 'pro',
    status = 'active',
    expires_at = v_expires_at,
    updated_at = now()
  WHERE user_id = v_referred_id;

  -- Apply 7 days PRO to referrer (accumulates)
  SELECT GREATEST(COALESCE(s.expires_at, now()), now()) + interval '7 days'
  INTO v_expires_at
  FROM public.subscriptions s
  WHERE s.user_id = v_referrer_id;

  UPDATE public.subscriptions
  SET 
    plan = 'pro',
    status = 'active',
    expires_at = v_expires_at,
    updated_at = now()
  WHERE user_id = v_referrer_id;

  -- Create notification for referrer
  INSERT INTO public.user_notifications (user_id, type, title, message)
  VALUES (
    v_referrer_id,
    'referral_success',
    '🎉 Indicação Confirmada!',
    'Seu amigo se cadastrou! Você ganhou +7 dias de PRO grátis.'
  );

  -- Create notification for referred
  INSERT INTO public.user_notifications (user_id, type, title, message)
  VALUES (
    v_referred_id,
    'referral_bonus',
    '🎁 Bônus de Indicação!',
    'Você foi indicado por um amigo! Ganhou 7 dias de PRO grátis.'
  );

  RETURN json_build_object('success', true, 'bonus_days', 7);
END;
$$;

-- Function to get referral stats for a user
CREATE OR REPLACE FUNCTION public.get_referral_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'not_authenticated');
  END IF;

  RETURN json_build_object(
    'total_referrals', (SELECT COUNT(*) FROM public.referrals WHERE referrer_id = v_user_id AND status = 'completed'),
    'pending_referrals', (SELECT COUNT(*) FROM public.referrals WHERE referrer_id = v_user_id AND referred_id IS NOT NULL AND status = 'pending'),
    'bonus_days_earned', (SELECT COUNT(*) * 7 FROM public.referrals WHERE referrer_id = v_user_id AND status = 'completed'),
    'was_referred', EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = v_user_id AND status = 'completed')
  );
END;
$$;