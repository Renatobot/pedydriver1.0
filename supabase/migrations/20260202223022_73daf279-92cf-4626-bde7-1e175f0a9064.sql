-- Tabela para armazenar preços de combustível contribuídos pelos usuários
CREATE TABLE public.fuel_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fuel_type TEXT NOT NULL DEFAULT 'gasolina',
  price NUMERIC NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca por localização e tipo de combustível
CREATE INDEX idx_fuel_prices_location ON public.fuel_prices (state, city, fuel_type);
CREATE INDEX idx_fuel_prices_recent ON public.fuel_prices (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ver preços (para calcular média regional)
CREATE POLICY "Anyone can view fuel prices" 
ON public.fuel_prices 
FOR SELECT 
USING (true);

-- Usuários podem adicionar suas contribuições
CREATE POLICY "Users can insert fuel prices" 
ON public.fuel_prices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas suas próprias contribuições
CREATE POLICY "Users can update own fuel prices" 
ON public.fuel_prices 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Usuários podem deletar apenas suas próprias contribuições
CREATE POLICY "Users can delete own fuel prices" 
ON public.fuel_prices 
FOR DELETE 
USING (auth.uid() = user_id);

-- Função para obter média de preços por região e tipo de combustível
CREATE OR REPLACE FUNCTION public.get_average_fuel_price(
  _state TEXT,
  _city TEXT DEFAULT NULL,
  _fuel_type TEXT DEFAULT 'gasolina',
  _days_ago INTEGER DEFAULT 30
)
RETURNS TABLE (
  avg_price NUMERIC,
  min_price NUMERIC,
  max_price NUMERIC,
  sample_count BIGINT,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(fp.price)::numeric, 2) as avg_price,
    ROUND(MIN(fp.price)::numeric, 2) as min_price,
    ROUND(MAX(fp.price)::numeric, 2) as max_price,
    COUNT(*)::bigint as sample_count,
    MAX(fp.created_at) as last_updated
  FROM public.fuel_prices fp
  WHERE fp.state = _state
    AND (_city IS NULL OR fp.city = _city)
    AND fp.fuel_type = _fuel_type
    AND fp.created_at > (now() - (_days_ago || ' days')::interval);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;