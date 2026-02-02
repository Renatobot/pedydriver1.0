-- Add new vehicle types for bicycles
ALTER TYPE vehicle_type ADD VALUE IF NOT EXISTS 'bicicleta';
ALTER TYPE vehicle_type ADD VALUE IF NOT EXISTS 'bicicleta_eletrica';