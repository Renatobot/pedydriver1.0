import { Check, Crown } from 'lucide-react';

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
  'Melhores horários',
];

export function PlanSummary() {
  return (
    <div className="w-full max-w-xs sm:max-w-sm mb-4 p-4 rounded-xl bg-secondary/50 border border-border/50 animate-fade-in">
      <div className="grid grid-cols-2 gap-3">
        {/* Free plan */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">GRÁTIS</p>
          <ul className="space-y-1">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-1.5 text-2xs sm:text-xs">
                <Check className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Pro plan */}
        <div>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
            <Crown className="w-3 h-3" />
            PRO
          </p>
          <ul className="space-y-1">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-1.5 text-2xs sm:text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <p className="text-2xs text-center text-muted-foreground mt-3 pt-3 border-t border-border/50">
        Você não precisa pagar nada para começar!
      </p>
    </div>
  );
}
