import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Target, DollarSign, Hash, Navigation, Clock, Loader2 } from 'lucide-react';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
import { toast } from 'sonner';

export function WeeklyGoalsSettings() {
  const { data: settings, isLoading } = useUserSettings();
  const updateMutation = useUpdateUserSettings();
  const [isSaving, setIsSaving] = useState(false);
  
  const [earnings, setEarnings] = useState<string>('1500');
  const [services, setServices] = useState<string>('50');
  const [km, setKm] = useState<string>('300');
  const [hours, setHours] = useState<string>('40');

  // Initialize values from settings when loaded
  useEffect(() => {
    if (settings) {
      setEarnings(String(settings.weekly_goal_earnings ?? 1500));
      setServices(String(settings.weekly_goal_services ?? 50));
      setKm(String(settings.weekly_goal_km ?? 300));
      setHours(String(settings.weekly_goal_hours ?? 40));
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        weekly_goal_earnings: Number(earnings) || 1500,
        weekly_goal_services: Number(services) || 50,
        weekly_goal_km: Number(km) || 300,
        weekly_goal_hours: Number(hours) || 40,
      });
      toast.success('Metas semanais atualizadas!');
    } catch {
      toast.error('Erro ao salvar metas');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Metas Semanais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Defina suas metas pessoais para acompanhar seu progresso semanal.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Earnings Goal */}
          <div className="space-y-2">
            <Label htmlFor="goal-earnings" className="flex items-center gap-1.5 text-sm">
              <DollarSign className="w-4 h-4 text-primary" />
              Ganhos (R$)
            </Label>
            <Input
              id="goal-earnings"
              type="number"
              inputMode="numeric"
              value={earnings}
              onChange={(e) => setEarnings(e.target.value)}
              placeholder="1500"
              min={0}
            />
          </div>

          {/* Services Goal */}
          <div className="space-y-2">
            <Label htmlFor="goal-services" className="flex items-center gap-1.5 text-sm">
              <Hash className="w-4 h-4 text-primary" />
              Serviços
            </Label>
            <Input
              id="goal-services"
              type="number"
              inputMode="numeric"
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder="50"
              min={0}
            />
          </div>

          {/* KM Goal */}
          <div className="space-y-2">
            <Label htmlFor="goal-km" className="flex items-center gap-1.5 text-sm">
              <Navigation className="w-4 h-4 text-primary" />
              Quilômetros
            </Label>
            <Input
              id="goal-km"
              type="number"
              inputMode="numeric"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              placeholder="300"
              min={0}
            />
          </div>

          {/* Hours Goal */}
          <div className="space-y-2">
            <Label htmlFor="goal-hours" className="flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              Horas
            </Label>
            <Input
              id="goal-hours"
              type="number"
              inputMode="numeric"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="40"
              min={0}
            />
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Metas'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
