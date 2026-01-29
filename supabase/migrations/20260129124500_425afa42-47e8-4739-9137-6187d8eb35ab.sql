-- Remover a view problemática que expõe auth.users
DROP VIEW IF EXISTS public.admin_metrics;

-- Criar função SECURITY DEFINER para obter métricas (mais seguro)
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verificar se é admin antes de retornar dados
  IF NOT public.is_admin() THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'active_today', (SELECT COUNT(*) FROM public.profiles WHERE last_login_at >= CURRENT_DATE),
    'pro_users', (SELECT COUNT(*) FROM public.subscriptions WHERE plan = 'pro' AND status = 'active'),
    'new_today', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE),
    'new_week', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'free_users', (SELECT COUNT(*) FROM public.subscriptions WHERE plan = 'free' AND status = 'active'),
    'expired_pro', (SELECT COUNT(*) FROM public.subscriptions WHERE plan = 'pro' AND status = 'expired'),
    'blocked_users', (SELECT COUNT(*) FROM public.profiles WHERE is_blocked = true)
  ) INTO result;

  RETURN result;
END;
$$;

-- Função para admin obter lista de usuários com dados completos
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_blocked BOOLEAN,
  plan TEXT,
  plan_status TEXT,
  plan_started_at TIMESTAMP WITH TIME ZONE,
  plan_expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.is_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    u.email,
    p.phone,
    p.created_at,
    p.last_login_at,
    p.is_blocked,
    s.plan::TEXT,
    s.status::TEXT,
    s.started_at,
    s.expires_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.subscriptions s ON s.user_id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Função para admin atualizar subscription de usuário
CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  _target_user_id UUID,
  _plan TEXT,
  _status TEXT,
  _expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;

  -- Atualizar subscription
  UPDATE public.subscriptions
  SET 
    plan = _plan::subscription_plan,
    status = _status::subscription_status,
    expires_at = _expires_at,
    updated_at = now()
  WHERE user_id = _target_user_id;

  -- Registrar log
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'update_subscription',
    _target_user_id,
    json_build_object('plan', _plan, 'status', _status, 'expires_at', _expires_at)
  );

  RETURN TRUE;
END;
$$;

-- Função para admin bloquear/desbloquear usuário
CREATE OR REPLACE FUNCTION public.admin_toggle_user_block(
  _target_user_id UUID,
  _is_blocked BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;

  -- Atualizar profile
  UPDATE public.profiles
  SET is_blocked = _is_blocked, updated_at = now()
  WHERE user_id = _target_user_id;

  -- Registrar log
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    CASE WHEN _is_blocked THEN 'block_user' ELSE 'unblock_user' END,
    _target_user_id,
    json_build_object('is_blocked', _is_blocked)
  );

  RETURN TRUE;
END;
$$;

-- Função para admin resetar limite de registros (limpar earnings do mês)
CREATE OR REPLACE FUNCTION public.admin_reset_monthly_limit(
  _target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;

  -- Registrar log (não vamos deletar earnings, apenas registrar o reset)
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'reset_monthly_limit',
    _target_user_id,
    json_build_object('reset_date', now())
  );

  RETURN TRUE;
END;
$$;

-- Função para obter logs do admin
CREATE OR REPLACE FUNCTION public.get_admin_logs(_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  admin_email TEXT,
  action TEXT,
  target_user_email TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT public.is_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    l.id,
    admin_u.email AS admin_email,
    l.action,
    target_u.email AS target_user_email,
    l.details,
    l.created_at
  FROM public.admin_logs l
  LEFT JOIN auth.users admin_u ON admin_u.id = l.admin_id
  LEFT JOIN auth.users target_u ON target_u.id = l.target_user_id
  ORDER BY l.created_at DESC
  LIMIT _limit;
END;
$$;