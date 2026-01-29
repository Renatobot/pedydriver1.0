import { Crown, Check, Zap, BarChart3, Calendar, Infinity } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';

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

export default function Upgrade() {
  const { isPro, plan } = useSubscriptionContext();

  const handleSubscribe = async (priceType: 'monthly' | 'yearly') => {
    // TODO: Integrate with Stripe
    console.log('Subscribe to:', priceType);
  };

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
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">R$ 14,90</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ou R$ 99/ano (economize 45%)
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

        {/* FAQ or guarantee */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>💳 Pagamento seguro via Stripe</p>
          <p className="mt-1">Cancele quando quiser, sem complicação</p>
        </div>
      </div>
    </AppLayout>
  );
}
