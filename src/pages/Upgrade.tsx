import { useState } from 'react';
import { Crown, Check, Zap, BarChart3, Calendar, Infinity, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const FREE_FEATURES = [
  'Registrar ganhos e gastos',
  'Ver lucro do dia',
  'R$/hora e R$/km do dia',
  'Até 30 registros/mês',
  '1 plataforma ativa',
  'Histórico de 7 dias',
];

const PRO_FEATURES = [
  { text: 'Tudo do plano gratuito', icon: Check },
  { text: 'Relatórios semanais e mensais', icon: Calendar, highlight: true },
  { text: 'Melhor dia para trabalhar', icon: Zap, highlight: true },
  { text: 'Comparação entre plataformas', icon: BarChart3, highlight: true },
  { text: 'Ranking de plataformas', icon: BarChart3 },
  { text: 'Histórico ilimitado', icon: Infinity },
  { text: 'Plataformas ilimitadas', icon: Infinity },
  { text: 'Registros ilimitados', icon: Infinity },
];

const CHECKOUT_URLS = {
  monthly: 'https://checkout.infinitepay.io/pedy-solucoes_digitais/bCYVkN7lp',
  yearly: 'https://checkout.infinitepay.io/pedy-solucoes_digitais/B9y11x9Yl',
};

export default function Upgrade() {
  const { isPro, plan } = useSubscriptionContext();
  const { user } = useAuth();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = (priceType: 'monthly' | 'yearly') => {
    setSelectedPlan(priceType);
    setShowEmailModal(true);
  };

  const handleConfirmCheckout = async () => {
    if (!user?.email || !user?.id) {
      toast.error('Erro ao identificar usuário. Faça login novamente.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create payment intent to track this payment attempt
      const { error } = await supabase.from('payment_intents').insert({
        user_id: user.id,
        user_email: user.email,
        plan_type: selectedPlan === 'yearly' ? 'annual' : 'monthly',
      });

      if (error) {
        console.error('Error creating payment intent:', error);
        // Don't block payment, just log the error
      }

      setShowEmailModal(false);
      // Open correct InfinitePay checkout based on selected plan
      window.open(CHECKOUT_URLS[selectedPlan], '_blank');
    } catch (err) {
      console.error('Error in checkout:', err);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const userEmail = user?.email || '';

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-2">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Escolha seu plano</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Descubra onde vale a pena rodar e pare de perder tempo.
          </p>
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Free Plan */}
          <Card className={cn(
            'p-6 space-y-6',
            plan === 'free' && 'ring-2 ring-primary'
          )}>
            <div>
              <h3 className="text-lg font-bold">Gratuito</h3>
              <p className="text-sm text-muted-foreground">Para começar</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">R$ 0</span>
              <span className="text-muted-foreground">/mês</span>
            </div>

            <ul className="space-y-2.5">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-muted-foreground" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Button 
              variant="outline" 
              className="w-full" 
              disabled={plan === 'free'}
            >
              {plan === 'free' ? 'Plano atual' : 'Downgrade'}
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className={cn(
            'p-6 space-y-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 relative overflow-hidden',
            isPro && 'ring-2 ring-amber-500'
          )}>
            {/* Popular badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              POPULAR
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">PRO</h3>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm text-muted-foreground">Para motoristas sérios</p>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg text-muted-foreground line-through">R$ 29,90</span>
                <span className="text-3xl font-bold text-emerald-500">R$ 14,90</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ou <span className="line-through">R$ 149</span> <span className="font-medium text-emerald-600 dark:text-emerald-400">R$ 99/ano</span> (economize 34%)
              </p>
            </div>

            <ul className="space-y-2.5">
              {PRO_FEATURES.map(({ text, icon: Icon, highlight }) => (
                <li key={text} className="flex items-center gap-2.5 text-sm">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                    highlight ? 'bg-amber-500/20' : 'bg-emerald-500/10'
                  )}>
                    <Icon className={cn(
                      'w-3 h-3',
                      highlight ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    )} />
                  </div>
                  <span className={highlight ? 'font-medium' : ''}>{text}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              <Button 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                disabled={isPro}
                onClick={() => handleSubscribe('monthly')}
              >
                {isPro ? 'Plano atual' : 'Assinar mensal - R$ 14,90'}
              </Button>
              {!isPro && (
                <Button 
                  variant="outline"
                  className="w-full border-amber-300 dark:border-amber-700"
                  onClick={() => handleSubscribe('yearly')}
                >
                  Assinar anual - R$ 99 (45% off)
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Payment methods info */}
        <div className="text-center pt-4 space-y-3">
          <p className="text-sm font-medium">💳 Pagamento seguro</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
            {/* PIX option */}
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">PIX</span>
              <span className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded">sem taxa</span>
              <span className="text-muted-foreground line-through text-xs">R$ 29,90</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">R$ 14,90</span>
            </div>
            
            {/* Card option */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Cartão</span>
              <span className="text-xs">R$ 14,90 + taxa da operadora</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">Cancele quando quiser, sem complicação</p>
        </div>
      </div>

      {/* Email Confirmation Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Quase lá! Confirme seu e-mail
            </DialogTitle>
            <DialogDescription>
              Para ativar seu plano PRO automaticamente, use o <strong>mesmo e-mail</strong> cadastrado no app durante o pagamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User's email highlight */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Seu e-mail cadastrado:</p>
                  <p className="font-medium text-lg break-all">{userEmail}</p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Importante:</p>
                <p>Use exatamente este e-mail no checkout para que seu plano seja ativado automaticamente.</p>
              </div>
            </div>

            {/* Selected plan info */}
            <div className="text-center text-sm text-muted-foreground">
              Plano selecionado: <span className="font-medium text-foreground">
                {selectedPlan === 'monthly' ? 'Mensal - R$ 14,90' : 'Anual - R$ 99,00'}
              </span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowEmailModal(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmCheckout}
              disabled={isProcessing}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparando...
                </>
              ) : (
                'Entendi, ir para pagamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
