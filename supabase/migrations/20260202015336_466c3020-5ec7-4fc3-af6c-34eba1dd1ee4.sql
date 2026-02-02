-- Create pending_payments table for payments that couldn't be automatically linked
CREATE TABLE public.pending_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  transaction_id text,
  payment_data jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'linked', 'cancelled')),
  linked_user_id uuid,
  linked_at timestamp with time zone,
  linked_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

-- Only admins can view pending payments
CREATE POLICY "Admins can view pending payments"
  ON public.pending_payments
  FOR SELECT
  USING (public.is_admin());

-- Only admins can update pending payments
CREATE POLICY "Admins can update pending payments"
  ON public.pending_payments
  FOR UPDATE
  USING (public.is_admin());

-- Allow insert from service role (webhook)
CREATE POLICY "Service role can insert pending payments"
  ON public.pending_payments
  FOR INSERT
  WITH CHECK (true);

-- Create function to link payment to user and activate PRO
CREATE OR REPLACE FUNCTION public.admin_link_payment_to_user(
  _payment_id uuid,
  _target_user_id uuid,
  _is_annual boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expires_at timestamp with time zone;
  v_user_email text;
  v_user_name text;
  v_payment_email text;
  v_payment_amount numeric;
BEGIN
  -- Only admins can run this
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;
  
  -- Get payment info
  SELECT email, amount INTO v_payment_email, v_payment_amount
  FROM public.pending_payments
  WHERE id = _payment_id AND status = 'pending';
  
  IF v_payment_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate expiration
  IF _is_annual THEN
    v_expires_at := now() + interval '1 year';
  ELSE
    v_expires_at := now() + interval '1 month';
  END IF;
  
  -- Update subscription to PRO
  UPDATE public.subscriptions
  SET 
    plan = 'pro',
    status = 'active',
    started_at = now(),
    expires_at = v_expires_at,
    updated_at = now()
  WHERE user_id = _target_user_id;
  
  -- Mark payment as linked
  UPDATE public.pending_payments
  SET 
    status = 'linked',
    linked_user_id = _target_user_id,
    linked_at = now(),
    linked_by = auth.uid(),
    updated_at = now()
  WHERE id = _payment_id;
  
  -- Get user info for alert
  SELECT p.full_name, u.email INTO v_user_name, v_user_email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.user_id = _target_user_id;
  
  -- Create success alert
  INSERT INTO public.admin_alerts (event_type, user_id, user_name, user_email, message)
  VALUES (
    'new_user_pro',
    _target_user_id,
    v_user_name,
    v_user_email,
    '💰 Pagamento vinculado manualmente: ' || COALESCE(v_user_name, v_user_email) || 
    '. Email do pagamento: ' || v_payment_email ||
    '. Plano: ' || CASE WHEN _is_annual THEN 'Anual' ELSE 'Mensal' END
  );
  
  -- Log admin action
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'link_payment',
    _target_user_id,
    jsonb_build_object(
      'payment_id', _payment_id,
      'payment_email', v_payment_email,
      'amount', v_payment_amount,
      'is_annual', _is_annual
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Create function to cancel a pending payment
CREATE OR REPLACE FUNCTION public.admin_cancel_pending_payment(_payment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can run this
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.pending_payments
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE id = _payment_id AND status = 'pending';
  
  -- Log admin action
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (
    auth.uid(),
    'cancel_pending_payment',
    jsonb_build_object('payment_id', _payment_id)
  );
  
  RETURN TRUE;
END;
$$;

-- Create function to get pending payments for admin
CREATE OR REPLACE FUNCTION public.get_pending_payments()
RETURNS TABLE (
  id uuid,
  email text,
  amount numeric,
  transaction_id text,
  status text,
  linked_user_id uuid,
  linked_user_email text,
  linked_user_name text,
  linked_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    pp.created_at
  FROM public.pending_payments pp
  LEFT JOIN auth.users u ON u.id = pp.linked_user_id
  LEFT JOIN public.profiles p ON p.user_id = pp.linked_user_id
  ORDER BY 
    CASE WHEN pp.status = 'pending' THEN 0 ELSE 1 END,
    pp.created_at DESC;
END;
$$;