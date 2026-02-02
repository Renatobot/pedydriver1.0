import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, DollarSign, Hash, Loader2 } from 'lucide-react';
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
import { useUpdateEarning } from '@/hooks/useEarnings';
import { Earning, ServiceType, EarningType, PaymentType } from '@/types/database';
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

interface EditEarningModalProps {
  earning: Earning | null;
  open: boolean;
  onClose: () => void;
}

export function EditEarningModal({ earning, open, onClose }: EditEarningModalProps) {
  const { data: platforms } = usePlatforms();
  const updateEarning = useUpdateEarning();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (earning) {
      reset({
        date: parseISO(earning.date),
        platform_id: earning.platform_id || '',
        service_type: earning.service_type,
        earning_type: earning.earning_type,
        payment_type: earning.payment_type,
        amount: Number(earning.amount),
        service_count: earning.service_count,
        notes: earning.notes || '',
      });
    }
  }, [earning, reset]);

  const date = watch('date');

  const onSubmit = async (data: FormData) => {
    if (!earning) return;
    
    await updateEarning.mutateAsync({
      id: earning.id,
      platform_id: data.platform_id,
      service_type: data.service_type,
      earning_type: data.earning_type,
      payment_type: data.payment_type,
      amount: data.amount,
      service_count: data.service_count,
      date: format(data.date, 'yyyy-MM-dd'),
      notes: data.notes,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Ganho</DialogTitle>
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

          {/* Platform */}
          <div className="space-y-2">
            <Label>Plataforma</Label>
            <Select 
              value={watch('platform_id')} 
              onValueChange={(v) => setValue('platform_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {platforms?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.platform_id && (
              <p className="text-xs text-destructive">{errors.platform_id.message}</p>
            )}
          </div>

          {/* Service Type & Earning Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={watch('service_type')}
                onValueChange={(v) => setValue('service_type', v as ServiceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ganho</Label>
              <Select 
                value={watch('earning_type')}
                onValueChange={(v) => setValue('earning_type', v as EarningType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EARNING_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <Label>Recebimento</Label>
            <Select 
              value={watch('payment_type')}
              onValueChange={(v) => setValue('payment_type', v as PaymentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount & Service Count */}
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label>Qtd. Serviços</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  className="pl-9 font-mono"
                  {...register('service_count', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Textarea
              placeholder="Ex: Bônus por meta"
              {...register('notes')}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-profit hover:opacity-90"
              disabled={updateEarning.isPending}
            >
              {updateEarning.isPending ? (
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
