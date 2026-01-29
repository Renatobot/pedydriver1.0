-- Criar tabela de alertas do admin
CREATE TABLE public.admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('new_user_free', 'new_user_pro', 'payment_failure', 'plan_activation_error')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_email TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver alertas
CREATE POLICY "Admins can view alerts"
ON public.admin_alerts
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Apenas admins podem atualizar alertas (marcar como lido)
CREATE POLICY "Admins can update alerts"
ON public.admin_alerts
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Sistema pode inserir alertas
CREATE POLICY "System can insert alerts"
ON public.admin_alerts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Função para criar alerta de novo usuário
CREATE OR REPLACE FUNCTION public.create_new_user_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_alerts (event_type, user_id, user_name, user_email, message)
  VALUES (
    'new_user_free',
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    'Novo usuário cadastrado: ' || COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger para novos usuários
CREATE TRIGGER on_new_user_alert
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_new_user_alert();

-- Função para criar alerta quando subscription muda para PRO
CREATE OR REPLACE FUNCTION public.create_pro_subscription_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name TEXT;
  v_user_email TEXT;
BEGIN
  -- Só cria alerta se mudou para PRO ou se era free e virou pro
  IF NEW.plan = 'pro' AND (OLD IS NULL OR OLD.plan = 'free') THEN
    SELECT p.full_name, u.email 
    INTO v_user_name, v_user_email
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.user_id = NEW.user_id;
    
    INSERT INTO public.admin_alerts (event_type, user_id, user_name, user_email, message)
    VALUES (
      'new_user_pro',
      NEW.user_id,
      v_user_name,
      v_user_email,
      'Usuário ativou plano PRO: ' || COALESCE(v_user_name, v_user_email)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para mudança de subscription
CREATE TRIGGER on_subscription_pro_alert
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_pro_subscription_alert();

-- Função para obter alertas do admin
CREATE OR REPLACE FUNCTION public.get_admin_alerts(_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  message TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
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
    a.id,
    a.event_type,
    a.user_id,
    a.user_name,
    a.user_email,
    a.message,
    a.is_read,
    a.created_at
  FROM public.admin_alerts a
  ORDER BY a.created_at DESC
  LIMIT _limit;
END;
$$;

-- Função para contar alertas não lidos
CREATE OR REPLACE FUNCTION public.get_unread_alerts_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN 0;
  END IF;

  RETURN (SELECT COUNT(*)::INTEGER FROM public.admin_alerts WHERE is_read = false);
END;
$$;

-- Função para marcar alerta como lido
CREATE OR REPLACE FUNCTION public.mark_alert_as_read(_alert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;

  UPDATE public.admin_alerts
  SET is_read = true
  WHERE id = _alert_id;

  RETURN TRUE;
END;
$$;

-- Função para marcar todos alertas como lidos
CREATE OR REPLACE FUNCTION public.mark_all_alerts_as_read()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN FALSE;
  END IF;

  UPDATE public.admin_alerts
  SET is_read = true
  WHERE is_read = false;

  RETURN TRUE;
END;
$$;