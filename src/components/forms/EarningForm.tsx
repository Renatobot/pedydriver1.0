import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, DollarSign, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useCreateEarningOffline } from '@/hooks/useOfflineEarnings';
import { ServiceType, EarningType, PaymentType } from '@/types/database';
import { SERVICE_TYPE_LABELS, EARNING_TYPE_LABELS, PAYMENT_TYPE_LABELS } from '@/lib/formatters';

const schema = z.object({
  date: z.date(),
  platform_id: z.string().min(1, 'Selecione uma plataforma'),
  service_type: z.enum(['corrida', 'entrega', 'outro'] as const),
  earning_type: z.enum(['corrida_entrega', 'gorjeta', 'bonus', 'ajuste'] as const),
  payment_type: z.enum(['imediato', 'app'] as const),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  service_count: z.number().min(0, 'Quantidade inválida'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EarningFormProps {
  onSuccess?: () => void;
}

export function EarningForm({ onSuccess }: EarningFormProps) {
  const { data: platforms } = usePlatforms();
  const createEarning = useCreateEarningOffline();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date(),
      service_type: 'corrida',
      earning_type: 'corrida_entrega',
      payment_type: 'app',
      amount: 0,
      service_count: 1,
    }
  });

  const date = watch('date');

  const onSubmit = async (data: FormData) => {
    await createEarning.mutateAsync({
      platform_id: data.platform_id,
      service_type: data.service_type,
      earning_type: data.earning_type,
      payment_type: data.payment_type,
      amount: data.amount,
      service_count: data.service_count,
      date: format(data.date, 'yyyy-MM-dd'),
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

      {/* Platform */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label className="text-sm sm:text-base">Plataforma</Label>
        <Select onValueChange={(v) => setValue('platform_id', v)}>
          <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {platforms?.map((p) => (
              <SelectItem key={p.id} value={p.id} className="py-3">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.platform_id && (
          <p className="text-2xs sm:text-xs text-destructive">{errors.platform_id.message}</p>
        )}
      </div>

      {/* Service Type & Earning Type */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-sm sm:text-base">Tipo</Label>
          <Select 
            defaultValue="corrida" 
            onValueChange={(v) => setValue('service_type', v as ServiceType)}
          >
            <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="py-3">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-sm sm:text-base">Ganho</Label>
          <Select 
            defaultValue="corrida_entrega" 
            onValueChange={(v) => setValue('earning_type', v as EarningType)}
          >
            <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EARNING_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="py-3">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payment Type */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label className="text-sm sm:text-base">Recebimento</Label>
        <Select 
          defaultValue="app" 
          onValueChange={(v) => setValue('payment_type', v as PaymentType)}
        >
          <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="py-3">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount & Service Count */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-sm sm:text-base">Qtd. Serviços</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              min="0"
              placeholder="1"
              className="pl-9 h-11 sm:h-12 font-mono text-sm sm:text-base"
              {...register('service_count', { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5 sm:space-y-2">
        <Label className="text-sm sm:text-base">Observação (opcional)</Label>
        <Textarea
          placeholder="Ex: Bônus por meta"
          className="min-h-[60px] sm:min-h-[80px] text-sm sm:text-base"
          {...register('notes')}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 sm:h-12 text-sm sm:text-base bg-gradient-profit hover:opacity-90 touch-feedback" 
        disabled={createEarning.isPending}
      >
        {createEarning.isPending ? 'Salvando...' : 'Registrar Ganho'}
      </Button>
    </form>
  );
}
