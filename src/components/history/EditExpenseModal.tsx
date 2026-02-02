import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, DollarSign, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useUpdateExpense } from '@/hooks/useExpenses';
import { Expense, ExpenseCategory } from '@/types/database';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/formatters';

const schema = z.object({
  date: z.date(),
  category: z.enum(['combustivel', 'manutencao', 'alimentacao', 'seguro', 'aluguel', 'internet', 'pedagio_estacionamento', 'outros'] as const),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  platform_id: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EditExpenseModalProps {
  expense: Expense | null;
  open: boolean;
  onClose: () => void;
}

export function EditExpenseModal({ expense, open, onClose }: EditExpenseModalProps) {
  const { data: platforms } = usePlatforms();
  const updateExpense = useUpdateExpense();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (expense) {
      reset({
        date: parseISO(expense.date),
        category: expense.category,
        amount: Number(expense.amount),
        platform_id: expense.platform_id || undefined,
        notes: expense.notes || '',
      });
    }
  }, [expense, reset]);

  const date = watch('date');

  const onSubmit = async (data: FormData) => {
    if (!expense) return;
    
    await updateExpense.mutateAsync({
      id: expense.id,
      category: data.category,
      amount: data.amount,
      date: format(data.date, 'yyyy-MM-dd'),
      platform_id: data.platform_id || null,
      notes: data.notes,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Gasto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'dd/MM/yyyy') : 'Selecione'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) setValue('date', d);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select 
              value={watch('category')}
              onValueChange={(v) => setValue('category', v as ExpenseCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0"
                className="pl-9 font-mono"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Platform (optional) */}
          <div className="space-y-2">
            <Label>Plataforma (opcional)</Label>
            <Select 
              value={watch('platform_id') || 'geral'}
              onValueChange={(v) => setValue('platform_id', v === 'geral' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Geral (divide entre todas)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral (divide entre todas)</SelectItem>
                {platforms?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Textarea
              placeholder="Ex: Troca de óleo"
              {...register('notes')}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-expense hover:opacity-90"
              disabled={updateExpense.isPending}
            >
              {updateExpense.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
