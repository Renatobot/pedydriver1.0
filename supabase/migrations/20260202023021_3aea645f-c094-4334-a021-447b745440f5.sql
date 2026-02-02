-- Fix get_admin_users function to handle varchar type from auth.users
CREATE OR REPLACE FUNCTION public.get_admin_users()
 RETURNS TABLE(user_id uuid, full_name text, email text, phone text, created_at timestamp with time zone, last_login_at timestamp with time zone, is_blocked boolean, plan text, plan_status text, plan_started_at timestamp with time zone, plan_expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se é admin
  IF NOT public.is_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    u.email::TEXT,  -- Cast to TEXT to match return type
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
$function$;