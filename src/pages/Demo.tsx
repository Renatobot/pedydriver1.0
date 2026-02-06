import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Minus, Fuel, Wrench, Coffee, MoreHorizontal } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { GuestModeBanner } from '@/components/guest/GuestModeBanner';
import { SignupPromptModal } from '@/components/guest/SignupPromptModal';
import { DemoQuickEntry } from '@/components/guest/DemoQuickEntry';
import { GuestMetrics } from '@/components/guest/GuestMetrics';
import { DemoProgressNudge } from '@/components/guest/DemoProgressNudge';
import { DemoExitIntent } from '@/components/guest/DemoExitIntent';
import { DemoSocialProof } from '@/components/guest/DemoSocialProof';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EXPENSE_CATEGORIES = [
  { id: 'combustivel', name: 'Combustível', icon: Fuel, color: 'bg-orange-500' },
  { id: 'manutencao', name: 'Manutenção', icon: Wrench, color: 'bg-blue-500' },
  { id: 'alimentacao', name: 'Alimentação', icon: Coffee, color: 'bg-yellow-500' },
  { id: 'outros', name: 'Outros', icon: MoreHorizontal, color: 'bg-gray-500' },
];

export default function Demo() {
  const { addGuestEntry } = useGuestMode();
  const { trackDemoPageView, trackDemoEntryAdded } = useAnalytics();
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('combustivel');
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track page view on mount
  useEffect(() => {
    trackDemoPageView();
  }, [trackDemoPageView]);

  const handleAddExpense = async () => {
    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    setIsSubmitting(true);
    try {
      await addGuestEntry({
        type: 'expense',
        amount,
        category: selectedCategory,
        platform_name: 'Geral',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      
      // Track expense added
      trackDemoEntryAdded('expense', { amount, category: selectedCategory });
      
      toast.success('Gasto registrado!');
      setExpenseAmount('');
      setIsExpenseOpen(false);
    } catch (error) {
      toast.error('Erro ao registrar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Guest mode banner */}
      <GuestModeBanner />
      
      {/* Signup prompt modal */}
      <SignupPromptModal />
      
      {/* Progress nudge - appears after 2 entries */}
      <DemoProgressNudge />
      
      {/* Exit intent detection */}
      <DemoExitIntent />

      {/* Content with top padding for banner */}
      <div className="pt-14 px-4 py-6 max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link 
            to="/landing" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </Link>
          
          <h1 className="text-lg font-bold">Teste o PEDY</h1>
          
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Social proof */}
        <DemoSocialProof />

        {/* Quick intro */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Registre seus ganhos e veja seu lucro real instantaneamente
          </p>
        </div>

        {/* Quick entry form */}
        <DemoQuickEntry />

        {/* Add expense button */}
        <Sheet open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Minus className="w-4 h-4 mr-2 text-destructive" />
              Adicionar gasto
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[80vh]">
            <SheetHeader>
              <SheetTitle>Registrar Gasto</SheetTitle>
            </SheetHeader>
            
            <div className="py-4 space-y-4">
              {/* Category selector */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <div className="grid grid-cols-4 gap-2">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                          selectedCategory === cat.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-secondary/50'
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', cat.color)}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-2xs font-medium">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="h-12 text-lg font-semibold text-center"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Submit button */}
              <Button
                className="w-full h-12"
                onClick={handleAddExpense}
                disabled={isSubmitting || !expenseAmount}
              >
                {isSubmitting ? 'Salvando...' : 'Registrar gasto'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Metrics */}
        <GuestMetrics />

        {/* CTA to signup */}
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <p className="text-sm text-center text-muted-foreground mb-3">
            Gostou? Crie sua conta grátis para salvar seus dados e acompanhar sua evolução
          </p>
          <Button
            asChild
            className="w-full bg-gradient-profit hover:opacity-90"
          >
            <Link to="/auth?signup=true" state={{ fromDemo: true }}>
              Criar conta grátis
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
