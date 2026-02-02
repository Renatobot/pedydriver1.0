import { useState, useMemo, useEffect } from 'react';
import { Calculator, Car, Bike, Fuel, Wrench, TrendingDown, Check, Zap, MapPin, Users, RefreshCw, Crown, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { VehicleType, FuelType } from '@/types/database';
import { 
  getVehiclesByType, 
  VehicleData, 
  calculateCostPerKm, 
  CostBreakdown,
  isElectricVehicle,
  isBicycle,
  hasEnergyCost,
  getConsumptionUnit,
  getConsumptionByFuelType,
  FUEL_PRICES,
  FUEL_LABELS,
  FUEL_UNITS,
  supportsFuelChoice
} from '@/lib/vehicleData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFuelPrices } from '@/hooks/useFuelPrices';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

// Interface para comparativo de combustíveis
interface FuelComparison {
  fuelType: FuelType;
  label: string;
  costPerKm: number;
  monthlyEstimate: number; // Para 1500km/mês
  savings: number; // Economia em relação ao mais caro
  isBest: boolean;
}

interface VehicleCostCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVehicleType: VehicleType;
  currentVehicleModel?: string | null;
  currentFuelType?: FuelType;
  onApplyCost: (cost: number) => void;
}

export function VehicleCostCalculator({ 
  open, 
  onOpenChange, 
  currentVehicleType,
  currentVehicleModel,
  currentFuelType = 'gasolina',
  onApplyCost 
}: VehicleCostCalculatorProps) {
  const [vehicleType, setVehicleType] = useState<VehicleType>(currentVehicleType);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [fuelType, setFuelType] = useState<FuelType>(currentFuelType);
  const [fuelPrice, setFuelPrice] = useState(String(FUEL_PRICES[currentFuelType]));
  const [mileage, setMileage] = useState('');
  const [result, setResult] = useState<CostBreakdown | null>(null);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [contributePrice, setContributePrice] = useState('');

  // Geolocalização e preços regionais
  const { location, isLoading: isLoadingLocation, error: locationError, requestLocation } = useGeolocation();
  const { 
    priceStats, 
    isLoadingStats, 
    canContribute, 
    contribute, 
    isContributing,
    setLocation,
    setFuelType: setFuelTypePrices
  } = useFuelPrices();

  const vehicles = useMemo(() => getVehiclesByType(vehicleType), [vehicleType]);
  
  const isElectric = selectedVehicle ? isElectricVehicle(selectedVehicle) : false;
  const isBike = selectedVehicle ? isBicycle(selectedVehicle) : false;
  const showEnergyInput = selectedVehicle ? hasEnergyCost(selectedVehicle) : true;
  const showFuelTypeSelector = selectedVehicle ? supportsFuelChoice(selectedVehicle) : (vehicleType === 'carro' || vehicleType === 'moto');

  // Subscription context para recursos Pro
  const { isPro } = useSubscriptionContext();

  // Calcular comparativo de combustíveis (Pro feature)
  const fuelComparison = useMemo((): FuelComparison[] | null => {
    if (!selectedVehicle || isElectric || isBike || !isPro) return null;

    // GNV só disponível para carros
    const fuelTypes: FuelType[] = vehicleType === 'carro' 
      ? ['gasolina', 'etanol', 'gnv'] 
      : ['gasolina', 'etanol'];
    const km = mileage ? parseInt(mileage, 10) : undefined;
    const monthlyKm = 1500; // Estimativa média mensal

    const comparisons = fuelTypes.map(ft => {
      const price = FUEL_PRICES[ft];
      const breakdown = calculateCostPerKm(selectedVehicle, price, km, false, ft);
      return {
        fuelType: ft,
        label: FUEL_LABELS[ft],
        costPerKm: breakdown.totalCost,
        monthlyEstimate: breakdown.totalCost * monthlyKm,
        savings: 0,
        isBest: false,
      };
    });

    // Ordenar por custo (menor primeiro)
    comparisons.sort((a, b) => a.costPerKm - b.costPerKm);
    
    // Marcar o melhor e calcular economia
    if (comparisons.length > 0) {
      comparisons[0].isBest = true;
      const worstCost = comparisons[comparisons.length - 1].monthlyEstimate;
      comparisons.forEach(c => {
        c.savings = worstCost - c.monthlyEstimate;
      });
    }

    return comparisons;
  }, [selectedVehicle, isElectric, isBike, isPro, mileage, vehicleType]);

  // Sincronizar com as props quando o modal abrir
  useEffect(() => {
    if (open) {
      setVehicleType(currentVehicleType);
      setFuelType(currentFuelType);
      setFuelTypePrices(currentFuelType);
      setResult(null);
      setShowContributeForm(false);
      
      // Se já temos um modelo selecionado, pré-selecionar
      if (currentVehicleModel) {
        const modelData = getVehiclesByType(currentVehicleType).find(v => v.name === currentVehicleModel);
        if (modelData) {
          setSelectedVehicle(modelData);
          // Ajustar preço baseado no tipo de veículo
          if (isElectricVehicle(modelData)) {
            setFuelPrice(String(FUEL_PRICES.eletrico));
          } else if (isBicycle(modelData)) {
            setFuelPrice('0');
          } else {
            setFuelPrice(String(FUEL_PRICES[currentFuelType]));
          }
        } else {
          setSelectedVehicle(null);
        }
      } else {
        setSelectedVehicle(null);
      }
    }
  }, [open, currentVehicleType, currentVehicleModel, currentFuelType, setFuelTypePrices]);

  // Auto-selecionar quando há apenas um veículo disponível para o tipo
  useEffect(() => {
    if (vehicles.length === 1 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles, selectedVehicle]);

  // Atualizar preço quando localização for detectada e tiver dados regionais
  useEffect(() => {
    if (location) {
      setLocation(location);
    }
  }, [location, setLocation]);

  // Atualizar preço sugerido quando priceStats mudar
  useEffect(() => {
    if (priceStats && priceStats.sampleCount >= 3 && !isElectric && !isBike) {
      setFuelPrice(String(priceStats.avgPrice));
    }
  }, [priceStats, isElectric, isBike]);

  // Atualizar preço padrão quando trocar entre elétrico e combustível ou tipo de combustível
  useEffect(() => {
    if (selectedVehicle) {
      if (isBicycle(selectedVehicle)) {
        setFuelPrice('0'); // Bicicleta comum não tem custo de energia
      } else if (isElectricVehicle(selectedVehicle)) {
        setFuelPrice(String(FUEL_PRICES.eletrico));
      } else if (!priceStats || priceStats.sampleCount < 3) {
        // Veículo a combustão sem dados regionais - usar preço padrão
        setFuelPrice(String(FUEL_PRICES[fuelType]));
      }
    }
  }, [selectedVehicle, fuelType, priceStats]);

  // Atualizar tipo de combustível no hook de preços
  useEffect(() => {
    setFuelTypePrices(fuelType);
  }, [fuelType, setFuelTypePrices]);

  const handleVehicleTypeChange = (type: VehicleType) => {
    setVehicleType(type);
    setSelectedVehicle(null);
    setResult(null);
  };

  const handleRequestLocation = async () => {
    const loc = await requestLocation();
    if (loc) {
      toast.success(`Localização detectada: ${loc.city}, ${loc.state}`);
    }
  };

  const handleFuelTypeChange = (newFuelType: FuelType) => {
    setFuelType(newFuelType);
    setFuelTypePrices(newFuelType);
    // Atualizar para preço regional se disponível, senão usar padrão
    if (priceStats && priceStats.sampleCount >= 3) {
      // Precisamos refetch com novo tipo
      setFuelPrice(String(FUEL_PRICES[newFuelType]));
    } else {
      setFuelPrice(String(FUEL_PRICES[newFuelType]));
    }
    setResult(null);
  };

  const handleContribute = () => {
    if (!location || !contributePrice) return;
    
    const price = parseFloat(contributePrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Informe um preço válido');
      return;
    }

    contribute({
      fuelType,
      price,
      city: location.city,
      state: location.state,
      latitude: location.latitude,
      longitude: location.longitude
    }, {
      onSuccess: () => {
        toast.success('Preço contribuído com sucesso! Obrigado por ajudar a comunidade.');
        setShowContributeForm(false);
        setContributePrice('');
      },
      onError: () => {
        toast.error('Erro ao contribuir preço. Tente novamente.');
      }
    });
  };

  const handleCalculate = () => {
    if (!selectedVehicle) return;
    
    const price = parseFloat(fuelPrice) || 0;
    const km = mileage ? parseInt(mileage, 10) : undefined;
    
    // Passar fuelType para o cálculo (considera fator de eficiência do etanol)
    const breakdown = calculateCostPerKm(selectedVehicle, price, km, false, fuelType);
    setResult(breakdown);
  };

  const handleApply = () => {
    if (result) {
      onApplyCost(result.totalCost);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto scroll-momentum mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Calculadora de Custo por Km
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Informe seu veículo para calcular o custo estimado por quilômetro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5 pt-2">
          {/* Geolocation Section */}
          {!isElectric && !isBike && (
            <div className="rounded-lg p-3 bg-muted/50 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">Preço Regional</span>
                </div>
                {!location ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRequestLocation}
                    disabled={isLoadingLocation}
                    className="h-7 text-xs"
                  >
                    {isLoadingLocation ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3 h-3 mr-1" />
                        Detectar Localização
                      </>
                    )}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {location.city}, {location.state}
                  </span>
                )}
              </div>
              
              {locationError && (
                <p className="text-2xs text-destructive">{locationError}</p>
              )}
              
              {location && priceStats && priceStats.sampleCount >= 3 && (
                <div className="flex items-center gap-2 text-xs">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Média regional: <strong className="text-foreground">R$ {priceStats.avgPrice.toFixed(2)}</strong>
                    <span className="text-2xs ml-1">({priceStats.sampleCount} contribuições)</span>
                  </span>
                </div>
              )}
              
              {location && (!priceStats || priceStats.sampleCount < 3) && (
                <p className="text-2xs text-muted-foreground">
                  Poucos dados na sua região. Contribua informando o preço que você pagou!
                </p>
              )}
              
              {location && canContribute && !showContributeForm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContributeForm(true)}
                  className="h-7 text-xs w-full"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Contribuir com preço da sua região
                </Button>
              )}
              
              {showContributeForm && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={contributePrice}
                      onChange={(e) => setContributePrice(e.target.value)}
                      placeholder={`Preço do ${FUEL_LABELS[fuelType]}`}
                      className="h-8 text-xs flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleContribute}
                      disabled={isContributing || !contributePrice}
                      className="h-8 text-xs"
                    >
                      {isContributing ? 'Enviando...' : 'Contribuir'}
                    </Button>
                  </div>
                  <button
                    onClick={() => setShowContributeForm(false)}
                    className="text-2xs text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Vehicle Type Selection */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-sm sm:text-base">Tipo de Veículo</Label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleVehicleTypeChange('carro')}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-xl border transition-all touch-feedback min-h-[48px]',
                  vehicleType === 'carro'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 active:border-primary/50'
                )}
              >
                <Car className="w-5 h-5" />
                <span className="font-medium text-sm sm:text-base">Carro</span>
              </button>
              <button
                type="button"
                onClick={() => handleVehicleTypeChange('moto')}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-xl border transition-all touch-feedback min-h-[48px]',
                  vehicleType === 'moto'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 active:border-primary/50'
                )}
              >
                <Bike className="w-5 h-5" />
                <span className="font-medium text-sm sm:text-base">Moto</span>
              </button>
              <button
                type="button"
                onClick={() => handleVehicleTypeChange('bicicleta')}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-xl border transition-all touch-feedback min-h-[48px]',
                  vehicleType === 'bicicleta'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 active:border-primary/50'
                )}
              >
                <Bike className="w-5 h-5" />
                <span className="font-medium text-sm sm:text-base">Bicicleta</span>
              </button>
              <button
                type="button"
                onClick={() => handleVehicleTypeChange('bicicleta_eletrica')}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-xl border transition-all touch-feedback min-h-[48px]',
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

          {/* Vehicle Model Selection */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm sm:text-base">Modelo do Veículo</Label>
            <Select 
              value={selectedVehicle?.name || ''} 
              onValueChange={(name) => {
                const vehicle = vehicles.find(v => v.name === name);
                setSelectedVehicle(vehicle || null);
                setResult(null);
              }}
            >
              <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder="Selecione o modelo..." />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => {
                  const consumption = getConsumptionByFuelType(vehicle, fuelType);
                  return (
                    <SelectItem key={vehicle.name} value={vehicle.name} className="py-3">
                      {isBicycle(vehicle) 
                        ? vehicle.name 
                        : `${vehicle.name} (${consumption.city} ${consumption.unit} cidade)`
                      }
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Fuel Type Selector - Only for combustion vehicles */}
          {showFuelTypeSelector && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-2 text-sm sm:text-base">
                <Fuel className="w-4 h-4" />
                Tipo de Combustível
              </Label>
              <div className={cn("grid gap-2", vehicleType === 'carro' ? "grid-cols-3" : "grid-cols-2")}>
                <button
                  type="button"
                  onClick={() => handleFuelTypeChange('gasolina')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 p-2 sm:p-3 rounded-lg border transition-all touch-feedback',
                    fuelType === 'gasolina'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  )}
                >
                  <span className="font-medium text-xs sm:text-sm">Gasolina</span>
                  <span className="text-2xs text-muted-foreground">R$ 5,89/L</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFuelTypeChange('etanol')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 p-2 sm:p-3 rounded-lg border transition-all touch-feedback',
                    fuelType === 'etanol'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  )}
                >
                  <span className="font-medium text-xs sm:text-sm">Etanol</span>
                  <span className="text-2xs text-muted-foreground">R$ 3,89/L</span>
                </button>
                {/* GNV só disponível para carros */}
                {vehicleType === 'carro' && (
                  <button
                    type="button"
                    onClick={() => handleFuelTypeChange('gnv')}
                    className={cn(
                      'flex flex-col items-center justify-center gap-0.5 p-2 sm:p-3 rounded-lg border transition-all touch-feedback',
                      fuelType === 'gnv'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    <span className="font-medium text-xs sm:text-sm">GNV</span>
                    <span className="text-2xs text-muted-foreground">R$ 3,99/m³</span>
                  </button>
                )}
              </div>
              {fuelType === 'etanol' && (
                <p className="text-2xs text-amber-600 dark:text-amber-400">
                  ⚠️ Etanol rende ~30% menos. O cálculo considera isso.
                </p>
              )}
              {fuelType === 'gnv' && (
                <p className="text-2xs text-green-600 dark:text-green-400">
                  ✓ GNV rende ~15% mais e é mais barato!
                </p>
              )}
              
              {/* Mostrar consumo estimado para o combustível selecionado */}
              {selectedVehicle && !isElectric && !isBike && (
                <div className="mt-2 p-2 rounded-lg bg-muted/50 border border-border">
                  <p className="text-2xs text-muted-foreground">
                    Consumo estimado com {FUEL_LABELS[fuelType]}:
                  </p>
                  <p className="text-xs font-medium">
                    {(() => {
                      const consumption = getConsumptionByFuelType(selectedVehicle, fuelType);
                      return `${consumption.city} ${consumption.unit} (cidade) • ${consumption.highway} ${consumption.unit} (estrada)`;
                    })()}
                  </p>
                </div>
              )}

              {/* Comparativo de combustíveis - Pro Feature */}
              {fuelComparison && fuelComparison.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">Comparativo de Combustíveis</span>
                  </div>
                  <div className="space-y-2">
                    {fuelComparison.map((fc, index) => (
                      <div 
                        key={fc.fuelType}
                        className={cn(
                          'flex items-center justify-between p-2 rounded-lg transition-all',
                          fc.isBest 
                            ? 'bg-green-500/10 border border-green-500/30' 
                            : 'bg-muted/30'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {fc.isBest && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                          <span className={cn(
                            'text-xs font-medium',
                            fc.isBest ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                          )}>
                            {fc.label}
                          </span>
                          {fc.isBest && (
                            <span className="text-2xs bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                              Mais econômico
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            'text-xs font-mono font-medium',
                            fc.isBest ? 'text-green-600 dark:text-green-400' : 'text-foreground'
                          )}>
                            R$ {fc.costPerKm.toFixed(2)}/km
                          </p>
                          {fc.savings > 0 && !fc.isBest && (
                            <p className="text-2xs text-destructive">
                              +R$ {fc.savings.toFixed(0)}/mês
                            </p>
                          )}
                          {fc.isBest && fuelComparison.length > 1 && (
                            <p className="text-2xs text-green-600 dark:text-green-400">
                              Economiza R$ {(fuelComparison[fuelComparison.length - 1].monthlyEstimate - fc.monthlyEstimate).toFixed(0)}/mês
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-2xs text-muted-foreground mt-2">
                    * Estimativa baseada em 1.500 km/mês com preços de referência
                  </p>
                </div>
              )}

              {/* Teaser para usuários Free */}
              {selectedVehicle && !isElectric && !isBike && !isPro && (
                <div className="mt-3 p-2 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-2xs text-muted-foreground">
                      Assine o Pro para ver qual combustível é mais vantajoso
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fuel/Energy Price - Only show for vehicles with energy cost */}
          {showEnergyInput && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="flex items-center gap-2 text-sm sm:text-base">
                {isElectric ? (
                  <Zap className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Fuel className="w-4 h-4" />
                )}
                {isElectric 
                  ? 'Preço da Energia (R$/kWh)' 
                  : `Preço do ${FUEL_LABELS[fuelType]} (${FUEL_UNITS[fuelType]})`
                }
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={fuelPrice}
                onChange={(e) => {
                  setFuelPrice(e.target.value);
                  setResult(null);
                }}
                placeholder={isElectric ? String(FUEL_PRICES.eletrico) : String(FUEL_PRICES[fuelType])}
                className="font-mono h-11 sm:h-12 text-sm sm:text-base"
              />
              {priceStats && priceStats.sampleCount >= 3 && !isElectric && !isBike && (
                <p className="text-2xs text-primary">
                  ✓ Preço atualizado com base na média da sua região
                </p>
              )}
            </div>
          )}

          {/* Info for regular bicycles */}
          {isBike && (
            <div className="rounded-lg p-3 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400">
              <p className="text-xs sm:text-sm">
                🚴 <strong>Desgaste físico:</strong> Não há gasto com combustível! O cálculo considera apenas manutenção (pneus, corrente, freios) e desgaste natural da bike.
              </p>
            </div>
          )}

          {/* Mileage (Optional) */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm sm:text-base">Quilometragem Atual (opcional)</Label>
            <Input
              type="number"
              min="0"
              value={mileage}
              onChange={(e) => {
                setMileage(e.target.value);
                setResult(null);
              }}
              placeholder="Ex: 50000"
              className="font-mono h-11 sm:h-12 text-sm sm:text-base"
            />
            <p className="text-2xs sm:text-xs text-muted-foreground">
              Veículos com mais de 100.000 km têm custo de manutenção maior
            </p>
          </div>

          {/* Calculate Button */}
          <Button 
            onClick={handleCalculate}
            disabled={!selectedVehicle || (!isBike && !fuelPrice)}
            className="w-full h-11 sm:h-12 text-sm sm:text-base touch-feedback"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calcular Custo
          </Button>

          {/* Results */}
          {result && (
            <div className="space-y-3 pt-2">
              <div className="h-px bg-border" />
              
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                Detalhamento do Custo:
              </div>
              
              <div className="space-y-2">
                {/* Energy cost - only show if not a regular bicycle */}
                {!result.isBicycle && (
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      {result.isElectric ? (
                        <Zap className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <Fuel className="w-4 h-4 text-orange-500" />
                      )}
                      <span className="text-xs sm:text-sm">
                        {result.isElectric ? 'Energia' : FUEL_LABELS[result.fuelType]}
                      </span>
                    </div>
                    <span className="font-mono text-sm sm:text-base font-medium">
                      R$ {result.fuelCost.toFixed(2)}/km
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-500" />
                    <span className="text-xs sm:text-sm">Manutenção</span>
                  </div>
                  <span className="font-mono text-sm sm:text-base font-medium">
                    R$ {result.maintenanceCost.toFixed(2)}/km
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-xs sm:text-sm">Desgaste</span>
                  </div>
                  <span className="font-mono text-sm sm:text-base font-medium">
                    R$ {result.wearCost.toFixed(2)}/km
                  </span>
                </div>
              </div>
              
              <div className="h-px bg-border" />
              
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-primary/10 border border-primary/20">
                <span className="font-semibold text-sm sm:text-base text-primary">TOTAL</span>
                <span className="font-mono text-lg sm:text-xl font-bold text-primary">
                  R$ {result.totalCost.toFixed(2)}/km
                </span>
              </div>

              <Button 
                onClick={handleApply}
                className="w-full h-11 sm:h-12 text-sm sm:text-base touch-feedback"
                variant="default"
              >
                <Check className="w-4 h-4 mr-2" />
                Usar Este Valor
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
