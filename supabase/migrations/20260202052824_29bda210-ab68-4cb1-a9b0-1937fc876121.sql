-- Create support tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_reply text,
  replied_at timestamp with time zone,
  replied_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can insert their own tickets
CREATE POLICY "Users can insert own tickets"
ON public.support_tickets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.support_tickets FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can update tickets (to reply)
CREATE POLICY "Admins can update tickets"
ON public.support_tickets FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Create function to get tickets for admin
CREATE OR REPLACE FUNCTION public.get_support_tickets(_status text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  user_email text,
  user_name text,
  subject text,
  message text,
  status text,
  admin_reply text,
  replied_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    u.email::text as user_email,
    p.full_name as user_name,
    t.subject,
    t.message,
    t.status,
    t.admin_reply,
    t.replied_at,
    t.created_at
  FROM public.support_tickets t
  LEFT JOIN auth.users u ON u.id = t.user_id
  LEFT JOIN public.profiles p ON p.user_id = t.user_id
  WHERE (_status IS NULL OR t.status = _status)
  ORDER BY 
    CASE WHEN t.status = 'open' THEN 0 ELSE 1 END,
    t.created_at DESC;
END;
$$;

-- Create function to reply to ticket
CREATE OR REPLACE FUNCTION public.admin_reply_ticket(_ticket_id uuid, _reply text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;

  UPDATE public.support_tickets
  SET 
    admin_reply = _reply,
    replied_at = now(),
    replied_by = auth.uid(),
    status = 'replied',
    updated_at = now()
  WHERE id = _ticket_id;

  -- Log admin action
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (
    auth.uid(),
    'reply_support_ticket',
    jsonb_build_object('ticket_id', _ticket_id)
  );

  RETURN TRUE;
END;
$$;

-- Create function to close ticket
CREATE OR REPLACE FUNCTION public.admin_close_ticket(_ticket_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;

  UPDATE public.support_tickets
  SET 
    status = 'closed',
    updated_at = now()
  WHERE id = _ticket_id;

  RETURN TRUE;
END;
$$;