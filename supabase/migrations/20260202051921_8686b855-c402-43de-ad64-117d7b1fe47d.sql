-- Dropar e recriar função com novo retorno
DROP FUNCTION IF EXISTS public.get_pending_payments();

CREATE OR REPLACE FUNCTION public.get_pending_payments()
 RETURNS TABLE(id uuid, email text, amount numeric, transaction_id text, status text, linked_user_id uuid, linked_user_email text, linked_user_name text, linked_at timestamp with time zone, created_at timestamp with time zone, intent_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only admins can run this
  IF NOT public.is_admin() THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    pp.id,
    pp.email,
    pp.amount,
    pp.transaction_id,
    pp.status,
    pp.linked_user_id,
    u.email as linked_user_email,
    p.full_name as linked_user_name,
    pp.linked_at,
    pp.created_at,
    pp.intent_id
  FROM public.pending_payments pp
  LEFT JOIN auth.users u ON u.id = pp.linked_user_id
  LEFT JOIN public.profiles p ON p.user_id = pp.linked_user_id
  ORDER BY 
    CASE WHEN pp.status = 'pending' THEN 0 ELSE 1 END,
    pp.created_at DESC;
END;
$function$;