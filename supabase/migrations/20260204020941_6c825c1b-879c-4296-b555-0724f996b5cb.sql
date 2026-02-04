-- Função para criar notificação de boas-vindas
CREATE OR REPLACE FUNCTION public.create_welcome_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_notifications (user_id, type, title, message)
  VALUES (
    NEW.user_id,
    'welcome',
    'Bem-vindo ao PEDY Driver!',
    'Comece registrando seus ganhos e despesas. Use o Turno para acompanhar sua jornada completa. Bons lucros!'
  );
  RETURN NEW;
END;
$$;

-- Trigger na tabela profiles (criada junto com o usuário)
DROP TRIGGER IF EXISTS on_new_user_welcome ON public.profiles;
CREATE TRIGGER on_new_user_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_welcome_notification();

-- Função para notificar usuário quando ativar PRO
CREATE OR REPLACE FUNCTION public.create_pro_upgrade_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Só notifica se mudou de free para pro
  IF NEW.plan = 'pro' AND NEW.status = 'active' AND (OLD.plan = 'free' OR OLD.status != 'active') THEN
    INSERT INTO public.user_notifications (user_id, type, title, message)
    VALUES (
      NEW.user_id,
      'subscription_update',
      'Plano PRO Ativado!',
      'Parabens! Agora voce tem acesso a todos os recursos premium. Aproveite relatorios avancados, metas e muito mais!'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger na tabela subscriptions para upgrade PRO
DROP TRIGGER IF EXISTS on_subscription_upgrade_notification ON public.subscriptions;
CREATE TRIGGER on_subscription_upgrade_notification
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION create_pro_upgrade_notification();