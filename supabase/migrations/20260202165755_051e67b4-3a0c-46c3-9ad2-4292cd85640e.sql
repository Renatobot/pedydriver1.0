-- Add platform_ids array column to shifts table
ALTER TABLE public.shifts 
ADD COLUMN platform_ids uuid[] DEFAULT NULL;

-- Update existing records to populate platform_ids from platform_id
UPDATE public.shifts 
SET platform_ids = ARRAY[platform_id] 
WHERE platform_id IS NOT NULL AND platform_ids IS NULL;