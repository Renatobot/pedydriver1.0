import { Car, Bike, LogOut, User, Gauge, Calendar, Scale, Calculator, Bell, Crown, ArrowRight, Smartphone, Download, CheckCircle2, Sun, Moon, Monitor, MessageSquare, HelpCircle, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
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
import { WeeklyGoalsSettings } from '@/components/settings/WeeklyGoalsSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { PremiumBadge } from '@/components/subscription/PremiumBadge';
import { Link } from 'react-router-dom';
import { SupportForm } from '@/components/support/SupportForm';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';
import logoWebp from '@/assets/logo-optimized.webp';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const { isPro, plan, limits, monthlyEntryCount, userPlatformCount } = useSubscriptionContext();
  const { canInstall, isInstalled, isDismissed, isIOS, installApp, resetDismiss } = usePWAInstall();
  const { theme, setTheme } = useTheme();
  const { showOnboarding, completeOnboarding, resetOnboarding } = useOnboarding();

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
        {/* Header with Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img 
            src={logoWebp} 
            alt="PEDY Driver" 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl shadow-md"
            width={56}
            height={56}
            loading="lazy"
          />
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Personalize sua experiência</p>
          </div>
        </div>

        {/* User Info */}
        <div className="rounded-xl p-3 sm:p-4 bg-card border border-border/50 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm sm:text-base text-foreground truncate">
                {user?.user_metadata?.full_name || 'Usuário'}
              </p>
              {isPro && <PremiumBadge size="sm" variant="pill" />}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        {/* Subscription Card */}
        <div className={cn(
          "rounded-xl p-4 sm:p-5 border",
          isPro 
            ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800"
            : "bg-card border-border/50"
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                isPro 
                  ? "bg-gradient-to-br from-amber-400 to-orange-500"
                  : "bg-secondary"
              )}>
                <Crown className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6",
                  isPro ? "text-white" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm sm:text-base">
                    {isPro ? 'Plano PRO' : 'Plano Gratuito'}
                  </h3>
                </div>
                {isPro ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Acesso completo a todas as funcionalidades
                  </p>
                ) : (
                  <div className="space-y-1 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {monthlyEntryCount}/{limits.maxEntriesPerMonth} registros este mês
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {userPlatformCount}/{limits.maxPlatforms} plataformas
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {!isPro && (
              <Button asChild size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex-shrink-0">
                <Link to="/upgrade">
                  Upgrade
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            )}
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
                <button
                  onClick={() => setVehicleType('bicicleta')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border transition-all touch-feedback min-h-[52px] sm:min-h-[56px]',
                    vehicleType === 'bicicleta'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50 active:border-primary/50'
                  )}
                >
                  <Bike className="w-5 h-5" />
                  <span className="font-medium text-sm sm:text-base">Bicicleta</span>
                </button>
                <button
                  onClick={() => setVehicleType('bicicleta_eletrica')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border transition-all touch-feedback min-h-[52px] sm:min-h-[56px]',
                    vehicleType === 'bicicleta_eletrica'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50 active:border-primary/50'
                  )}
                >
                  <div className="flex items-center gap-0.5">
                    <Bike className="w-5 h-5" />
                    <Zap className="w-3 h-3" />
                  </div>
                  <span className="font-medium text-sm sm:text-base">E-Bike</span>
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
                Dividir Custos Gerais
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

            {/* Theme Selector */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="flex items-center gap-2 text-sm sm:text-base">
                <Sun className="w-4 h-4" />
                Aparência
              </Label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-xl border transition-all touch-feedback min-h-[72px] sm:min-h-[80px]',
                    theme === 'light'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50 active:border-primary/50'
                  )}
                >
                  <Sun className="w-5 h-5" />
                  <span className="font-medium text-xs sm:text-sm">Claro</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-xl border transition-all touch-feedback min-h-[72px] sm:min-h-[80px]',
                    theme === 'dark'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50 active:border-primary/50'
                  )}
                >
                  <Moon className="w-5 h-5" />
                  <span className="font-medium text-xs sm:text-sm">Escuro</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-xl border transition-all touch-feedback min-h-[72px] sm:min-h-[80px]',
                    theme === 'system'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50 active:border-primary/50'
                  )}
                >
                  <Monitor className="w-5 h-5" />
                  <span className="font-medium text-xs sm:text-sm">Auto</span>
                </button>
              </div>
              <p className="text-2xs sm:text-xs text-muted-foreground">
                "Auto" segue a configuração do seu dispositivo
              </p>
            </div>

            {/* Weekly Goals */}
            <WeeklyGoalsSettings />

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

            {/* PWA Install Section */}
            {!isInstalled && (
              <div className="space-y-2 sm:space-y-3">
                <Label className="flex items-center gap-2 text-sm sm:text-base">
                  <Smartphone className="w-4 h-4" />
                  Instalar App
                </Label>
                <div className="rounded-xl p-3 sm:p-4 bg-muted/30 border border-border/50 space-y-3">
                  {isIOS ? (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Para instalar no iPhone/iPad: toque em <strong>Compartilhar</strong> e depois em <strong>"Adicionar à Tela Inicial"</strong>
                    </p>
                  ) : canInstall && !isDismissed ? (
                    <Button
                      onClick={installApp}
                      className="w-full h-10 sm:h-11 text-xs sm:text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Instalar PEDY Driver
                    </Button>
                  ) : isDismissed ? (
                    <Button
                      onClick={resetDismiss}
                      variant="outline"
                      className="w-full h-10 sm:h-11 text-xs sm:text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Mostrar opção de instalação
                    </Button>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      A instalação não está disponível neste navegador. Tente usar o Chrome ou Edge.
                    </p>
                  )}
                </div>
              </div>
            )}

            {isInstalled && (
              <div className="space-y-2 sm:space-y-3">
                <Label className="flex items-center gap-2 text-sm sm:text-base">
                  <Smartphone className="w-4 h-4" />
                  App Instalado
                </Label>
                <div className="rounded-xl p-3 sm:p-4 bg-primary/10 border border-primary/30 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-foreground">
                    O PEDY Driver está instalado no seu dispositivo!
                  </p>
                </div>
              </div>
            )}

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

        {/* Tutorial / Help Section */}
        <div className="space-y-2 sm:space-y-3">
          <Label className="flex items-center gap-2 text-sm sm:text-base">
            <HelpCircle className="w-4 h-4" />
            Ajuda
          </Label>
          <div className="rounded-xl p-3 sm:p-4 bg-muted/30 border border-border/50">
            <Button
              variant="outline"
              onClick={resetOnboarding}
              className="w-full h-10 sm:h-11 text-xs sm:text-sm"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Rever Tutorial do App
            </Button>
            <p className="text-2xs sm:text-xs text-muted-foreground mt-2 text-center">
              Veja novamente o passo a passo de como usar o PEDY Driver
            </p>
          </div>
        </div>

        {/* Support Section */}
        <div className="space-y-2 sm:space-y-3">
          <Label className="flex items-center gap-2 text-sm sm:text-base">
            <MessageSquare className="w-4 h-4" />
            Suporte
          </Label>
          <div className="rounded-xl p-3 sm:p-4 bg-muted/30 border border-border/50">
            <SupportForm />
          </div>
        </div>

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

      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <OnboardingTutorial onComplete={completeOnboarding} />
      )}
    </AppLayout>
  );
}
