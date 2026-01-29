-- Function to get email by phone number for login purposes
-- This is SECURITY DEFINER to allow unauthenticated users to look up their own email
CREATE OR REPLACE FUNCTION public.get_email_by_phone(_phone text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  -- Find user_id from profiles by phone
  SELECT user_id INTO v_user_id
  FROM public.profiles
  WHERE phone = _phone;
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;
  
  RETURN v_email;
END;
$$;