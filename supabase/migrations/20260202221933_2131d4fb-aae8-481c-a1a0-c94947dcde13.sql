-- Add fuel_type column to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN fuel_type text NOT NULL DEFAULT 'gasolina';

-- Add comment explaining valid values
COMMENT ON COLUMN public.user_settings.fuel_type IS 'Tipo de combustível: gasolina, etanol, gnv, eletrico';