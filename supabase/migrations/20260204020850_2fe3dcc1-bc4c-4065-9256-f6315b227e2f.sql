-- Habilitar extensão pg_net para chamadas HTTP
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Função que dispara push quando um novo alerta é criado
CREATE OR REPLACE FUNCTION public.trigger_admin_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_url TEXT;
  v_anon_key TEXT;
BEGIN
  -- Montar URL da edge function
  v_url := 'https://kfpyfcjukqjowridvyqi.supabase.co/functions/v1/send-admin-push';
  
  -- Fazer chamada HTTP para a edge function
  PERFORM extensions.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmcHlmY2p1a3Fqb3dyaWR2eXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjQ1ODUsImV4cCI6MjA4NTIwMDU4NX0.zdwLXQcDKFZNnwkhwqBNmWC7w16LSkextUqdngycqoc'
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'event_type', NEW.event_type,
        'user_id', NEW.user_id,
        'user_name', NEW.user_name,
        'user_email', NEW.user_email,
        'message', NEW.message
      )
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the insert
    RAISE WARNING 'Failed to send push notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Criar trigger na tabela admin_alerts
DROP TRIGGER IF EXISTS on_admin_alert_send_push ON public.admin_alerts;
CREATE TRIGGER on_admin_alert_send_push
  AFTER INSERT ON public.admin_alerts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_admin_push_notification();