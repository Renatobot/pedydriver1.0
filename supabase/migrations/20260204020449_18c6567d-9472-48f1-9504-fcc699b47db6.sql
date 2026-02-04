-- Tabela para armazenar subscriptions de push dos admins
CREATE TABLE public.admin_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(admin_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage their own subscriptions
CREATE POLICY "Admins can manage own push subscriptions"
ON public.admin_push_subscriptions
FOR ALL
USING (admin_id = auth.uid() AND public.is_admin())
WITH CHECK (admin_id = auth.uid() AND public.is_admin());

-- Tabela para armazenar configurações do sistema (incluindo VAPID keys)
CREATE TABLE public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read system config
CREATE POLICY "Admins can read system config"
ON public.system_config
FOR SELECT
USING (public.is_admin());

-- Inserir chaves VAPID geradas
INSERT INTO public.system_config (key, value) VALUES 
  ('vapid_public_key', 'BLBx-hf2WrL2qEa0qKb-aCJbcxEvyn62GDYcsMr6zPLMHun9CRzJzTXPhKRL6CsKUk_FfDQICbDJgwjVeUdMg_w'),
  ('vapid_private_key', 'K9Y8pKxKmqCjQBhcAdR1W-LzZ_5eDnuIHnMYWDN5YWE');

-- Função para buscar todas as push subscriptions (para a edge function)
CREATE OR REPLACE FUNCTION public.get_admin_push_subscriptions()
RETURNS TABLE(endpoint TEXT, p256dh TEXT, auth TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aps.endpoint,
    aps.p256dh,
    aps.auth
  FROM public.admin_push_subscriptions aps
  JOIN public.user_roles ur ON ur.user_id = aps.admin_id
  WHERE ur.role = 'admin';
END;
$$;

-- Função para buscar VAPID keys
CREATE OR REPLACE FUNCTION public.get_vapid_public_key()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT value FROM public.system_config WHERE key = 'vapid_public_key';
$$;