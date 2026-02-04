-- Recriar a função get_vapid_public_key com search_path correto
CREATE OR REPLACE FUNCTION public.get_vapid_public_key()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.system_config WHERE key = 'vapid_public_key';
$$;

-- Garantir que usuários autenticados podem executar a função
GRANT EXECUTE ON FUNCTION public.get_vapid_public_key() TO authenticated;