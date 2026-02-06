import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Check, ArrowRight, LogIn } from 'lucide-react';
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
  const { showSignupModal, setShowSignupModal, signupModalReason, guestEntryCount } = useGuestMode();
  const { trackDemoSignupTriggered, trackDemoSignupClicked } = useAnalytics();

  // Track when modal opens
  useEffect(() => {
    if (showSignupModal) {
      trackDemoSignupTriggered(signupModalReason || 'manual');
    }
  }, [showSignupModal, signupModalReason, trackDemoSignupTriggered]);

  const handleSignup = () => {
    trackDemoSignupClicked();
    setShowSignupModal(false);
    navigate('/auth?signup=true', { state: { fromDemo: true } });
  };

  const handleLogin = () => {
    setShowSignupModal(false);
    navigate('/auth?login=true');
  };

  return (
    <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-profit flex items-center justify-center shadow-lg">
            <Rocket className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Crie sua conta grátis
          </DialogTitle>
          
          <DialogDescription className="text-base text-muted-foreground">
            Salve seus dados, acompanhe sua evolução e descubra onde está seu lucro de verdade.
          </DialogDescription>
        </DialogHeader>

        {/* Guest data notice */}
        {guestEntryCount > 0 && (
          <div className="mt-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-center">
              <span className="font-semibold text-primary">{guestEntryCount} registro{guestEntryCount !== 1 ? 's' : ''}</span>
              {' '}será{guestEntryCount !== 1 ? 'ão' : ''} salvo{guestEntryCount !== 1 ? 's' : ''} na sua conta
            </p>
          </div>
        )}

        {/* Plan summary */}
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

        {/* CTA buttons */}
        <div className="mt-6 space-y-3">
          <Button
            size="lg"
            className="w-full h-12 bg-gradient-profit hover:opacity-90 text-base font-bold"
            onClick={handleSignup}
          >
            Criar conta grátis
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
