-- Função RPC para admin atualizar perfil de usuário
CREATE OR REPLACE FUNCTION admin_update_user_profile(
  _target_user_id uuid,
  _full_name text,
  _phone text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  -- Atualizar perfil
  UPDATE profiles 
  SET full_name = _full_name, 
      phone = _phone, 
      updated_at = now()
  WHERE user_id = _target_user_id;
  
  -- Registrar ação no log
  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), 'update_user_profile', _target_user_id, 
          jsonb_build_object('full_name', _full_name, 'phone', _phone));
END;
$$;