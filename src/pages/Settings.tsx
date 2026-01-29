import { Car, Bike, LogOut, User, Gauge, Calendar, Scale, Calculator } from 'lucide-react';
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
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground text-sm">Personalize sua experiência</p>
        </div>

        {/* User Info */}
        <div className="rounded-xl p-4 bg-card border border-border/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">
              {user?.user_metadata?.full_name || 'Usuário'}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vehicle Type */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                Tipo de Veículo
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setVehicleType('carro')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-4 rounded-xl border transition-all touch-target',
                    vehicleType === 'carro'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  )}
                >
                  <Car className="w-5 h-5" />
                  <span className="font-medium">Carro</span>
                </button>
                <button
                  onClick={() => setVehicleType('moto')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-4 rounded-xl border transition-all touch-target',
                    vehicleType === 'moto'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  )}
                >
                  <Bike className="w-5 h-5" />
                  <span className="font-medium">Moto</span>
                </button>
              </div>
            </div>

            {/* Cost per KM */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Custo por Km (R$)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={costPerKm}
                onChange={(e) => setCostPerKm(e.target.value)}
                className="touch-target font-mono"
                placeholder="0.50"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCalculator(true)}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Não sabe? Calcular meu custo
              </Button>
              <p className="text-2xs text-muted-foreground">
                Custo estimado de combustível + desgaste por quilômetro
              </p>
            </div>

            {/* Cost Distribution Rule */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Rateio de Custos Gerais
              </Label>
              <Select value={distributionRule} onValueChange={(v) => setDistributionRule(v as CostDistributionRule)}>
                <SelectTrigger className="touch-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">Por Km rodados</SelectItem>
                  <SelectItem value="horas">Por Horas trabalhadas</SelectItem>
                  <SelectItem value="receita">Por Receita gerada</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-2xs text-muted-foreground">
                Como distribuir gastos gerais entre as plataformas
              </p>
            </div>

            {/* Week Starts On */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Semana Inicia em
              </Label>
              <Select value={weekStartsOn} onValueChange={(v) => setWeekStartsOn(v as 'domingo' | 'segunda')}>
                <SelectTrigger className="touch-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="segunda">Segunda-feira</SelectItem>
                  <SelectItem value="domingo">Domingo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full touch-target"
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
            className="w-full touch-target text-destructive hover:text-destructive hover:bg-destructive/10"
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
