-- =====================================================
-- Sistema de Notificações Push Admin
-- =====================================================

-- Tabela: push_templates
-- Templates de mensagens prontas para uso rápido
CREATE TABLE public.push_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT DEFAULT '📢',
  url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_templates ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver/gerenciar templates
CREATE POLICY "Admins can manage push_templates"
  ON public.push_templates
  FOR ALL
  USING (public.is_admin());

-- Inserir templates padrão
INSERT INTO public.push_templates (name, title, body, icon, url) VALUES
  ('Sentimos sua falta', '🚗 Oi, sentimos sua falta!', 'Faz tempo que você não registra seus ganhos. Volte e mantenha seu controle financeiro em dia!', '🚗', '/quick'),
  ('Promoção PRO', '🎁 Oferta especial PRO!', 'Por tempo limitado: assine o PRO com desconto especial. Não perca!', '🎁', '/upgrade'),
  ('Novidade', '📢 Novidade no PEDY!', 'Acabamos de lançar uma nova funcionalidade. Venha conferir!', '📢', '/'),
  ('Lembrete', '💰 Registre seus ganhos!', 'Não esqueça de registrar os ganhos de hoje. Leva menos de 1 minuto!', '💰', '/quick'),
  ('Atualização', '🔄 Atualize seu app!', 'Uma nova versão do PEDY está disponível com melhorias importantes.', '🔄', '/');

-- =====================================================
-- Tabela: scheduled_notifications
-- Notificações agendadas para envio único
-- =====================================================
CREATE TABLE public.scheduled_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT DEFAULT '📢',
  url TEXT,
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'pro', 'free', 'inactive', 'user')),
  target_user_id UUID,
  inactive_days INTEGER,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar
CREATE POLICY "Admins can manage scheduled_notifications"
  ON public.scheduled_notifications
  FOR ALL
  USING (public.is_admin());

-- Index para buscar pendentes
CREATE INDEX idx_scheduled_notifications_pending 
  ON public.scheduled_notifications (scheduled_at) 
  WHERE status = 'pending';

-- =====================================================
-- Tabela: recurring_notifications
-- Notificações recorrentes (diário, semanal, mensal)
-- =====================================================
CREATE TABLE public.recurring_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT DEFAULT '📢',
  url TEXT,
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'pro', 'free', 'inactive')),
  inactive_days INTEGER,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  time_of_day TIME NOT NULL DEFAULT '20:00',
  days_of_week INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL,
  total_sent INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_notifications ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar
CREATE POLICY "Admins can manage recurring_notifications"
  ON public.recurring_notifications
  FOR ALL
  USING (public.is_admin());

-- Index para buscar próximas a executar
CREATE INDEX idx_recurring_notifications_next_run 
  ON public.recurring_notifications (next_run_at) 
  WHERE is_active = true;

-- =====================================================
-- Tabela: push_send_logs
-- Histórico de todos os envios para auditoria
-- =====================================================
CREATE TABLE public.push_send_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES public.scheduled_notifications(id) ON DELETE SET NULL,
  recurring_id UUID REFERENCES public.recurring_notifications(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_type TEXT NOT NULL,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  sent_by UUID,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_send_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs
CREATE POLICY "Admins can view push_send_logs"
  ON public.push_send_logs
  FOR SELECT
  USING (public.is_admin());

-- Admins podem inserir logs
CREATE POLICY "Admins can insert push_send_logs"
  ON public.push_send_logs
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Index para ordenar por data
CREATE INDEX idx_push_send_logs_sent_at 
  ON public.push_send_logs (sent_at DESC);

-- =====================================================
-- Funções auxiliares
-- =====================================================

-- Função para buscar usuários elegíveis por tipo
CREATE OR REPLACE FUNCTION public.get_push_recipients(
  _target_type TEXT,
  _target_user_id UUID DEFAULT NULL,
  _inactive_days INTEGER DEFAULT NULL
)
RETURNS TABLE(user_id UUID, endpoint TEXT, p256dh TEXT, auth TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ups.user_id,
    ups.endpoint,
    ups.p256dh,
    ups.auth
  FROM public.user_push_subscriptions ups
  INNER JOIN public.profiles p ON p.user_id = ups.user_id
  LEFT JOIN public.subscriptions s ON s.user_id = ups.user_id
  WHERE 
    CASE 
      WHEN _target_type = 'all' THEN true
      WHEN _target_type = 'pro' THEN s.plan = 'pro' AND s.status = 'active'
      WHEN _target_type = 'free' THEN COALESCE(s.plan, 'free') = 'free' OR s.status != 'active'
      WHEN _target_type = 'inactive' THEN 
        p.last_login_at < NOW() - (_inactive_days || ' days')::INTERVAL
      WHEN _target_type = 'user' THEN ups.user_id = _target_user_id
      ELSE true
    END;
END;
$$;

-- Função para contar destinatários por tipo
CREATE OR REPLACE FUNCTION public.count_push_recipients(
  _target_type TEXT,
  _inactive_days INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.get_push_recipients(_target_type, NULL, _inactive_days);
  
  RETURN v_count;
END;
$$;

-- Função para buscar scheduled prontas para envio
CREATE OR REPLACE FUNCTION public.get_pending_scheduled_notifications()
RETURNS TABLE(
  id UUID,
  title TEXT,
  body TEXT,
  icon TEXT,
  url TEXT,
  target_type TEXT,
  target_user_id UUID,
  inactive_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sn.id,
    sn.title,
    sn.body,
    sn.icon,
    sn.url,
    sn.target_type,
    sn.target_user_id,
    sn.inactive_days
  FROM public.scheduled_notifications sn
  WHERE sn.status = 'pending'
    AND sn.scheduled_at <= NOW();
END;
$$;

-- Função para buscar recurring prontas para envio
CREATE OR REPLACE FUNCTION public.get_due_recurring_notifications()
RETURNS TABLE(
  id UUID,
  name TEXT,
  title TEXT,
  body TEXT,
  icon TEXT,
  url TEXT,
  target_type TEXT,
  inactive_days INTEGER,
  frequency TEXT,
  time_of_day TIME,
  days_of_week INTEGER[],
  day_of_month INTEGER,
  timezone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rn.id,
    rn.name,
    rn.title,
    rn.body,
    rn.icon,
    rn.url,
    rn.target_type,
    rn.inactive_days,
    rn.frequency,
    rn.time_of_day,
    rn.days_of_week,
    rn.day_of_month,
    rn.timezone
  FROM public.recurring_notifications rn
  WHERE rn.is_active = true
    AND rn.next_run_at <= NOW();
END;
$$;

-- Função para calcular próximo envio de recurring
CREATE OR REPLACE FUNCTION public.calculate_next_run_at(
  _frequency TEXT,
  _time_of_day TIME,
  _days_of_week INTEGER[],
  _day_of_month INTEGER,
  _timezone TEXT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_today DATE;
  v_next_date DATE;
  v_current_dow INTEGER;
  v_target_dow INTEGER;
  v_days_ahead INTEGER;
  v_min_days INTEGER;
  i INTEGER;
BEGIN
  -- Obter hora atual no timezone especificado
  v_now := NOW() AT TIME ZONE _timezone;
  v_today := v_now::DATE;
  
  IF _frequency = 'daily' THEN
    -- Se já passou o horário hoje, agenda para amanhã
    IF v_now::TIME > _time_of_day THEN
      v_next_date := v_today + INTERVAL '1 day';
    ELSE
      v_next_date := v_today;
    END IF;
    
  ELSIF _frequency = 'weekly' THEN
    -- Encontrar o próximo dia da semana válido
    v_current_dow := EXTRACT(DOW FROM v_today)::INTEGER;
    v_min_days := 8; -- mais que uma semana
    
    FOREACH v_target_dow IN ARRAY _days_of_week
    LOOP
      IF v_target_dow > v_current_dow THEN
        v_days_ahead := v_target_dow - v_current_dow;
      ELSIF v_target_dow = v_current_dow THEN
        -- Se é hoje, verificar se já passou o horário
        IF v_now::TIME > _time_of_day THEN
          v_days_ahead := 7; -- próxima semana
        ELSE
          v_days_ahead := 0;
        END IF;
      ELSE
        v_days_ahead := 7 - v_current_dow + v_target_dow;
      END IF;
      
      IF v_days_ahead < v_min_days THEN
        v_min_days := v_days_ahead;
      END IF;
    END LOOP;
    
    v_next_date := v_today + (v_min_days || ' days')::INTERVAL;
    
  ELSIF _frequency = 'monthly' THEN
    -- Próximo dia do mês especificado
    IF EXTRACT(DAY FROM v_today)::INTEGER < _day_of_month THEN
      -- Ainda não chegou este mês
      v_next_date := DATE_TRUNC('month', v_today) + ((_day_of_month - 1) || ' days')::INTERVAL;
      -- Se já passou o horário hoje e é o dia, vai para próximo mês
      IF v_next_date = v_today AND v_now::TIME > _time_of_day THEN
        v_next_date := DATE_TRUNC('month', v_today + INTERVAL '1 month') + ((_day_of_month - 1) || ' days')::INTERVAL;
      END IF;
    ELSE
      -- Já passou ou é hoje, vai para próximo mês
      v_next_date := DATE_TRUNC('month', v_today + INTERVAL '1 month') + ((_day_of_month - 1) || ' days')::INTERVAL;
    END IF;
    
    -- Ajustar para meses que não têm o dia (ex: 31 em fevereiro)
    IF EXTRACT(DAY FROM v_next_date)::INTEGER != _day_of_month THEN
      v_next_date := DATE_TRUNC('month', v_next_date + INTERVAL '1 month') + ((_day_of_month - 1) || ' days')::INTERVAL;
    END IF;
  END IF;
  
  -- Retornar timestamp com timezone
  RETURN (v_next_date::TEXT || ' ' || _time_of_day::TEXT)::TIMESTAMP AT TIME ZONE _timezone;
END;
$$;

-- Função para atualizar recurring após envio
CREATE OR REPLACE FUNCTION public.update_recurring_after_send(
  _recurring_id UUID,
  _sent_count INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT * INTO v_rec
  FROM public.recurring_notifications
  WHERE id = _recurring_id;
  
  UPDATE public.recurring_notifications
  SET 
    last_run_at = NOW(),
    total_sent = total_sent + _sent_count,
    next_run_at = public.calculate_next_run_at(
      v_rec.frequency,
      v_rec.time_of_day,
      v_rec.days_of_week,
      v_rec.day_of_month,
      v_rec.timezone
    ),
    updated_at = NOW()
  WHERE id = _recurring_id;
END;
$$;