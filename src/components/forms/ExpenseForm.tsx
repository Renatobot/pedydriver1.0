import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, DollarSign, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useCreateExpenseOffline } from '@/hooks/useOfflineExpenses';
import { useCreateRecurringExpense } from '@/hooks/useRecurringExpenses';
import { ExpenseCategory } from '@/types/database';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/formatters';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { EntryLimitBlocker } from '@/components/subscription/EntryLimitBlocker';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

const schema = z.object({
  date: z.date(),
  category: z.enum(['combustivel', 'manutencao', 'alimentacao', 'seguro', 'aluguel', 'aluguel_veiculo', 'financiamento', 'internet', 'pedagio_estacionamento', 'outros'] as const),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  platform_id: z.string().optional(),
  notes: z.string().optional(),
  is_recurring: z.boolean().optional(),
  frequency: z.enum(['weekly', 'monthly']).optional(),
  day_of_week: z.number().optional(),
  day_of_month: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

interface ExpenseFormProps {
  onSuccess?: () => void;
}

// Categorias típicas de gastos recorrentes
const RECURRING_CATEGORIES: ExpenseCategory[] = ['aluguel_veiculo', 'financiamento', 'seguro', 'aluguel', 'internet'];

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const { data: platforms } = usePlatforms();
  const createExpense = useCreateExpenseOffline();
  const createRecurring = useCreateRecurringExpense();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { canAddEntry, isPro } = useSubscriptionContext();
  const [showBlocker, setShowBlocker] = useState(!canAddEntry);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date(),
      category: 'combustivel',
      amount: 0,
      is_recurring: false,
      frequency: 'monthly',
      day_of_month: new Date().getDate(),
      day_of_week: new Date().getDay(),
    }
  });

  const date = watch('date');
  const category = watch('category');
  const isRecurring = watch('is_recurring');
  const frequency = watch('frequency');
  const isBlocked = !canAddEntry && !isPro;
  
  // Sugere recorrência para categorias típicas
  const suggestRecurring = RECURRING_CATEGORIES.includes(category);

  const onSubmit = async (data: FormData) => {
    if (isBlocked) {
      setShowBlocker(true);
      return;
    }
    
    if (data.is_recurring) {
      // Criar gasto recorrente
      await createRecurring.mutateAsync({
        category: data.category,
        amount: data.amount,
        frequency: data.frequency || 'monthly',
        day_of_week: data.frequency === 'weekly' ? data.day_of_week : undefined,
        day_of_month: data.frequency === 'monthly' ? data.day_of_month : undefined,
        platform_id: data.platform_id || null,
        notes: data.notes,
      });
    } else {
      // Criar gasto único
      await createExpense.mutateAsync({
        category: data.category,
        amount: data.amount,
        date: format(data.date, 'yyyy-MM-dd'),
        platform_id: data.platform_id || null,
        notes: data.notes,
      });
    }
    
    reset();
    onSuccess?.();
  };

  const isPending = createExpense.isPending || createRecurring.isPending;

  return (
    <div className="relative">
      {isBlocked && showBlocker && (
        <EntryLimitBlocker onContinueViewing={() => setShowBlocker(false)} />
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-3 sm:space-y-4', isBlocked && 'opacity-50 pointer-events-none')}>
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

        {/* Recurring Toggle */}
        <div className={cn(
          'flex items-center justify-between p-3 rounded-lg border transition-colors',
          isRecurring ? 'border-primary bg-primary/5' : 'border-border',
          suggestRecurring && !isRecurring && 'border-amber-500/50 bg-amber-500/5'
        )}>
          <div className="flex items-center gap-2">
            <Repeat className={cn('w-4 h-4', isRecurring ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <Label className="text-sm cursor-pointer">Gasto Recorrente</Label>
              {suggestRecurring && !isRecurring && (
                <p className="text-2xs text-amber-600 dark:text-amber-400">
                  Recomendado para {EXPENSE_CATEGORY_LABELS[category]}
                </p>
              )}
            </div>
          </div>
          <Switch
            checked={isRecurring}
            onCheckedChange={(checked) => setValue('is_recurring', checked)}
          />
        </div>

        {/* Recurring Options */}
        {isRecurring && (
          <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="space-y-1.5">
              <Label className="text-sm">Frequência</Label>
              <Select 
                value={frequency}
                onValueChange={(v) => setValue('frequency', v as 'weekly' | 'monthly')}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frequency === 'weekly' && (
              <div className="space-y-1.5">
                <Label className="text-sm">Dia da Semana</Label>
                <Select 
                  value={String(watch('day_of_week'))}
                  onValueChange={(v) => setValue('day_of_week', Number(v))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={String(day.value)}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {frequency === 'monthly' && (
              <div className="space-y-1.5">
                <Label className="text-sm">Dia do Mês</Label>
                <Select 
                  value={String(watch('day_of_month'))}
                  onValueChange={(v) => setValue('day_of_month', Number(v))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-2xs text-muted-foreground">
                  Limitado a dia 28 para evitar problemas em meses curtos
                </p>
              </div>
            )}
          </div>
        )}

        {/* Date - only for non-recurring */}
        {!isRecurring && (
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
        )}

        {/* Platform (optional) */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-sm sm:text-base">Plataforma (opcional)</Label>
          <Select onValueChange={(v) => setValue('platform_id', v === 'geral' ? undefined : v)}>
            <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
              <SelectValue placeholder="Geral (divide entre todas)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geral" className="py-3">Geral (divide entre todas)</SelectItem>
              {platforms?.map((p) => (
                <SelectItem key={p.id} value={p.id} className="py-3">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-2xs sm:text-xs text-muted-foreground">
            Gastos "Geral" são divididos entre as plataformas
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-sm sm:text-base">Observação (opcional)</Label>
          <Textarea
            placeholder={isRecurring ? "Ex: Aluguel do carro - Localiza" : "Ex: Troca de óleo"}
            className="min-h-[60px] sm:min-h-[80px] text-sm sm:text-base"
            {...register('notes')}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-expense hover:opacity-90 touch-feedback" 
          disabled={isPending || isBlocked}
        >
          {isPending ? 'Salvando...' : isRecurring ? 'Criar Gasto Recorrente' : 'Registrar Gasto'}
        </Button>
      </form>
    </div>
  );
}
