import { Crown, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PremiumFeature, FEATURE_NAMES } from '@/types/subscription';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { PRICING } from '@/lib/constants';

interface UpgradeCardProps {
  feature?: PremiumFeature;
  compact?: boolean;
  className?: string;
}

const PRO_BENEFITS = [
  'Relatórios semanais e mensais',
  'Melhor dia para trabalhar',
  'Comparação entre plataformas',
  'Histórico ilimitado',
  'Plataformas ilimitadas',
];

export function UpgradeCard({ feature, compact = false, className }: UpgradeCardProps) {
  const featureName = feature ? FEATURE_NAMES[feature] : null;

  if (compact) {
    return (
      <Card className={cn(
        'p-4 sm:p-6 bg-card/95 backdrop-blur border-amber-500/20 max-w-sm',
        className
      )}>
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          
          <div className="space-y-1">
            <h3 className="font-bold text-lg">
              {featureName ? `Desbloqueie ${featureName}` : 'Plano PRO'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Convide amigos e ganhe 7 dias grátis!
            </p>
          </div>

          <Button asChild className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
            <Link to="/upgrade">
              Assinar PRO
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'p-6 sm:p-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800',
      className
    )}>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Crown className="w-7 h-7 text-white" />
          </div>
          
          <div className="space-y-1">
            <h3 className="font-bold text-xl">Desbloqueie o Plano PRO</h3>
            <p className="text-muted-foreground">
              Descubra onde vale a pena rodar e pare de perder tempo.
            </p>
          </div>
        </div>

        <ul className="space-y-2.5">
          {PRO_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2.5 text-sm">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              {benefit}
            </li>
          ))}
        </ul>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">R$ {PRICING.monthly.toFixed(2).replace('.', ',')}</span>
          <span className="text-muted-foreground">/mês</span>
          <span className="text-xs text-muted-foreground ml-2">ou R$ {PRICING.yearly}/ano</span>
        </div>

        <Button asChild size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
          <Link to="/upgrade">
            Assinar PRO
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
