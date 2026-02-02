-- Adicionar coluna para rastrear intent original em pending_payments
ALTER TABLE public.pending_payments 
ADD COLUMN IF NOT EXISTS intent_id UUID REFERENCES public.payment_intents(id);

-- Criar índice para buscas eficientes
CREATE INDEX IF NOT EXISTS idx_pending_payments_intent 
ON public.pending_payments(intent_id);

-- Criar índice para busca por amount (usado no novo matching por valor)
CREATE INDEX IF NOT EXISTS idx_pending_payments_amount 
ON public.pending_payments(amount) WHERE status = 'pending';