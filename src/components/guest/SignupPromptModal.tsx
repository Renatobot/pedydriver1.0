import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Check, ArrowRight, LogIn, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatCurrency } from '@/lib/formatters';

const FREE_FEATURES = [
  '30 registros por mês',
  '1 plataforma',
  'Histórico de 7 dias',
  'Cálculo de lucro real',
];

const PRO_FEATURES = [
  'Registros ilimitados',
  'Todas as plataformas',
  'Histórico completo',
  'Relatórios avançados',
];

export function SignupPromptModal() {
  const navigate = useNavigate();
  const { 
    showSignupModal, 
    setShowSignupModal, 
    signupModalReason, 
    guestEntryCount,
    totalEarnings,
    totalExpenses,
    netProfit,
  } = useGuestMode();
  const { trackDemoSignupTriggered, trackDemoSignupClicked, trackDemoToAuth } = useAnalytics();

  // Track when modal opens
  useEffect(() => {
    if (showSignupModal) {
      trackDemoSignupTriggered(signupModalReason || 'manual');
    }
  }, [showSignupModal, signupModalReason, trackDemoSignupTriggered]);

  const handleSignup = () => {
    trackDemoSignupClicked();
    trackDemoToAuth('modal');
    setShowSignupModal(false);
    navigate('/auth?signup=true', { state: { fromDemo: true } });
  };

  const handleLogin = () => {
    setShowSignupModal(false);
    navigate('/auth?login=true');
  };

  const hasFinancialData = totalEarnings > 0 || totalExpenses > 0;

  return (
    <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-profit flex items-center justify-center shadow-lg">
            <Rocket className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            {hasFinancialData ? 'Não perca seus registros!' : 'Crie sua conta grátis'}
          </DialogTitle>
          
          <DialogDescription className="text-base text-muted-foreground">
            {hasFinancialData 
              ? 'Seus dados serão perdidos se você sair sem criar uma conta.'
              : 'Salve seus dados, acompanhe sua evolução e descubra onde está seu lucro de verdade.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Financial summary when user has data */}
        {hasFinancialData && (
          <div className="mt-2 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Ganhos</span>
                </div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalEarnings)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs text-muted-foreground">Gastos</span>
                </div>
                <p className="text-sm font-bold text-red-500">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Lucro</span>
                </div>
                <p className={`text-sm font-bold ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3 pt-2 border-t border-primary/10">
              <span className="font-semibold text-primary">{guestEntryCount} registro{guestEntryCount !== 1 ? 's' : ''}</span>
              {' '}serão salvos na sua conta
            </p>
          </div>
        )}

        {/* Simple notice when no financial data */}
        {!hasFinancialData && guestEntryCount > 0 && (
          <div className="mt-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-center">
              <span className="font-semibold text-primary">{guestEntryCount} registro{guestEntryCount !== 1 ? 's' : ''}</span>
              {' '}será{guestEntryCount !== 1 ? 'ão' : ''} salvo{guestEntryCount !== 1 ? 's' : ''} na sua conta
            </p>
          </div>
        )}

        {/* Plan summary - only show when no financial data for cleaner UI */}
        {!hasFinancialData && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Free plan */}
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground mb-2">GRÁTIS</p>
              <ul className="space-y-1.5">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-1.5 text-xs">
                    <Check className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Pro plan */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">PRO</p>
              <ul className="space-y-1.5">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-1.5 text-xs">
                    <Check className="w-3 h-3 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="mt-6 space-y-3">
          <Button
            size="lg"
            className="w-full h-12 bg-gradient-profit hover:opacity-90 text-base font-bold"
            onClick={handleSignup}
          >
            {hasFinancialData ? 'Salvar e criar conta' : 'Criar conta grátis'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Leva 1 minuto • Sem cartão
          </p>
          
          <button
            onClick={handleLogin}
            className="w-full text-sm text-primary hover:underline flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-4 h-4" />
            Já tenho conta → Entrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
