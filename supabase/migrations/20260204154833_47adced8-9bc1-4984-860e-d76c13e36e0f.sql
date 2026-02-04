-- Tabela para lembretes de manutenção
CREATE TABLE public.maintenance_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  interval_km INTEGER NOT NULL,
  last_km NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance_reminders
CREATE POLICY "Users can view own maintenance reminders"
ON public.maintenance_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own maintenance reminders"
ON public.maintenance_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own maintenance reminders"
ON public.maintenance_reminders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own maintenance reminders"
ON public.maintenance_reminders FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_maintenance_reminders_updated_at
BEFORE UPDATE ON public.maintenance_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para estatísticas anônimas da comunidade
CREATE TABLE public.community_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  metric TEXT NOT NULL,
  p10 NUMERIC DEFAULT 0,
  p25 NUMERIC DEFAULT 0,
  p50 NUMERIC DEFAULT 0,
  p75 NUMERIC DEFAULT 0,
  p90 NUMERIC DEFAULT 0,
  avg NUMERIC DEFAULT 0,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(period, metric)
);

-- Enable RLS
ALTER TABLE public.community_stats ENABLE ROW LEVEL SECURITY;

-- Leitura pública (dados anônimos)
CREATE POLICY "Anyone can view community stats"
ON public.community_stats FOR SELECT
USING (true);

-- Apenas service_role pode inserir/atualizar (via edge function)
CREATE POLICY "Service role can insert community stats"
ON public.community_stats FOR INSERT
WITH CHECK (false);

CREATE POLICY "Service role can update community stats"
ON public.community_stats FOR UPDATE
USING (false);