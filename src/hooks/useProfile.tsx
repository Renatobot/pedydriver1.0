import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      return data as Profile;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      full_name,
      phone,
    }: {
      full_name: string;
      phone: string | null;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Validações
      if (!full_name.trim()) {
        throw new Error('Nome é obrigatório');
      }
      if (full_name.length > 100) {
        throw new Error('Nome deve ter no máximo 100 caracteres');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          full_name: full_name.trim(), 
          phone: phone?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao atualizar perfil.',
        variant: 'destructive',
      });
      console.error('Error updating profile:', error);
    },
  });
}
