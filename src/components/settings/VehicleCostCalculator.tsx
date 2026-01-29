import { useState, useMemo } from 'react';
import { Calculator, Car, Bike, Fuel, Wrench, TrendingDown, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { VehicleType } from '@/types/database';
import { 
  getVehiclesByType, 
  VehicleData, 
  calculateCostPerKm, 
  CostBreakdown 
} from '@/lib/vehicleData';

interface VehicleCostCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVehicleType: VehicleType;
  onApplyCost: (cost: number) => void;
}

export function VehicleCostCalculator({ 
  open, 
  onOpenChange, 
  currentVehicleType,
  onApplyCost 
}: VehicleCostCalculatorProps) {
  const [vehicleType, setVehicleType] = useState<VehicleType>(currentVehicleType);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [fuelPrice, setFuelPrice] = useState('5.89');
  const [mileage, setMileage] = useState('');
  const [result, setResult] = useState<CostBreakdown | null>(null);

  const vehicles = useMemo(() => getVehiclesByType(vehicleType), [vehicleType]);

  const handleVehicleTypeChange = (type: VehicleType) => {
    setVehicleType(type);
    setSelectedVehicle(null);
    setResult(null);
  };

  const handleCalculate = () => {
    if (!selectedVehicle) return;
    
    const price = parseFloat(fuelPrice) || 0;
    const km = mileage ? parseInt(mileage, 10) : undefined;
    
    const breakdown = calculateCostPerKm(selectedVehicle, price, km);
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Calculadora de Custo por Km
          </DialogTitle>
          <DialogDescription>
            Informe seu veículo para calcular o custo estimado por quilômetro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Vehicle Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de Veículo</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleVehicleTypeChange('carro')}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-xl border transition-all',
                  vehicleType === 'carro'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                )}
              >
                <Car className="w-5 h-5" />
                <span className="font-medium">Carro</span>
              </button>
              <button
                type="button"
                onClick={() => handleVehicleTypeChange('moto')}
                className={cn(
                  'flex items-center justify-center gap-2 p-3 rounded-xl border transition-all',
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

          {/* Vehicle Model Selection */}
          <div className="space-y-2">
            <Label>Modelo do Veículo</Label>
            <Select 
              value={selectedVehicle?.name || ''} 
              onValueChange={(name) => {
                const vehicle = vehicles.find(v => v.name === name);
                setSelectedVehicle(vehicle || null);
                setResult(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modelo..." />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.name} value={vehicle.name}>
                    {vehicle.name} ({vehicle.consumptionCity} km/l cidade)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fuel Price */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Fuel className="w-4 h-4" />
              Preço do Combustível (R$/L)
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
              placeholder="5.89"
              className="font-mono"
            />
          </div>

          {/* Mileage (Optional) */}
          <div className="space-y-2">
            <Label>Quilometragem Atual (opcional)</Label>
            <Input
              type="number"
              min="0"
              value={mileage}
              onChange={(e) => {
                setMileage(e.target.value);
                setResult(null);
              }}
              placeholder="Ex: 50000"
              className="font-mono"
            />
            <p className="text-2xs text-muted-foreground">
              Veículos com mais de 100.000 km têm custo de manutenção maior
            </p>
          </div>

          {/* Calculate Button */}
          <Button 
            onClick={handleCalculate}
            disabled={!selectedVehicle || !fuelPrice}
            className="w-full"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calcular Custo
          </Button>

          {/* Results */}
          {result && (
            <div className="space-y-3 pt-2">
              <div className="h-px bg-border" />
              
              <div className="text-sm font-medium text-muted-foreground">
                Detalhamento do Custo:
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Combustível</span>
                  </div>
                  <span className="font-mono font-medium">
                    R$ {result.fuelCost.toFixed(2)}/km
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Manutenção</span>
                  </div>
                  <span className="font-mono font-medium">
                    R$ {result.maintenanceCost.toFixed(2)}/km
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Desgaste</span>
                  </div>
                  <span className="font-mono font-medium">
                    R$ {result.wearCost.toFixed(2)}/km
                  </span>
                </div>
              </div>
              
              <div className="h-px bg-border" />
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
                <span className="font-semibold text-primary">TOTAL</span>
                <span className="font-mono text-xl font-bold text-primary">
                  R$ {result.totalCost.toFixed(2)}/km
                </span>
              </div>

              <Button 
                onClick={handleApply}
                className="w-full"
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
