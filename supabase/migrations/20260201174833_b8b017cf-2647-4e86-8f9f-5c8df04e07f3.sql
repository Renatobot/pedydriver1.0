-- Tabela para turnos ativos (em andamento)
CREATE TABLE IF NOT EXISTS public.active_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform_id UUID REFERENCES public.platforms(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  start_km NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Apenas um turno ativo por usuário
CREATE UNIQUE INDEX active_shifts_user_unique ON public.active_shifts(user_id);

-- RLS
ALTER TABLE public.active_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own active shift"
  ON public.active_shifts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own active shift"
  ON public.active_shifts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own active shift"
  ON public.active_shifts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own active shift"
  ON public.active_shifts FOR DELETE
  USING (auth.uid() = user_id);