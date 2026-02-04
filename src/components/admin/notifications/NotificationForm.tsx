import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Send, Clock, Repeat, X, Eye, EyeOff } from 'lucide-react';
import { 
  useRecipientCounts, 
  useSendNotification, 
  useScheduleNotification,
  useCreateRecurring 
} from '@/hooks/useAdminNotifications';
import { format } from 'date-fns';
import { NotificationPreview } from './NotificationPreview';

interface NotificationFormProps {
  initialValues?: {
    title: string;
    body: string;
    icon: string;
    url: string | null;
  } | null;
  onClearTemplate?: () => void;
}

type SendMode = 'now' | 'scheduled' | 'recurring';
type Frequency = 'daily' | 'weekly' | 'monthly';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export function NotificationForm({ initialValues, onClearTemplate }: NotificationFormProps) {
  const { data: counts } = useRecipientCounts();
  const sendNotification = useSendNotification();
  const scheduleNotification = useScheduleNotification();
  const createRecurring = useCreateRecurring();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [icon, setIcon] = useState('📢');
  const [url, setUrl] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'pro' | 'free' | 'inactive'>('all');
  const [inactiveDays, setInactiveDays] = useState(30);
  const [sendMode, setSendMode] = useState<SendMode>('now');
  
  // Scheduled fields
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Recurring fields
  const [recurringName, setRecurringName] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [timeOfDay, setTimeOfDay] = useState('20:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title);
      setBody(initialValues.body);
      setIcon(initialValues.icon);
      setUrl(initialValues.url || '');
    }
  }, [initialValues]);

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSubmit = async () => {
    if (!title || !body) return;

    if (sendMode === 'now') {
      await sendNotification.mutateAsync({
        title,
        body,
        icon,
        url: url || undefined,
        targetType,
        inactiveDays: targetType === 'inactive' ? inactiveDays : undefined
      });
    } else if (sendMode === 'scheduled') {
      if (!scheduledDate || !scheduledTime) return;
      
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      await scheduleNotification.mutateAsync({
        title,
        body,
        icon,
        url: url || undefined,
        targetType,
        inactiveDays: targetType === 'inactive' ? inactiveDays : undefined,
        scheduledAt
      });
    } else if (sendMode === 'recurring') {
      if (!recurringName) return;
      
      await createRecurring.mutateAsync({
        name: recurringName,
        title,
        body,
        icon,
        url: url || undefined,
        targetType,
        inactiveDays: targetType === 'inactive' ? inactiveDays : undefined,
        frequency,
        timeOfDay,
        daysOfWeek: frequency === 'weekly' ? selectedDays : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined
      });
    }

    // Reset form
    setTitle('');
    setBody('');
    setIcon('📢');
    setUrl('');
    setRecurringName('');
    onClearTemplate?.();
  };

  const isLoading = sendNotification.isPending || scheduleNotification.isPending || createRecurring.isPending;

  const getRecipientCount = () => {
    if (targetType === 'all') return counts?.all || 0;
    if (targetType === 'pro') return counts?.pro || 0;
    if (targetType === 'free') return counts?.free || 0;
    return '?';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Compor Notificação</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPreview(!showPreview)}
                className="lg:hidden"
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                Preview
              </Button>
              {initialValues && (
                <Button variant="ghost" size="sm" onClick={onClearTemplate}>
                  <X className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
        {/* Title & Body */}
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: 🚗 Oi, sentimos sua falta!"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Mensagem</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ex: Faz tempo que você não registra seus ganhos..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="icon">Emoji/Ícone</Label>
            <Input
              id="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📢"
              className="text-center text-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL ao clicar (opcional)</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/quick"
            />
          </div>
        </div>

        {/* Target Type */}
        <div className="space-y-2">
          <Label>Destinatários</Label>
          <RadioGroup value={targetType} onValueChange={(v) => setTargetType(v as typeof targetType)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="font-normal">
                Todos com push ({counts?.all || 0} usuários)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pro" id="pro" />
              <Label htmlFor="pro" className="font-normal">
                Usuários PRO ({counts?.pro || 0} usuários)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="free" id="free" />
              <Label htmlFor="free" className="font-normal">
                Usuários Gratuitos ({counts?.free || 0} usuários)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inactive" id="inactive" />
              <Label htmlFor="inactive" className="font-normal">
                Inativos há
              </Label>
              <Select 
                value={inactiveDays.toString()} 
                onValueChange={(v) => setInactiveDays(parseInt(v))}
                disabled={targetType !== 'inactive'}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7</SelectItem>
                  <SelectItem value="14">14</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                  <SelectItem value="90">90</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">dias</span>
            </div>
          </RadioGroup>
        </div>

        {/* Send Mode */}
        <div className="space-y-2">
          <Label>Quando enviar?</Label>
          <RadioGroup value={sendMode} onValueChange={(v) => setSendMode(v as SendMode)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="now" id="now" />
              <Label htmlFor="now" className="font-normal flex items-center gap-1">
                <Send className="w-4 h-4" />
                Enviar agora
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="scheduled" id="scheduled" />
              <Label htmlFor="scheduled" className="font-normal flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Agendar uma vez
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="recurring" id="recurring" />
              <Label htmlFor="recurring" className="font-normal flex items-center gap-1">
                <Repeat className="w-4 h-4" />
                Agendar recorrente
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Scheduled Options */}
        {sendMode === 'scheduled' && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <h4 className="font-medium text-sm">Agendamento Único</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Recurring Options */}
        {sendMode === 'recurring' && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <h4 className="font-medium text-sm">Agendamento Recorrente</h4>
            
            <div className="space-y-2">
              <Label htmlFor="recurringName">Nome da recorrência</Label>
              <Input
                id="recurringName"
                value={recurringName}
                onChange={(e) => setRecurringName(e.target.value)}
                placeholder="Ex: Lembrete diário noturno"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeOfDay">Horário</Label>
                <Input
                  id="timeOfDay"
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                />
              </div>
            </div>

            {frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Dias da semana</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-1">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={selectedDays.includes(day.value)}
                        onCheckedChange={() => handleDayToggle(day.value)}
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-sm font-normal">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {frequency === 'monthly' && (
              <div className="space-y-2">
                <Label>Dia do mês</Label>
                <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(parseInt(v))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(31)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Dia {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!title || !body || isLoading || (sendMode === 'recurring' && !recurringName)}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : sendMode === 'now' ? (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar para {getRecipientCount()} usuários
            </>
          ) : sendMode === 'scheduled' ? (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Agendar Notificação
            </>
          ) : (
            <>
              <Repeat className="w-4 h-4 mr-2" />
              Criar Recorrência
            </>
          )}
        </Button>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <div className={`${showPreview ? 'block' : 'hidden'} lg:block`}>
        <Card className="sticky top-4">
          <CardContent className="pt-6">
            <NotificationPreview 
              title={title}
              body={body}
              icon={icon}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
