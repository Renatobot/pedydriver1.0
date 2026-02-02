-- Add platform_ids array column to active_shifts table
ALTER TABLE public.active_shifts 
ADD COLUMN platform_ids uuid[] DEFAULT NULL;