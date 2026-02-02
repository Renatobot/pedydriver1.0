import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { ExpenseCategory } from '@/types/database';
import { addDays, addMonths, format, startOfDay } from 'date-fns';

export interface RecurringExpense {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  amount: number;
  frequency: 'weekly' | 'monthly';
  day_of_week: number | null;
  day_of_month: number | null;
  platform_id: string | null;
  notes: string | null;
  is_active: boolean;
  last_generated_at: string | null;
  next_due_date: string;
  created_at: string;
  updated_at: string;
}

interface CreateRecurringExpenseData {
  category: ExpenseCategory;
  amount: number;
  frequency: 'weekly' | 'monthly';
  day_of_week?: number;
  day_of_month?: number;
  platform_id?: string | null;
  notes?: string;
}

export function useRecurringExpenses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recurring-expenses', user?.id],
    queryFn: async (): Promise<RecurringExpense[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RecurringExpense[];
    },
    enabled: !!user
  });
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateRecurringExpenseData) => {
      if (!user) throw new Error('Não autenticado');

      // Calcula a próxima data de vencimento
      const today = startOfDay(new Date());
      let nextDueDate: Date;

      if (data.frequency === 'weekly' && data.day_of_week !== undefined) {
        const currentDay = today.getDay();
        const daysUntilNext = (data.day_of_week - currentDay + 7) % 7 || 7;
        nextDueDate = addDays(today, daysUntilNext);
      } else if (data.frequency === 'monthly' && data.day_of_month !== undefined) {
        const currentDate = today.getDate();
        if (currentDate < data.day_of_month) {
          nextDueDate = new Date(today.getFullYear(), today.getMonth(), data.day_of_month);
        } else {
          nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, data.day_of_month);
        }
      } else {
        nextDueDate = addDays(today, 7);
      }

      const { data: result, error } = await supabase
        .from('recurring_expenses')
        .insert({
          user_id: user.id,
          category: data.category,
          amount: data.amount,
          frequency: data.frequency,
          day_of_week: data.frequency === 'weekly' ? data.day_of_week : null,
          day_of_month: data.frequency === 'monthly' ? data.day_of_month : null,
          platform_id: data.platform_id || null,
          notes: data.notes || null,
          next_due_date: format(nextDueDate, 'yyyy-MM-dd'),
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      toast({
        title: 'Gasto recorrente criado!',
        description: 'O lançamento será gerado automaticamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      toast({
        title: 'Gasto recorrente removido',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
}

export function useToggleRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      toast({
        title: is_active ? 'Gasto ativado' : 'Gasto pausado',
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

// Hook para processar gastos recorrentes pendentes
export function useProcessRecurringExpenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) return [];

      const today = format(new Date(), 'yyyy-MM-dd');

      // Buscar gastos recorrentes que precisam ser gerados
      const { data: pending, error: fetchError } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .lte('next_due_date', today);

      if (fetchError) throw fetchError;
      if (!pending || pending.length === 0) return [];

      const generatedExpenses = [];

      for (const recurring of pending) {
        // Criar o gasto
        const { data: expense, error: insertError } = await supabase
          .from('expenses')
          .insert({
            user_id: user.id,
            category: recurring.category,
            amount: recurring.amount,
            date: recurring.next_due_date,
            platform_id: recurring.platform_id,
            notes: `${recurring.notes || ''} (Recorrente)`.trim(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao criar gasto:', insertError);
          continue;
        }

        generatedExpenses.push(expense);

        // Calcular próxima data
        const currentDue = new Date(recurring.next_due_date + 'T00:00:00');
        let nextDue: Date;

        if (recurring.frequency === 'weekly') {
          nextDue = addDays(currentDue, 7);
        } else {
          nextDue = addMonths(currentDue, 1);
        }

        // Atualizar o recorrente
        await supabase
          .from('recurring_expenses')
          .update({
            last_generated_at: recurring.next_due_date,
            next_due_date: format(nextDue, 'yyyy-MM-dd'),
          })
          .eq('id', recurring.id);
      }

      return generatedExpenses;
    },
    onSuccess: (generated) => {
      if (generated && generated.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['expenses'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
        toast({
          title: `${generated.length} gasto(s) recorrente(s) gerado(s)`,
        });
      }
    }
  });
}
