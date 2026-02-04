import { Car, Bike, LogOut, User, Gauge, Calendar, Scale, Calculator, Bell, Crown, ArrowRight, Smartphone, Download, CheckCircle2, Sun, Moon, Monitor, MessageSquare, HelpCircle, Zap, Gift, Fuel, Wrench } from 'lucide-react';
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
import { useState, useEffect, useMemo } from 'react';
import { VehicleType, CostDistributionRule, FuelType } from '@/types/database';
import { VehicleCostCalculator } from '@/components/settings/VehicleCostCalculator';
import { WeeklyGoalsSettings } from '@/components/settings/WeeklyGoalsSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { MaintenanceRemindersSettings } from '@/components/settings/MaintenanceRemindersSettings';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { PremiumBadge } from '@/components/subscription/PremiumBadge';
import { Link } from 'react-router-dom';
import { SupportForm } from '@/components/support/SupportForm';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useGuidedTour } from '@/hooks/useGuidedTour';
import { ReferralCard } from '@/components/settings/ReferralCard';
import { EditProfileModal } from '@/components/settings/EditProfileModal';
import { isElectricVehicle, FUEL_LABELS, vehicleDatabase } from '@/lib/vehicleData';
import { useProfile } from '@/hooks/useProfile';
import logoWebp from '@/assets/logo-optimized.webp';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: settings, isLoading } = useUserSettings();
  const { data: profile } = useProfile();
  const updateSettings = useUpdateUserSettings();
  const { isPro, plan, limits, monthlyEntryCount, userPlatformCount } = useSubscriptionContext();
  const { canInstall, isInstalled, isDismissed, isIOS, installApp, resetDismiss } = usePWAInstall();
  const { theme, setTheme } = useTheme();
  const { resetTour } = useGuidedTour();
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [costPerKm, setCostPerKm] = useState('0.50');
  const [vehicleType, setVehicleType] = useState<VehicleType>('carro');
  const [vehicleModel, setVehicleModel] = useState<string | null>(null);
  const [fuelType, setFuelType] = useState<FuelType>('gasolina');
  const [distributionRule, setDistributionRule] = useState<CostDistributionRule>('km');
  const [weekStartsOn, setWeekStartsOn] = useState<'domingo' | 'segunda'>('segunda');
  const [showCalculator, setShowCalculator] = useState(false);

  // Verificar se o modelo selecionado é elétrico (para mostrar info de combustível)
  const selectedVehicleData = useMemo(() => {
    if (!vehicleModel) return null;
    return vehicleDatabase.find(v => v.name === vehicleModel) || null;
  }, [vehicleModel]);
  
  const showFuelInfo = useMemo(() => {
    // Mostrar info de combustível apenas para carro/moto não-elétricos
    if (vehicleType === 'bicicleta' || vehicleType === 'bicicleta_eletrica') return false;
    if (selectedVehicleData && isElectricVehicle(selectedVehicleData)) return false;
    return true;
  }, [vehicleType, selectedVehicleData]);

  useEffect(() => {
    if (settings) {
      setCostPerKm(String(settings.cost_per_km));
      setVehicleType(settings.vehicle_type);
      setVehicleModel(settings.vehicle_model || null);
      setFuelType((settings.fuel_type as FuelType) || 'gasolina');
      setDistributionRule(settings.cost_distribution_rule);
      setWeekStartsOn(settings.week_starts_on as 'domingo' | 'segunda');
    }
  }, [settings]);

  // Handler para mudar tipo de veículo - abre calculadora para selecionar modelo
  const handleVehicleTypeChange = (type: VehicleType) => {
    setVehicleType(type);
    setVehicleModel(null);
    // Se for bicicleta, resetar combustível
    if (type === 'bicicleta' || type === 'bicicleta_eletrica') {
      setFuelType('gasolina');
      updateSettings.mutate({ vehicle_type: type, vehicle_model: null, fuel_type: 'gasolina' });
    } else {
      updateSettings.mutate({ vehicle_type: type, vehicle_model: null });
    }
    // Abrir calculadora para selecionar modelo
    setShowCalculator(true);
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto scroll-momentum">
        {/* Header with Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img 
            src={logoWebp} 
            alt="PEDY Driver" 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-lg"
            width={80}
            height={80}
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
                {profile?.full_name || user?.user_metadata?.full_name || 'Usuário'}
              </p>
              {isPro && <PremiumBadge size="sm" variant="pill" />}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user?.email}</p>
            {profile?.phone && (
              <p className="text-xs text-muted-foreground truncate">{profile.phone}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEditProfile(true)}
            className="text-primary hover:bg-primary/10 flex-shrink-0"
          >
            Editar
          </Button>
        </div>

        {/* Edit Profile Modal */}
        <EditProfileModal
          open={showEditProfile}
          onOpenChange={setShowEditProfile}
          currentName={profile?.full_name || user?.user_metadata?.full_name || ''}
          currentPhone={profile?.phone || null}
          email={user?.email || ''}
        />

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

        {/* Referral Card */}
        <ReferralCard />

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
                  onClick={() => handleVehicleTypeChange('carro')}
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
                  onClick={() => handleVehicleTypeChange('moto')}
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
                  onClick={() => handleVehicleTypeChange('bicicleta')}
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
                  onClick={() => handleVehicleTypeChange('bicicleta_eletrica')}
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

            {/* Vehicle Summary Card - Mostra veículo configurado */}
            <div 
              className={cn(
                "rounded-xl p-3 sm:p-4 bg-muted/50 border border-border/50 space-y-2 transition-all duration-300 ease-out",
                vehicleModel 
                  ? "opacity-100 translate-y-0 scale-100" 
                  : "opacity-0 translate-y-2 scale-95 h-0 p-0 overflow-hidden border-0"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {vehicleType === 'carro' && <Car className="w-4 h-4 text-primary" />}
                  {vehicleType === 'moto' && <Bike className="w-4 h-4 text-primary" />}
                  {(vehicleType === 'bicicleta' || vehicleType === 'bicicleta_eletrica') && <Bike className="w-4 h-4 text-primary" />}
                  <span className="text-sm font-medium">{vehicleModel}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalculator(true)}
                  className="h-8 text-xs text-primary hover:bg-primary/10 transition-colors duration-200"
                >
                  Alterar
                </Button>
              </div>
              {showFuelInfo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Fuel className="w-3 h-3" />
                  <span>Combustível: <strong className="text-foreground">{FUEL_LABELS[fuelType]}</strong></span>
                </div>
              )}
            </div>
            
            {/* Botão para configurar veículo se ainda não configurou */}
            <div 
              className={cn(
                "transition-all duration-300 ease-out",
                !vehicleModel 
                  ? "opacity-100 translate-y-0 scale-100" 
                  : "opacity-0 -translate-y-2 scale-95 h-0 overflow-hidden"
              )}
            >
              <Button
                variant="outline"
                onClick={() => setShowCalculator(true)}
                className="w-full h-12 text-sm touch-feedback hover:border-primary hover:bg-primary/5 transition-all duration-200"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Configurar meu veículo
              </Button>
            </div>

            {/* Cost per KM - Show only if vehicle is configured */}
            {vehicleModel && (
              <div className="space-y-2 sm:space-y-3">
                <Label className="flex items-center gap-2 text-sm sm:text-base">
                  <Gauge className="w-4 h-4" />
                  Custo por Km (R$)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPerKm}
                    onChange={(e) => {
                      setCostPerKm(e.target.value);
                      updateSettings.mutate({ cost_per_km: parseFloat(e.target.value) || 0.5 });
                    }}
                    className="h-11 sm:h-12 font-mono text-sm sm:text-base flex-1"
                    placeholder="0.50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCalculator(true)}
                    className="h-11 sm:h-12 w-11 sm:w-12 touch-feedback"
                    title="Recalcular custo"
                  >
                    <Calculator className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-2xs sm:text-xs text-muted-foreground">
                  Custo de combustível + manutenção + desgaste
                </p>
              </div>
            )}

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

            {/* Maintenance Reminders */}
            <div className="rounded-xl p-4 bg-card border border-border/50">
              <MaintenanceRemindersSettings />
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
              onClick={resetTour}
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
        currentVehicleModel={vehicleModel}
        currentFuelType={fuelType}
        onApplyCost={(cost, newVehicleType, newVehicleModel, newFuelType) => {
          // Atualizar estado local
          setCostPerKm(cost.toFixed(2));
          setVehicleType(newVehicleType);
          setVehicleModel(newVehicleModel);
          setFuelType(newFuelType);
          // Salvar tudo no banco
          updateSettings.mutate({
            cost_per_km: cost,
            vehicle_type: newVehicleType,
            vehicle_model: newVehicleModel,
            fuel_type: newFuelType,
          });
        }}
      />

    </AppLayout>
  );
}
