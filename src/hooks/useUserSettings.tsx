import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserSettings } from '@/types/database';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export function useUserSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async (): Promise<UserSettings | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as UserSettings | null;
    },
    enabled: !!user
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!user) throw new Error('Não autenticado');

      // Use UPSERT to ensure the row exists (create on first save) and to avoid
      // silent failures when the user_settings row hasn't been created yet.
      const { data, error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            ...settings,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências foram atualizadas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}
