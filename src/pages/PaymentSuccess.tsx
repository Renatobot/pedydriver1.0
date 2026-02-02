import { useEffect, useState } from 'react';
import { Crown, CheckCircle2, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isActivated, setIsActivated] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  // Poll for subscription update
  useEffect(() => {
    if (!user?.id || isActivated) return;

    const checkSubscription = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .single();
      
      if (data?.plan === 'pro' && data?.status === 'active') {
        setIsActivated(true);
      } else if (checkCount < 10) {
        // Check again in 3 seconds
        setTimeout(() => setCheckCount(prev => prev + 1), 3000);
      }
    };

    checkSubscription();
  }, [user?.id, checkCount, isActivated]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-xl border-amber-200 dark:border-amber-800">
        {/* Success Icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse opacity-30" />
          <div className="absolute inset-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            {isActivated ? (
              <CheckCircle2 className="w-12 h-12 text-white" />
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
            Obrigado pela compra!
          </h1>
          <p className="text-muted-foreground">
            Seu pagamento foi recebido com sucesso.
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
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-semibold">Ativando seu plano PRO...</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Aguarde alguns segundos. Seu plano será ativado automaticamente.
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
            Agora você tem acesso a:
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
          onClick={() => navigate('/dashboard')}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          size="lg"
        >
          Ir para o Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        {/* Support note */}
        <p className="text-xs text-muted-foreground">
          Problemas com a ativação? Entre em contato pelo suporte.
        </p>
      </Card>
    </div>
  );
}
