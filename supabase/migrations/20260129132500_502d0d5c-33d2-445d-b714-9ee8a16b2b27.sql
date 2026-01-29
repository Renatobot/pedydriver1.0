-- Function to verify user identity by email + phone + name and generate password reset token
-- Returns a reset token if verification succeeds, null if fails
CREATE OR REPLACE FUNCTION public.verify_user_for_password_reset(
  _email text,
  _phone text,
  _full_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_stored_name text;
  v_stored_phone text;
BEGIN
  -- Format phone if needed
  IF NOT _phone LIKE '+%' THEN
    _phone := '+55' || _phone;
  END IF;
  
  -- Get user by email
  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE u.email = lower(trim(_email));
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get profile data
  SELECT p.full_name, p.phone INTO v_stored_name, v_stored_phone
  FROM public.profiles p
  WHERE p.user_id = v_user_id;
  
  -- Verify all data matches (case-insensitive for name)
  IF lower(trim(v_stored_name)) = lower(trim(_full_name)) 
     AND v_stored_phone = _phone THEN
    -- Return the user_id as a "token" for the reset
    RETURN v_user_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Function for admin to reset user password (creates a password reset link)
-- This is a SECURITY DEFINER function that only admins can call
CREATE OR REPLACE FUNCTION public.admin_get_user_for_reset(
  _target_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
BEGIN
  -- Only admins can run this
  IF NOT public.is_admin() THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;
  
  -- Get user info
  SELECT u.email, p.full_name 
  INTO v_user_email, v_user_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE u.id = _target_user_id;
  
  IF v_user_email IS NULL THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  -- Log this action
  INSERT INTO public.admin_logs (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(),
    'password_reset_requested',
    _target_user_id,
    json_build_object('user_email', v_user_email, 'user_name', v_user_name)
  );
  
  RETURN json_build_object(
    'success', true, 
    'email', v_user_email,
    'name', v_user_name
  );
END;
$$;