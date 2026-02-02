-- 1. Adicionar coluna bonus_applied na tabela referrals
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS bonus_applied BOOLEAN DEFAULT true;

-- 2. Atualizar função get_referral_stats para retornar dias restantes
CREATE OR REPLACE FUNCTION public.get_referral_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total_referrals INTEGER;
  v_pending_referrals INTEGER;
  v_bonus_days_earned INTEGER;
  v_was_referred BOOLEAN;
  v_account_age_hours NUMERIC;
  v_can_show_referral_card BOOLEAN;
  v_days_remaining NUMERIC;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'not_authenticated');
  END IF;

  -- Contar indicações completadas (onde o usuário é o referrer)
  SELECT COUNT(*) INTO v_total_referrals
  FROM referrals
  WHERE referrer_id = v_user_id AND status = 'completed';

  -- Contar indicações pendentes
  SELECT COUNT(*) INTO v_pending_referrals
  FROM referrals
  WHERE referrer_id = v_user_id AND status = 'pending';

  -- Calcular dias ganhos (7 dias por indicação completada com bonus aplicado)
  SELECT COALESCE(COUNT(*) * 7, 0) INTO v_bonus_days_earned
  FROM referrals
  WHERE referrer_id = v_user_id 
    AND status = 'completed'
    AND COALESCE(bonus_applied, true) = true;

  -- Verificar se foi indicado por alguém
  SELECT EXISTS(
    SELECT 1 FROM referrals
    WHERE referred_id = v_user_id AND status IN ('pending', 'completed')
  ) INTO v_was_referred;

  -- Calcular idade da conta em horas
  SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600
  INTO v_account_age_hours
  FROM auth.users
  WHERE id = v_user_id;

  -- Pode mostrar o card se conta tem > 48h OU se já fez indicações com sucesso
  v_can_show_referral_card := v_account_age_hours >= 48 OR v_total_referrals > 0;

  -- Buscar data de expiração da subscription
  SELECT expires_at INTO v_expires_at
  FROM subscriptions
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calcular dias restantes
  IF v_expires_at IS NOT NULL AND v_expires_at > NOW() THEN
    v_days_remaining := EXTRACT(EPOCH FROM (v_expires_at - NOW())) / 86400;
  ELSE
    v_days_remaining := 0;
  END IF;

  RETURN json_build_object(
    'total_referrals', v_total_referrals,
    'pending_referrals', v_pending_referrals,
    'bonus_days_earned', v_bonus_days_earned,
    'was_referred', v_was_referred,
    'account_age_hours', v_account_age_hours,
    'can_show_referral_card', v_can_show_referral_card,
    'days_remaining', FLOOR(COALESCE(v_days_remaining, 0))
  );
END;
$$;

-- 3. Atualizar função check_pending_referrals com limite de 90 dias
CREATE OR REPLACE FUNCTION public.check_pending_referrals()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_referral RECORD;
  v_referrer_sub RECORD;
  v_referred_sub RECORD;
  v_has_vehicle BOOLEAN;
  v_has_earnings BOOLEAN;
  v_has_expenses BOOLEAN;
  v_has_shifts BOOLEAN;
  v_criteria_met INTEGER := 0;
  v_criteria_needed INTEGER := 2;
  v_account_age_hours NUMERIC;
  v_referrer_days_remaining NUMERIC;
  v_apply_referrer_bonus BOOLEAN := true;
  v_bonus_days INTEGER := 7;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Buscar indicação pendente onde o usuário atual é o indicado
  SELECT * INTO v_referral
  FROM referrals
  WHERE referred_id = v_user_id AND status = 'pending'
  LIMIT 1;

  IF v_referral IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_pending_referral');
  END IF;

  -- Calcular idade da conta
  SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600
  INTO v_account_age_hours
  FROM auth.users
  WHERE id = v_user_id;

  -- Verificar critérios de uso
  SELECT EXISTS(SELECT 1 FROM user_settings WHERE user_id = v_user_id AND vehicle_type IS NOT NULL) INTO v_has_vehicle;
  SELECT EXISTS(SELECT 1 FROM earnings WHERE user_id = v_user_id LIMIT 1) INTO v_has_earnings;
  SELECT EXISTS(SELECT 1 FROM expenses WHERE user_id = v_user_id LIMIT 1) INTO v_has_expenses;
  SELECT EXISTS(SELECT 1 FROM shifts WHERE user_id = v_user_id LIMIT 1) INTO v_has_shifts;

  IF v_has_vehicle THEN v_criteria_met := v_criteria_met + 1; END IF;
  IF v_has_earnings THEN v_criteria_met := v_criteria_met + 1; END IF;
  IF v_has_expenses THEN v_criteria_met := v_criteria_met + 1; END IF;
  IF v_has_shifts THEN v_criteria_met := v_criteria_met + 1; END IF;

  -- Precisa de pelo menos 2 critérios E conta com mais de 24h
  IF v_criteria_met < v_criteria_needed OR v_account_age_hours < 24 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'criteria_not_met',
      'criteria_met', v_criteria_met,
      'criteria_needed', v_criteria_needed,
      'account_age_hours', v_account_age_hours
    );
  END IF;

  -- Verificar quantos dias o indicador já tem acumulados
  SELECT * INTO v_referrer_sub
  FROM subscriptions
  WHERE user_id = v_referral.referrer_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_referrer_sub.expires_at IS NOT NULL AND v_referrer_sub.expires_at > NOW() THEN
    v_referrer_days_remaining := EXTRACT(EPOCH FROM (v_referrer_sub.expires_at - NOW())) / 86400;
  ELSE
    v_referrer_days_remaining := 0;
  END IF;

  -- Se o indicador já tem 90+ dias, não aplica bônus para ele
  IF v_referrer_days_remaining >= 90 THEN
    v_apply_referrer_bonus := false;
  END IF;

  -- ===============================
  -- APLICAR BÔNUS AO INDICADO (sempre recebe)
  -- ===============================
  SELECT * INTO v_referred_sub
  FROM subscriptions
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_referred_sub IS NULL THEN
    INSERT INTO subscriptions (user_id, plan, status, expires_at)
    VALUES (v_user_id, 'pro', 'active', NOW() + INTERVAL '7 days');
  ELSE
    UPDATE subscriptions
    SET 
      plan = 'pro',
      status = 'active',
      expires_at = GREATEST(COALESCE(expires_at, NOW()), NOW()) + INTERVAL '7 days',
      updated_at = NOW()
    WHERE id = v_referred_sub.id;
  END IF;

  -- ===============================
  -- APLICAR BÔNUS AO INDICADOR (se não atingiu limite)
  -- ===============================
  IF v_apply_referrer_bonus THEN
    IF v_referrer_sub IS NULL THEN
      INSERT INTO subscriptions (user_id, plan, status, expires_at)
      VALUES (v_referral.referrer_id, 'pro', 'active', NOW() + INTERVAL '7 days');
    ELSE
      UPDATE subscriptions
      SET 
        plan = 'pro',
        status = 'active',
        expires_at = GREATEST(COALESCE(expires_at, NOW()), NOW()) + INTERVAL '7 days',
        updated_at = NOW()
      WHERE id = v_referrer_sub.id;
    END IF;

    -- Notificação normal para o indicador
    INSERT INTO user_notifications (user_id, type, title, message)
    VALUES (
      v_referral.referrer_id,
      'referral_bonus',
      '🎉 Indicação confirmada!',
      'Seu amigo ativou a indicação. +7 dias de PRO grátis!'
    );
  ELSE
    -- Notificação especial quando atingiu limite de 90 dias
    INSERT INTO user_notifications (user_id, type, title, message)
    VALUES (
      v_referral.referrer_id,
      'referral_bonus',
      '✅ Indicação confirmada!',
      'Continue indicando para manter seu PRO ativo sempre.'
    );
  END IF;

  -- Atualizar status da indicação
  UPDATE referrals
  SET 
    status = 'completed',
    completed_at = NOW(),
    bonus_applied = v_apply_referrer_bonus
  WHERE id = v_referral.id;

  -- Notificação para o indicado
  INSERT INTO user_notifications (user_id, type, title, message)
  VALUES (
    v_user_id,
    'referral_bonus',
    '🎉 Bônus de indicação ativado!',
    'Você ganhou 7 dias de PRO grátis por ser indicado!'
  );

  RETURN json_build_object(
    'success', true, 
    'bonus_days', v_bonus_days,
    'referrer_bonus_applied', v_apply_referrer_bonus
  );
END;
$$;