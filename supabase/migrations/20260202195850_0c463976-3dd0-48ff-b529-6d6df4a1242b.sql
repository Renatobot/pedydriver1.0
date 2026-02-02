-- Tabela para gastos recorrentes
CREATE TABLE public.recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category expense_category NOT NULL,
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  platform_id UUID REFERENCES platforms(id),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_at DATE,
  next_due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_recurring_expenses_user_id ON public.recurring_expenses(user_id);
CREATE INDEX idx_recurring_expenses_next_due ON public.recurring_expenses(next_due_date) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own recurring expenses"
  ON public.recurring_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring expenses"
  ON public.recurring_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring expenses"
  ON public.recurring_expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring expenses"
  ON public.recurring_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_recurring_expenses_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();