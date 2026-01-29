import { Car, Bike, LogOut, User, Gauge, Calendar, Scale, Calculator, Bell } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { VehicleType, CostDistributionRule } from '@/types/database';
import { VehicleCostCalculator } from '@/components/settings/VehicleCostCalculator';
import { NotificationSettings } from '@/components/settings/NotificationSettings';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();

  const [costPerKm, setCostPerKm] = useState('0.50');
  const [vehicleType, setVehicleType] = useState<VehicleType>('carro');
  const [distributionRule, setDistributionRule] = useState<CostDistributionRule>('km');
  const [weekStartsOn, setWeekStartsOn] = useState<'domingo' | 'segunda'>('segunda');
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    if (settings) {
      setCostPerKm(String(settings.cost_per_km));
      setVehicleType(settings.vehicle_type);
      setDistributionRule(settings.cost_distribution_rule);
      setWeekStartsOn(settings.week_starts_on as 'domingo' | 'segunda');
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      cost_per_km: parseFloat(costPerKm) || 0.5,
      vehicle_type: vehicleType,
      cost_distribution_rule: distributionRule,
      week_starts_on: weekStartsOn,
    });
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto scroll-momentum">
        {/* Header */}
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Personalize sua experiência</p>
        </div>

        {/* User Info */}
        <div className="rounded-xl p-3 sm:p-4 bg-card border border-border/50 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm sm:text-base text-foreground truncate">
              {user?.user_metadata?.full_name || 'Usuário'}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {/* Vehicle Type */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="flex items-center gap-2 text-sm sm:text-base">
                <Car className="w-4 h-4" />
                Tipo de Veículo
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => setVehicleType('carro')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border transition-all touch-feedback min-h-[52px] sm:min-h-[56px]',
                    vehicleType === 'carro'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50 active:border-primary/50'
                  )}
                >
                  <Car className="w-5 h-5" />
                  <span className="font-medium text-sm sm:text-base">Carro</span>
                </button>
                <button
                  onClick={() => setVehicleType('moto')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border transition-all touch-feedback min-h-[52px] sm:min-h-[56px]',
                    vehicleType === 'moto'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50 active:border-primary/50'
                  )}
                >
                  <Bike className="w-5 h-5" />
                  <span className="font-medium text-sm sm:text-base">Moto</span>
                </button>
              </div>
            </div>

            {/* Cost per KM */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="flex items-center gap-2 text-sm sm:text-base">
                <Gauge className="w-4 h-4" />
                Custo por Km (R$)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={costPerKm}
                onChange={(e) => setCostPerKm(e.target.value)}
                className="h-11 sm:h-12 font-mono text-sm sm:text-base"
                placeholder="0.50"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCalculator(true)}
                className="w-full h-10 sm:h-11 text-muted-foreground hover:text-foreground text-xs sm:text-sm touch-feedback"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Não sabe? Calcular meu custo
              </Button>
              <p className="text-2xs sm:text-xs text-muted-foreground">
                Custo estimado de combustível + desgaste por quilômetro
              </p>
            </div>

            {/* Cost Distribution Rule */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="flex items-center gap-2 text-sm sm:text-base">
                <Scale className="w-4 h-4" />
                Rateio de Custos Gerais
              </Label>
              <Select value={distributionRule} onValueChange={(v) => setDistributionRule(v as CostDistributionRule)}>
                <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="km" className="py-3">Por Km rodados</SelectItem>
                  <SelectItem value="horas" className="py-3">Por Horas trabalhadas</SelectItem>
                  <SelectItem value="receita" className="py-3">Por Receita gerada</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-2xs sm:text-xs text-muted-foreground">
                Como distribuir gastos gerais entre as plataformas
              </p>
            </div>

            {/* Week Starts On */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="w-4 h-4" />
                Semana Inicia em
              </Label>
              <Select value={weekStartsOn} onValueChange={(v) => setWeekStartsOn(v as 'domingo' | 'segunda')}>
                <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="segunda" className="py-3">Segunda-feira</SelectItem>
                  <SelectItem value="domingo" className="py-3">Domingo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="flex items-center gap-2 text-sm sm:text-base">
                <Bell className="w-4 h-4" />
                Lembretes
              </Label>
              <div className="rounded-xl p-3 sm:p-4 bg-muted/30 border border-border/50">
                <NotificationSettings />
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold touch-feedback"
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        )}

        {/* Logout */}
        <div className="pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full h-11 sm:h-12 text-sm sm:text-base text-destructive hover:text-destructive hover:bg-destructive/10 touch-feedback"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </div>
      </div>

      {/* Vehicle Cost Calculator Modal */}
      <VehicleCostCalculator
        open={showCalculator}
        onOpenChange={setShowCalculator}
        currentVehicleType={vehicleType}
        onApplyCost={(cost) => setCostPerKm(cost.toFixed(2))}
      />
    </AppLayout>
  );
}
