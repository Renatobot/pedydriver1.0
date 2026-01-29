-- Function to generate churn alerts for PRO users
-- This checks for:
-- 1. PRO users inactive for 7+ days
-- 2. PRO subscriptions expiring in 3 days
-- Should be called periodically (e.g., daily via cron or manually)

CREATE OR REPLACE FUNCTION public.generate_churn_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_user record;
  v_alert_exists boolean;
BEGIN
  -- Only admins can run this
  IF NOT public.is_admin() THEN
    RETURN 0;
  END IF;

  -- 1. Check for PRO users inactive for 7+ days
  FOR v_user IN (
    SELECT 
      p.user_id,
      p.full_name,
      u.email,
      p.last_login_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    JOIN public.subscriptions s ON s.user_id = p.user_id
    WHERE s.plan = 'pro' 
      AND s.status = 'active'
      AND p.last_login_at < now() - interval '7 days'
  )
  LOOP
    -- Check if alert already exists for this user in the last 7 days
    SELECT EXISTS (
      SELECT 1 FROM public.admin_alerts 
      WHERE user_id = v_user.user_id 
        AND event_type = 'churn_inactive_pro'
        AND created_at > now() - interval '7 days'
    ) INTO v_alert_exists;
    
    IF NOT v_alert_exists THEN
      INSERT INTO public.admin_alerts (
        event_type, 
        user_id, 
        user_name, 
        user_email, 
        message
      ) VALUES (
        'churn_inactive_pro',
        v_user.user_id,
        v_user.full_name,
        v_user.email,
        '⚠️ Possível churn: Usuário PRO sem atividade há 7 dias. Último acesso: ' || 
          COALESCE(to_char(v_user.last_login_at, 'DD/MM/YYYY'), 'nunca')
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  -- 2. Check for PRO subscriptions expiring in 3 days
  FOR v_user IN (
    SELECT 
      p.user_id,
      p.full_name,
      u.email,
      s.expires_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    JOIN public.subscriptions s ON s.user_id = p.user_id
    WHERE s.plan = 'pro' 
      AND s.status = 'active'
      AND s.expires_at IS NOT NULL
      AND s.expires_at BETWEEN now() AND now() + interval '3 days'
  )
  LOOP
    -- Check if alert already exists for this user regarding expiration
    SELECT EXISTS (
      SELECT 1 FROM public.admin_alerts 
      WHERE user_id = v_user.user_id 
        AND event_type = 'churn_expiring_pro'
        AND created_at > now() - interval '3 days'
    ) INTO v_alert_exists;
    
    IF NOT v_alert_exists THEN
      INSERT INTO public.admin_alerts (
        event_type, 
        user_id, 
        user_name, 
        user_email, 
        message
      ) VALUES (
        'churn_expiring_pro',
        v_user.user_id,
        v_user.full_name,
        v_user.email,
        '⏰ Plano PRO próximo do vencimento. Expira em: ' || 
          to_char(v_user.expires_at, 'DD/MM/YYYY')
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Function to manually create a payment failure churn alert
-- This would be called from a webhook handler when Stripe payment fails
CREATE OR REPLACE FUNCTION public.create_payment_failure_alert(
  _user_id uuid,
  _error_type text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name text;
  v_user_email text;
  v_alert_exists boolean;
BEGIN
  -- Get user info
  SELECT p.full_name, u.email 
  INTO v_user_name, v_user_email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.user_id = _user_id;
  
  IF v_user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if alert already exists for this user in the last 24 hours
  SELECT EXISTS (
    SELECT 1 FROM public.admin_alerts 
    WHERE user_id = _user_id 
      AND event_type = 'churn_payment_failed'
      AND created_at > now() - interval '24 hours'
  ) INTO v_alert_exists;
  
  IF v_alert_exists THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO public.admin_alerts (
    event_type, 
    user_id, 
    user_name, 
    user_email, 
    message
  ) VALUES (
    'churn_payment_failed',
    _user_id,
    v_user_name,
    v_user_email,
    '❌ Falha na renovação do plano PRO' || 
      CASE WHEN _error_type IS NOT NULL THEN '. Erro: ' || _error_type ELSE '' END
  );
  
  RETURN TRUE;
END;
$$;