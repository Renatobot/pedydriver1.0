-- Primeiro dropar a função existente para poder alterar o retorno
DROP FUNCTION IF EXISTS public.get_admin_users();

-- Função para enviar notificação de aviso de exclusão por inatividade
CREATE OR REPLACE FUNCTION public.admin_notify_inactivity_warning(_target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can run this
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;

  -- Insert notification for the user
  INSERT INTO public.user_notifications (user_id, type, title, message)
  VALUES (
    _target_user_id,
    'inactivity_warning',
    '⚠️ Aviso de Inatividade',
    'Sua conta está inativa há muito tempo. Por favor, faça login para evitar a exclusão da sua conta.'
  );

  -- Log admin action
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'send_inactivity_warning',
    _target_user_id,
    jsonb_build_object('warning_sent_at', now())
  );

  RETURN TRUE;
END;
$$;

-- Recriar função get_admin_users com campo days_inactive
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  phone text,
  created_at timestamp with time zone,
  last_login_at timestamp with time zone,
  is_blocked boolean,
  plan text,
  plan_status text,
  plan_started_at timestamp with time zone,
  plan_expires_at timestamp with time zone,
  days_inactive integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    u.email::TEXT,
    p.phone,
    p.created_at,
    p.last_login_at,
    p.is_blocked,
    s.plan::TEXT,
    s.status::TEXT,
    s.started_at,
    s.expires_at,
    CASE 
      WHEN p.last_login_at IS NULL THEN 
        EXTRACT(DAY FROM (NOW() - p.created_at))::INTEGER
      ELSE 
        EXTRACT(DAY FROM (NOW() - p.last_login_at))::INTEGER
    END as days_inactive
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.subscriptions s ON s.user_id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;