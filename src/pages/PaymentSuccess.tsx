import { useEffect, useState, useCallback } from 'react';
import { Crown, CheckCircle2, Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [claimAttempts, setClaimAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const MAX_ATTEMPTS = 10;
  const POLL_INTERVAL = 3000; // 3 seconds

  // Function to check if subscription is already PRO
  const checkSubscription = useCallback(async () => {
    if (!user?.id) return false;

    const { data } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single();

    if (data?.plan === 'pro' && data?.status === 'active') {
      setIsActivated(true);
      setIsLoading(false);
      // Invalidate subscription cache
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      return true;
    }
    return false;
  }, [user?.id, queryClient]);

  // Function to claim a pending payment
  const claimPayment = useCallback(async () => {
    if (!user?.id) return false;

    try {
      console.log('Attempting to claim payment...');
      
      const { data, error } = await supabase.functions.invoke('claim-payment');

      console.log('Claim response:', data, error);

      if (error) {
        console.error('Claim error:', error);
        return false;
      }

      if (data?.success) {
        if (data.already_pro) {
          console.log('User already has PRO');
        } else {
          console.log('Payment claimed successfully!');
        }
        setIsActivated(true);
        setIsLoading(false);
        // Invalidate subscription cache
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error claiming payment:', err);
      return false;
    }
  }, [user?.id, queryClient]);

  // Main effect to handle payment claiming and polling
  useEffect(() => {
    if (!user?.id || isActivated) return;

    const attemptActivation = async () => {
      // First, check if already PRO
      const alreadyPro = await checkSubscription();
      if (alreadyPro) return;

      // Try to claim payment
      const claimed = await claimPayment();
      if (claimed) return;

      // If not successful, increment attempts and try again
      setClaimAttempts(prev => prev + 1);
    };

    // Initial attempt
    if (claimAttempts === 0) {
      attemptActivation();
    } else if (claimAttempts < MAX_ATTEMPTS) {
      // Poll every 3 seconds
      const timer = setTimeout(attemptActivation, POLL_INTERVAL);
      return () => clearTimeout(timer);
    } else {
      // Max attempts reached
      setIsLoading(false);
      setError('Não foi possível ativar automaticamente. Por favor, aguarde alguns minutos ou entre em contato com o suporte.');
    }
  }, [user?.id, isActivated, claimAttempts, checkSubscription, claimPayment]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-xl border-amber-200 dark:border-amber-800">
        {/* Success Icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse opacity-30" />
          <div className="absolute inset-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            {isActivated ? (
              <CheckCircle2 className="w-12 h-12 text-white" />
            ) : error ? (
              <AlertCircle className="w-12 h-12 text-white" />
            ) : (
              <Crown className="w-12 h-12 text-white" />
            )}
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-amber-500 animate-bounce" />
          <Sparkles className="absolute -bottom-1 -left-3 w-6 h-6 text-orange-500 animate-bounce delay-150" />
        </div>

        {/* Thank you message */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            {isActivated ? 'Plano PRO Ativado!' : 'Obrigado pela compra!'}
          </h1>
          <p className="text-muted-foreground">
            {isActivated 
              ? 'Seu plano PRO está ativo. Aproveite todos os recursos!'
              : 'Seu pagamento foi recebido com sucesso.'}
          </p>
        </div>

        {/* Status */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-3">
          {isActivated ? (
            <>
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Plano PRO ativado!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Você já tem acesso a todos os recursos premium.
              </p>
            </>
          ) : error ? (
            <>
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Ativação pendente</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-semibold">Ativando seu plano PRO...</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Aguarde alguns segundos. Seu plano será ativado automaticamente.
                {claimAttempts > 0 && ` (Tentativa ${claimAttempts}/${MAX_ATTEMPTS})`}
              </p>
            </>
          )}
        </div>

        {/* User info */}
        {user?.email && (
          <p className="text-sm text-muted-foreground">
            Conta: <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}

        {/* Benefits reminder */}
        <div className="text-left space-y-2 pt-2">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {isActivated ? 'Agora você tem acesso a:' : 'Em breve você terá acesso a:'}
          </p>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              Relatórios semanais e mensais
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              Comparação entre plataformas
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              Registros ilimitados
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              Histórico completo
            </li>
          </ul>
        </div>

        {/* CTA Button */}
        <Button 
          onClick={() => navigate('/')}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          size="lg"
          disabled={isLoading && !isActivated}
        >
          {isActivated ? 'Ir para o Dashboard' : 'Aguarde...'}
          {isActivated && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>

        {/* Retry button if error */}
        {error && (
          <Button 
            onClick={() => {
              setError(null);
              setClaimAttempts(0);
              setIsLoading(true);
            }}
            variant="outline"
            className="w-full"
          >
            Tentar novamente
          </Button>
        )}

        {/* Support note */}
        <p className="text-xs text-muted-foreground">
          Problemas com a ativação? Entre em contato pelo suporte.
        </p>
      </Card>
    </div>
  );
}
