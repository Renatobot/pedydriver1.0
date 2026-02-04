import { useState, useMemo } from 'react';
import { Square, Navigation, TrendingUp, Plus, Trash2, DollarSign, Fuel, ArrowRight, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveShift } from '@/hooks/useActiveShift';
import { usePlatforms } from '@/hooks/usePlatforms';
import { formatNumber, formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ExpenseCategory } from '@/types/database';

interface EndShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startKm: number;
}

interface TempEarning {
  id: string;
  amount: number;
  service_count: number;
  platform_id: string;
}

interface TempExpense {
  id: string;
  amount: number;
  category: ExpenseCategory;
}

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'combustivel', label: 'Combustível' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'pedagio_estacionamento', label: 'Pedágio/Estacionamento' },
  { value: 'outros', label: 'Outros' },
];

export function EndShiftModal({ open, onOpenChange, startKm }: EndShiftModalProps) {
  const { activeShift, endShift, isEnding, getDuration } = useActiveShift();
  const { data: platforms } = usePlatforms();
  
  // Step state
  const [step, setStep] = useState<1 | 2>(1);
  const [endKm, setEndKm] = useState('');
  
  // Temporary earnings/expenses
  const [tempEarnings, setTempEarnings] = useState<TempEarning[]>([]);
  const [tempExpenses, setTempExpenses] = useState<TempExpense[]>([]);
  
  // Form states for adding new earning/expense
  const [newEarningAmount, setNewEarningAmount] = useState('');
  const [newEarningServices, setNewEarningServices] = useState('1');
  const [newEarningPlatformId, setNewEarningPlatformId] = useState('');
  
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState<ExpenseCategory>('combustivel');

  const kmDriven = useMemo(() => {
    const endKmNum = parseFloat(endKm);
    if (isNaN(endKmNum) || endKmNum < startKm) return 0;
    return endKmNum - startKm;
  }, [endKm, startKm]);

  const shiftPlatformIds = activeShift?.platform_ids || (activeShift?.platform_id ? [activeShift.platform_id] : []);
  const shiftPlatforms = platforms?.filter(p => shiftPlatformIds.includes(p.id)) || [];

  // Initialize first platform selection
  const defaultPlatformId = shiftPlatformIds[0] || '';

  const totalEarnings = tempEarnings.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = tempExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalServices = tempEarnings.reduce((sum, e) => sum + e.service_count, 0);

  const handleContinue = () => {
    if (kmDriven <= 0) return;
    // Set default platform for new earnings
    if (!newEarningPlatformId && defaultPlatformId) {
      setNewEarningPlatformId(defaultPlatformId);
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleAddEarning = () => {
    const amount = parseFloat(newEarningAmount);
    const services = parseInt(newEarningServices) || 1;
    const platformId = newEarningPlatformId || defaultPlatformId;
    
    if (isNaN(amount) || amount <= 0 || !platformId) return;
    
    setTempEarnings(prev => [...prev, {
      id: `temp-${Date.now()}`,
      amount,
      service_count: services,
      platform_id: platformId,
    }]);
    
    setNewEarningAmount('');
    setNewEarningServices('1');
  };

  const handleRemoveEarning = (id: string) => {
    setTempEarnings(prev => prev.filter(e => e.id !== id));
  };

  const handleAddExpense = () => {
    const amount = parseFloat(newExpenseAmount);
    
    if (isNaN(amount) || amount <= 0) return;
    
    setTempExpenses(prev => [...prev, {
      id: `temp-${Date.now()}`,
      amount,
      category: newExpenseCategory,
    }]);
    
    setNewExpenseAmount('');
    setNewExpenseCategory('combustivel');
  };

  const handleRemoveExpense = (id: string) => {
    setTempExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleEnd = async (skip = false) => {
    const endKmNum = parseFloat(endKm);
    
    if (isNaN(endKmNum) || endKmNum < startKm) return;
    
    try {
      await endShift({
        endKm: endKmNum,
        earnings: skip ? [] : tempEarnings,
        expenses: skip ? [] : tempExpenses,
      });
      
      // Reset state
      setEndKm('');
      setStep(1);
      setTempEarnings([]);
      setTempExpenses([]);
      setNewEarningAmount('');
      setNewEarningServices('1');
      setNewEarningPlatformId('');
      setNewExpenseAmount('');
      setNewExpenseCategory('combustivel');
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setStep(1);
    setEndKm('');
    setTempEarnings([]);
    setTempExpenses([]);
    onOpenChange(false);
  };

  const getPlatformName = (platformId: string) => {
    return platforms?.find(p => p.id === platformId)?.name || 'Plataforma';
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Square className="w-4 h-4 text-primary" />
            </div>
            {step === 1 ? 'Finalizar Turno' : 'Registrar Ganhos e Gastos'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          // STEP 1: KM Final
          <div className="space-y-4 py-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Km Inicial</p>
                <p className="text-lg font-mono font-bold">{formatNumber(startKm, 0)}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-1">Duração</p>
                <p className="text-lg font-mono font-bold text-primary">{getDuration()}</p>
              </div>
            </div>

            {/* End KM */}
            <div className="space-y-2">
              <Label>Km Final do Odômetro</Label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={startKm}
                  placeholder={`Maior que ${formatNumber(startKm, 0)}`}
                  value={endKm}
                  onChange={(e) => setEndKm(e.target.value)}
                  className="pl-11 h-14 text-xl font-mono font-bold text-center"
                />
              </div>
            </div>

            {/* Calculated KM */}
            <div className={cn(
              "p-4 rounded-xl border text-center transition-all",
              kmDriven > 0 
                ? "bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30" 
                : "bg-muted/30 border-border/50"
            )}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className={cn(
                  "w-4 h-4",
                  kmDriven > 0 ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-xs text-muted-foreground">Km Rodados</span>
              </div>
              <p className={cn(
                "text-2xl font-mono font-bold transition-all",
                kmDriven > 0 ? "text-primary" : "text-muted-foreground"
              )}>
                {kmDriven > 0 ? formatNumber(kmDriven, 1) : '—'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleContinue}
                disabled={kmDriven <= 0}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <div className="flex items-center gap-2">
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Button>
            </div>
          </div>
        ) : (
          // STEP 2: Earnings & Expenses
          <div className="space-y-4 py-4">
            {/* Shift Summary */}
            <div className="p-3 rounded-xl bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Turno:</span>
                <span className="font-medium">{getDuration()} • {formatNumber(kmDriven, 1)} km</span>
              </div>
              {shiftPlatforms.length > 0 && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Plataformas:</span>
                  <span className="font-medium">{shiftPlatforms.map(p => p.name).join(', ')}</span>
                </div>
              )}
            </div>

            {/* Add Earnings Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <Label className="text-sm font-medium">Adicionar Ganhos</Label>
              </div>
              
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Valor"
                    value={newEarningAmount}
                    onChange={(e) => setNewEarningAmount(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Qtd"
                    value={newEarningServices}
                    onChange={(e) => setNewEarningServices(e.target.value)}
                    className="h-10 text-center"
                    min={1}
                  />
                </div>
                <div className="col-span-4">
                  <Select value={newEarningPlatformId || defaultPlatformId} onValueChange={setNewEarningPlatformId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Button 
                    type="button" 
                    size="icon" 
                    className="h-10 w-full"
                    onClick={handleAddEarning}
                    disabled={!newEarningAmount || parseFloat(newEarningAmount) <= 0}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Earnings List */}
              {tempEarnings.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {tempEarnings.map((earning) => (
                    <div 
                      key={earning.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                        <span className="text-sm font-medium">{formatCurrency(earning.amount)}</span>
                        <span className="text-xs text-muted-foreground">
                          ({earning.service_count} {earning.service_count === 1 ? 'serviço' : 'serviços'})
                        </span>
                        <span className="text-xs text-muted-foreground">• {getPlatformName(earning.platform_id)}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveEarning(earning.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Expenses Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-red-500" />
                <Label className="text-sm font-medium">Adicionar Gastos</Label>
              </div>
              
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Valor"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="col-span-6">
                  <Select value={newExpenseCategory} onValueChange={(v) => setNewExpenseCategory(v as ExpenseCategory)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Button 
                    type="button" 
                    size="icon" 
                    className="h-10 w-full"
                    onClick={handleAddExpense}
                    disabled={!newExpenseAmount || parseFloat(newExpenseAmount) <= 0}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Expenses List */}
              {tempExpenses.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {tempExpenses.map((expense) => (
                    <div 
                      key={expense.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <Fuel className="w-3 h-3 text-red-500" />
                        <span className="text-sm font-medium">{formatCurrency(expense.amount)}</span>
                        <span className="text-xs text-muted-foreground">• {getCategoryLabel(expense.category)}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveExpense(expense.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals Summary */}
            {(tempEarnings.length > 0 || tempExpenses.length > 0) && (
              <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                {tempEarnings.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Ganhos ({totalServices} serviços):</span>
                    <span className="font-medium text-emerald-500">{formatCurrency(totalEarnings)}</span>
                  </div>
                )}
                {tempExpenses.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Gastos:</span>
                    <span className="font-medium text-red-500">-{formatCurrency(totalExpenses)}</span>
                  </div>
                )}
                {tempEarnings.length > 0 && tempExpenses.length > 0 && (
                  <div className="flex justify-between text-sm pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">Lucro:</span>
                    <span className={cn(
                      "font-bold",
                      totalEarnings - totalExpenses >= 0 ? "text-primary" : "text-red-500"
                    )}>
                      {formatCurrency(totalEarnings - totalExpenses)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleEnd(true)}
                disabled={isEnding}
                className="flex-1"
              >
                Pular
              </Button>
              <Button
                onClick={() => handleEnd(false)}
                disabled={isEnding}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isEnding ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Square className="w-4 h-4" />
                    Finalizar
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
