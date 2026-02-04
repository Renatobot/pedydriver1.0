import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Expense, ExpenseCategory } from '@/types/database';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface CreateExpenseData {
  date: string;
  category: ExpenseCategory;
  amount: number;
  platform_id?: string | null;
  notes?: string;
}

export function useExpenses(startDate?: string, endDate?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expenses', user?.id, startDate, endDate],
    staleTime: 30 * 1000, // 30 seconds - data can be slightly stale
    queryFn: async (): Promise<Expense[]> => {
      if (!user) return [];
      
      let query = supabase
        .from('expenses')
        .select('*, platform:platforms(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (expense: CreateExpenseData) => {
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Gasto registrado!',
        description: 'Seu gasto foi salvo com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...expense }: { id: string } & Partial<CreateExpenseData>) => {
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('expenses')
        .update(expense)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Gasto atualizado!',
        description: 'Seu gasto foi editado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Gasto excluído',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}
