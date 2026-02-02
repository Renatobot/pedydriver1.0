-- Add vehicle_model column to store the selected vehicle model name
ALTER TABLE public.user_settings
ADD COLUMN vehicle_model text NULL;