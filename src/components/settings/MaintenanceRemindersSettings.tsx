import { useState } from 'react';
import { Wrench, Plus, Check, Trash2, AlertTriangle, Info } from 'lucide-react';
import { useMaintenanceReminders, MAINTENANCE_TEMPLATES } from '@/hooks/useMaintenanceReminders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function MaintenanceRemindersSettings() {
  const {
    reminders,
    pendingReminders,
    currentKm,
    isLoading,
    addReminder,
    completeReminder,
    deleteReminder,
  } = useMaintenanceReminders();

  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customInterval, setCustomInterval] = useState('');

  const handleAddTemplate = (template: { name: string; interval_km: number }) => {
    // Check if already exists
    if (reminders.some(r => r.name === template.name)) {
      toast.error('Esse lembrete já existe');
      return;
    }

    addReminder.mutate(template, {
      onSuccess: () => {
        toast.success('Lembrete adicionado');
      },
    });
  };

  const handleAddCustom = () => {
    if (!customName.trim() || !customInterval) {
      toast.error('Preencha todos os campos');
      return;
    }

    const interval = parseInt(customInterval);
    if (interval < 100) {
      toast.error('Intervalo mínimo: 100 km');
      return;
    }

    addReminder.mutate(
      { name: customName.trim(), interval_km: interval },
      {
        onSuccess: () => {
          toast.success('Lembrete adicionado');
          setCustomName('');
          setCustomInterval('');
          setShowAddForm(false);
        },
      }
    );
  };

  const handleComplete = (id: string, name: string) => {
    completeReminder.mutate(id, {
      onSuccess: () => {
        toast.success(`${name} marcado como concluído`);
      },
    });
  };

  const handleDelete = (id: string, name: string) => {
    deleteReminder.mutate(id, {
      onSuccess: () => {
        toast.success(`${name} removido`);
      },
    });
  };

  const getProgress = (reminder: { last_km: number; interval_km: number }) => {
    const kmSince = currentKm - Number(reminder.last_km);
    return Math.min(100, (kmSince / reminder.interval_km) * 100);
  };

  const getKmRemaining = (reminder: { last_km: number; interval_km: number }) => {
    const kmSince = currentKm - Number(reminder.last_km);
    return Math.max(0, reminder.interval_km - kmSince);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4 text-primary" />
        <Label className="text-sm sm:text-base font-medium">Lembretes de Manutenção</Label>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Configure alertas baseados na sua quilometragem. Você será avisado quando chegar a hora de fazer a manutenção.
          <br />
          <span className="font-medium text-foreground">Km atual: {currentKm.toFixed(0)} km</span>
        </p>
      </div>

      {/* Existing reminders */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          {reminders.map((reminder) => {
            const isPending = pendingReminders.some(p => p.id === reminder.id);
            const progress = getProgress(reminder);
            const kmRemaining = getKmRemaining(reminder);

            return (
              <div
                key={reminder.id}
                className={cn(
                  "rounded-xl p-3 border transition-colors",
                  isPending 
                    ? "bg-amber-500/10 border-amber-500/30" 
                    : "bg-card border-border/50"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isPending && (
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}
                    <span className={cn(
                      "font-medium text-sm truncate",
                      isPending ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                    )}>
                      {reminder.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComplete(reminder.id, reminder.name)}
                      className="h-7 w-7 p-0 text-emerald-500 hover:bg-emerald-500/10"
                      title="Marcar como concluído"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(reminder.id, reminder.name)}
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      A cada {reminder.interval_km.toLocaleString('pt-BR')} km
                    </span>
                    <span className={cn(
                      "font-medium",
                      isPending ? "text-amber-500" : "text-foreground"
                    )}>
                      {isPending ? 'Pendente!' : `${kmRemaining.toLocaleString('pt-BR')} km restantes`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isPending 
                          ? "bg-amber-500" 
                          : progress >= 80 
                            ? "bg-amber-400" 
                            : "bg-primary"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add custom form */}
      {showAddForm ? (
        <div className="rounded-xl p-4 border border-border/50 bg-card space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Nome da manutenção</Label>
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ex: Troca de óleo"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Intervalo (km)</Label>
            <Input
              type="number"
              value={customInterval}
              onChange={(e) => setCustomInterval(e.target.value)}
              placeholder="Ex: 10000"
              className="h-10"
              min={100}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddCustom}
              disabled={addReminder.isPending}
              className="flex-1"
            >
              Adicionar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setCustomName('');
                setCustomInterval('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAddForm(true)}
          className="w-full h-10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar lembrete personalizado
        </Button>
      )}

      {/* Quick add templates */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Adicionar rapidamente:</p>
        <div className="flex flex-wrap gap-2">
          {MAINTENANCE_TEMPLATES.slice(0, 4).map((template) => {
            const exists = reminders.some(r => r.name === template.name);
            return (
              <Button
                key={template.name}
                variant="outline"
                size="sm"
                onClick={() => handleAddTemplate(template)}
                disabled={exists || addReminder.isPending}
                className={cn(
                  "h-8 text-xs",
                  exists && "opacity-50"
                )}
              >
                {template.name}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
