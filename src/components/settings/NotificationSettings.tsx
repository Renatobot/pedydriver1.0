import { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useNotificationReminder } from '@/hooks/useNotificationReminder';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function NotificationSettings() {
  const { 
    permission, 
    requestPermission, 
    sendReminderNow, 
    isSupported,
    reminderEnabled,
    reminderTime,
    setReminderEnabled,
    setReminderTime,
  } = useNotificationReminder();
  const [localPermission, setLocalPermission] = useState(permission);

  useEffect(() => {
    setLocalPermission(permission);
  }, [permission]);

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    setLocalPermission(result);
    
    if (result === 'granted') {
      toast.success('Notificações ativadas!');
      setReminderEnabled(true);
    } else if (result === 'denied') {
      toast.error('Permissão negada. Habilite nas configurações do navegador.');
    }
  };

  const handleTestNotification = () => {
    sendReminderNow();
    toast.success('Notificação de teste enviada!');
  };

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3 text-muted-foreground">
          <BellOff className="w-5 h-5" />
          <span className="text-sm">Notificações não são suportadas neste navegador</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Permission Status */}
      {localPermission !== 'granted' ? (
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Ativar Lembretes</p>
                <p className="text-xs text-muted-foreground">
                  Receba lembretes para registrar seus ganhos
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableNotifications}
              className="shrink-0"
            >
              Ativar
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className={cn(
                "w-5 h-5",
                reminderEnabled ? "text-primary" : "text-muted-foreground"
              )} />
              <Label htmlFor="reminder-toggle" className="cursor-pointer">
                Lembrete diário
              </Label>
            </div>
            <Switch
              id="reminder-toggle"
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
            />
          </div>

          {/* Time Picker */}
          {reminderEnabled && (
            <div className="pl-8 space-y-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="reminder-time" className="text-sm text-muted-foreground">
                  Horário do lembrete
                </Label>
              </div>
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                className="w-32 touch-target"
              />
              
              {/* Test Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTestNotification}
                className="gap-2 text-muted-foreground"
              >
                <TestTube className="w-4 h-4" />
                Testar notificação
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
