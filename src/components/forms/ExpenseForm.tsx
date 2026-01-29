import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useCreateExpenseOffline } from '@/hooks/useOfflineExpenses';
import { ExpenseCategory } from '@/types/database';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/formatters';

const schema = z.object({
  date: z.date(),
  category: z.enum(['combustivel', 'manutencao', 'alimentacao', 'seguro', 'aluguel', 'internet', 'pedagio_estacionamento', 'outros'] as const),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  platform_id: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const { data: platforms } = usePlatforms();
  const createExpense = useCreateExpenseOffline();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date(),
      category: 'combustivel',
      amount: 0,
    }
  });

  const date = watch('date');

  const onSubmit = async (data: FormData) => {
    await createExpense.mutateAsync({
      category: data.category,
      amount: data.amount,
      date: format(data.date, 'yyyy-MM-dd'),
      platform_id: data.platform_id || null,
      notes: data.notes,
    });
    reset();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
      {/* Date */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label className="text-sm sm:text-base">Data</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal h-11 sm:h-12 text-sm sm:text-base',
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
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Category */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label className="text-sm sm:text-base">Categoria</Label>
        <Select 
          defaultValue="combustivel" 
          onValueChange={(v) => setValue('category', v as ExpenseCategory)}
        >
          <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="py-3">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label className="text-sm sm:text-base">Valor (R$)</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            className="pl-9 h-11 sm:h-12 font-mono text-sm sm:text-base"
            {...register('amount', { valueAsNumber: true })}
          />
        </div>
        {errors.amount && (
          <p className="text-2xs sm:text-xs text-destructive">{errors.amount.message}</p>
        )}
      </div>

      {/* Platform (optional) */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label className="text-sm sm:text-base">Plataforma (opcional)</Label>
        <Select onValueChange={(v) => setValue('platform_id', v === 'geral' ? undefined : v)}>
          <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
            <SelectValue placeholder="Geral (rateio)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="geral" className="py-3">Geral (rateio)</SelectItem>
            {platforms?.map((p) => (
              <SelectItem key={p.id} value={p.id} className="py-3">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-2xs sm:text-xs text-muted-foreground">
          Gastos "Geral" são rateados entre as plataformas
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label className="text-sm sm:text-base">Observação (opcional)</Label>
        <Textarea
          placeholder="Ex: Troca de óleo"
          className="min-h-[60px] sm:min-h-[80px] text-sm sm:text-base"
          {...register('notes')}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-expense hover:opacity-90 touch-feedback" 
        disabled={createExpense.isPending}
      >
        {createExpense.isPending ? 'Salvando...' : 'Registrar Gasto'}
      </Button>
    </form>
  );
}
