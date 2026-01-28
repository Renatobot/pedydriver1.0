import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Platform } from '@/types/database';

export function usePlatforms() {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: async (): Promise<Platform[]> => {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');
      
      if (error) throw error;
      return data as Platform[];
    }
  });
}
