import { useState } from 'react';
import { Bell, BellOff, Clock, TestTube, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useUserPush } from '@/hooks/useUserPush';
import { cn } from '@/lib/utils';

export function NotificationSettings() {
  const { 
    permission, 
    subscribe, 
    sendTestNotification, 
    isSupported,
    isLoading,
    isSubscribed,
    reminderEnabled,
    reminderTime,
    setReminderEnabled,
    setReminderTime,
  } = useUserPush();
  
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    await subscribe();
    setIsEnabling(false);
  };

  const handleToggleReminder = async (enabled: boolean) => {
    await setReminderEnabled(enabled);
  };

  const handleTimeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await setReminderTime(e.target.value);
  };

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3 text-muted-foreground">
          <BellOff className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">Notificações não suportadas</p>
            <p className="text-xs">Instale o app na tela inicial para receber lembretes</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando configurações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Permission/Subscription Status */}
      {permission !== 'granted' || !isSubscribed ? (
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Ativar Lembretes Push</p>
                <p className="text-xs text-muted-foreground">
                  Receba lembretes mesmo com o app fechado
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableNotifications}
              disabled={isEnabling}
              className="shrink-0"
            >
              {isEnabling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Ativar'
              )}
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
              onCheckedChange={handleToggleReminder}
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
                onChange={handleTimeChange}
                className="w-32 touch-target"
              />
              
              <p className="text-xs text-muted-foreground">
                O lembrete será enviado diariamente neste horário, mesmo com o app fechado.
              </p>
              
              {/* Test Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={sendTestNotification}
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
