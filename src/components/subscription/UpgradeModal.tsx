import { Crown, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PremiumFeature, FEATURE_NAMES } from '@/types/subscription';
import { Link } from 'react-router-dom';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: PremiumFeature;
}

const PRO_BENEFITS = [
  { text: 'Relatórios semanais e mensais', highlight: true },
  { text: 'Melhor dia para trabalhar', highlight: true },
  { text: 'Comparação entre plataformas', highlight: true },
  { text: 'Ranking de plataformas', highlight: false },
  { text: 'Histórico ilimitado', highlight: false },
  { text: 'Plataformas ilimitadas', highlight: false },
  { text: 'Registros ilimitados', highlight: false },
];

export function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  const featureName = feature ? FEATURE_NAMES[feature] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {featureName 
              ? `Desbloqueie ${featureName}` 
              : 'Upgrade para PRO'
            }
          </DialogTitle>
          <p className="text-center text-muted-foreground text-sm pt-2">
            Descubra onde vale a pena rodar e pare de perder tempo.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <ul className="space-y-2.5">
            {PRO_BENEFITS.map(({ text, highlight }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  highlight 
                    ? 'bg-emerald-500/20' 
                    : 'bg-muted'
                }`}>
                  <Check className={`w-3 h-3 ${
                    highlight 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <span className={highlight ? 'font-medium' : ''}>{text}</span>
              </li>
            ))}
          </ul>

          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold">R$ 14,90</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ou R$ 99/ano (economize 45%)
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
            <Link to="/upgrade" onClick={() => onOpenChange(false)}>
              Assinar PRO
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Continuar no plano gratuito
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
