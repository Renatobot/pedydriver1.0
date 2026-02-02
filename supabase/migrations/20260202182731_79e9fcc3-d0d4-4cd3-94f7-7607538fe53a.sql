-- Function to register a pending referral (called after signup)
CREATE OR REPLACE FUNCTION public.register_pending_referral(
  _referral_code TEXT,
  _device_fingerprint TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_fingerprint TEXT;
  v_existing_referral RECORD;
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Get referrer info
  SELECT referrer_id, referrer_device_fingerprint
  INTO v_referrer_id, v_referrer_fingerprint
  FROM referrals
  WHERE referral_code = _referral_code
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'invalid_code');
  END IF;

  -- Check self-referral
  IF v_referrer_id = v_current_user_id THEN
    RETURN json_build_object('success', false, 'error', 'self_referral');
  END IF;

  -- Check same device
  IF v_referrer_fingerprint = _device_fingerprint THEN
    RETURN json_build_object('success', false, 'error', 'same_device');
  END IF;

  -- Check if device was already used for referral
  SELECT * INTO v_existing_referral
  FROM referrals
  WHERE referred_device_fingerprint = _device_fingerprint
    AND status IN ('pending', 'completed')
  LIMIT 1;

  IF v_existing_referral.id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'device_already_used');
  END IF;

  -- Check if user was already referred
  SELECT * INTO v_existing_referral
  FROM referrals
  WHERE referred_id = v_current_user_id
    AND status IN ('pending', 'completed')
  LIMIT 1;

  IF v_existing_referral.id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'already_referred');
  END IF;

  -- Register as pending (don't grant bonus yet)
  UPDATE referrals
  SET 
    referred_id = v_current_user_id,
    referred_device_fingerprint = _device_fingerprint,
    status = 'pending'
  WHERE referral_code = _referral_code
    AND referrer_id = v_referrer_id
    AND referred_id IS NULL;

  -- If no row was updated, create a new pending referral record
  IF NOT FOUND THEN
    INSERT INTO referrals (
      referrer_id, 
      referred_id, 
      referral_code, 
      status, 
      referrer_device_fingerprint,
      referred_device_fingerprint
    )
    SELECT 
      v_referrer_id,
      v_current_user_id,
      _referral_code,
      'pending',
      v_referrer_fingerprint,
      _device_fingerprint;
  END IF;

  -- Store device fingerprint for the referred user
  INSERT INTO device_fingerprints (user_id, fingerprint)
  VALUES (v_current_user_id, _device_fingerprint)
  ON CONFLICT (user_id, fingerprint) DO NOTHING;

  RETURN json_build_object('success', true, 'status', 'pending');
END;
$$;

-- Function to check and validate pending referrals
CREATE OR REPLACE FUNCTION public.check_pending_referrals()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_pending_referral RECORD;
  v_account_age INTERVAL;
  v_criteria_met INTEGER := 0;
  v_has_vehicle BOOLEAN := false;
  v_has_earnings BOOLEAN := false;
  v_has_expenses BOOLEAN := false;
  v_has_shifts BOOLEAN := false;
  v_bonus_days INTEGER := 7;
  v_new_expiry TIMESTAMPTZ;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Find pending referral where current user is the referred
  SELECT r.*, p.created_at as user_created_at
  INTO v_pending_referral
  FROM referrals r
  JOIN profiles p ON p.user_id = r.referred_id
  WHERE r.referred_id = v_current_user_id
    AND r.status = 'pending'
  LIMIT 1;

  IF v_pending_referral.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_pending_referral');
  END IF;

  -- Check account age (must be at least 24 hours)
  v_account_age := NOW() - v_pending_referral.user_created_at;
  
  IF v_account_age < INTERVAL '24 hours' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'too_soon',
      'hours_remaining', EXTRACT(EPOCH FROM (INTERVAL '24 hours' - v_account_age)) / 3600
    );
  END IF;

  -- Check criteria 1: Vehicle type changed from default
  SELECT EXISTS(
    SELECT 1 FROM user_settings 
    WHERE user_id = v_current_user_id 
      AND vehicle_type != 'carro'
  ) INTO v_has_vehicle;
  
  IF v_has_vehicle THEN
    v_criteria_met := v_criteria_met + 1;
  END IF;

  -- Check criteria 2: Has at least 1 earning
  SELECT EXISTS(
    SELECT 1 FROM earnings 
    WHERE user_id = v_current_user_id
  ) INTO v_has_earnings;
  
  IF v_has_earnings THEN
    v_criteria_met := v_criteria_met + 1;
  END IF;

  -- Check criteria 3: Has at least 1 expense
  SELECT EXISTS(
    SELECT 1 FROM expenses 
    WHERE user_id = v_current_user_id
  ) INTO v_has_expenses;
  
  IF v_has_expenses THEN
    v_criteria_met := v_criteria_met + 1;
  END IF;

  -- Check criteria 4: Has at least 1 shift
  SELECT EXISTS(
    SELECT 1 FROM shifts 
    WHERE user_id = v_current_user_id
  ) INTO v_has_shifts;
  
  IF v_has_shifts THEN
    v_criteria_met := v_criteria_met + 1;
  END IF;

  -- Need at least 2 criteria met
  IF v_criteria_met < 2 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'criteria_not_met',
      'criteria_met', v_criteria_met,
      'has_vehicle', v_has_vehicle,
      'has_earnings', v_has_earnings,
      'has_expenses', v_has_expenses,
      'has_shifts', v_has_shifts
    );
  END IF;

  -- All checks passed! Complete the referral
  UPDATE referrals
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = v_pending_referral.id;

  -- Grant bonus to referred user
  v_new_expiry := GREATEST(
    COALESCE((SELECT expires_at FROM subscriptions WHERE user_id = v_current_user_id), NOW()),
    NOW()
  ) + (v_bonus_days || ' days')::INTERVAL;

  UPDATE subscriptions
  SET 
    plan = 'pro',
    status = 'active',
    expires_at = v_new_expiry,
    updated_at = NOW()
  WHERE user_id = v_current_user_id;

  -- Grant bonus to referrer
  v_new_expiry := GREATEST(
    COALESCE((SELECT expires_at FROM subscriptions WHERE user_id = v_pending_referral.referrer_id), NOW()),
    NOW()
  ) + (v_bonus_days || ' days')::INTERVAL;

  UPDATE subscriptions
  SET 
    plan = 'pro',
    status = 'active',
    expires_at = v_new_expiry,
    updated_at = NOW()
  WHERE user_id = v_pending_referral.referrer_id;

  -- Create notifications for both users
  INSERT INTO user_notifications (user_id, type, title, message)
  VALUES 
    (v_current_user_id, 'referral', 'Indicação Confirmada! 🎉', 'Você ganhou 7 dias de PRO grátis!'),
    (v_pending_referral.referrer_id, 'referral', 'Indicação Confirmada! 🎉', 'Seu amigo ativou a indicação. Você ganhou 7 dias de PRO grátis!');

  RETURN json_build_object(
    'success', true, 
    'bonus_days', v_bonus_days,
    'referrer_id', v_pending_referral.referrer_id
  );
END;
$$;

-- Function to get referral progress for the current user
CREATE OR REPLACE FUNCTION public.get_referral_progress()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_pending_referral RECORD;
  v_account_age INTERVAL;
  v_has_vehicle BOOLEAN := false;
  v_has_earnings BOOLEAN := false;
  v_has_expenses BOOLEAN := false;
  v_has_shifts BOOLEAN := false;
  v_criteria_met INTEGER := 0;
  v_account_age_hours NUMERIC;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN json_build_object('has_pending', false);
  END IF;

  -- Find pending referral
  SELECT r.*, p.created_at as user_created_at
  INTO v_pending_referral
  FROM referrals r
  JOIN profiles p ON p.user_id = r.referred_id
  WHERE r.referred_id = v_current_user_id
    AND r.status = 'pending'
  LIMIT 1;

  IF v_pending_referral.id IS NULL THEN
    RETURN json_build_object('has_pending', false);
  END IF;

  v_account_age := NOW() - v_pending_referral.user_created_at;
  v_account_age_hours := EXTRACT(EPOCH FROM v_account_age) / 3600;

  -- Check each criteria
  SELECT EXISTS(
    SELECT 1 FROM user_settings 
    WHERE user_id = v_current_user_id 
      AND vehicle_type != 'carro'
  ) INTO v_has_vehicle;

  SELECT EXISTS(
    SELECT 1 FROM earnings WHERE user_id = v_current_user_id
  ) INTO v_has_earnings;

  SELECT EXISTS(
    SELECT 1 FROM expenses WHERE user_id = v_current_user_id
  ) INTO v_has_expenses;

  SELECT EXISTS(
    SELECT 1 FROM shifts WHERE user_id = v_current_user_id
  ) INTO v_has_shifts;

  IF v_has_vehicle THEN v_criteria_met := v_criteria_met + 1; END IF;
  IF v_has_earnings THEN v_criteria_met := v_criteria_met + 1; END IF;
  IF v_has_expenses THEN v_criteria_met := v_criteria_met + 1; END IF;
  IF v_has_shifts THEN v_criteria_met := v_criteria_met + 1; END IF;

  RETURN json_build_object(
    'has_pending', true,
    'account_age_hours', v_account_age_hours,
    'hours_until_eligible', GREATEST(0, 24 - v_account_age_hours),
    'criteria_met', v_criteria_met,
    'criteria_needed', 2,
    'has_vehicle', v_has_vehicle,
    'has_earnings', v_has_earnings,
    'has_expenses', v_has_expenses,
    'has_shifts', v_has_shifts,
    'is_eligible', v_account_age_hours >= 24 AND v_criteria_met >= 2
  );
END;
$$;

-- Update get_referral_stats to include pending count
CREATE OR REPLACE FUNCTION public.get_referral_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_total_referrals INTEGER;
  v_pending_referrals INTEGER;
  v_bonus_days INTEGER;
  v_was_referred BOOLEAN;
  v_account_age_hours NUMERIC;
  v_can_show_referral_card BOOLEAN;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Count completed referrals
  SELECT COUNT(*) INTO v_total_referrals
  FROM referrals
  WHERE referrer_id = v_current_user_id
    AND status = 'completed';

  -- Count pending referrals
  SELECT COUNT(*) INTO v_pending_referrals
  FROM referrals
  WHERE referrer_id = v_current_user_id
    AND status = 'pending';

  -- Calculate bonus days (7 per completed referral)
  v_bonus_days := v_total_referrals * 7;

  -- Check if current user was referred
  SELECT EXISTS(
    SELECT 1 FROM referrals
    WHERE referred_id = v_current_user_id
      AND status = 'completed'
  ) INTO v_was_referred;

  -- Check account age
  SELECT EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600
  INTO v_account_age_hours
  FROM profiles p
  WHERE p.user_id = v_current_user_id;

  -- Can show referral card if account > 48h OR has successful referrals
  v_can_show_referral_card := v_account_age_hours >= 48 OR v_total_referrals > 0;

  RETURN json_build_object(
    'total_referrals', v_total_referrals,
    'pending_referrals', v_pending_referrals,
    'bonus_days_earned', v_bonus_days,
    'was_referred', v_was_referred,
    'account_age_hours', COALESCE(v_account_age_hours, 0),
    'can_show_referral_card', v_can_show_referral_card
  );
END;
$$;