import { Car, DollarSign, Receipt, Clock, Gift, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ReferralProgress {
  hasPending: boolean;
  accountAgeHours: number;
  hoursUntilEligible: number;
  criteriaMet: number;
  criteriaNeeded: number;
  hasVehicle: boolean;
  hasEarnings: boolean;
  hasExpenses: boolean;
  hasShifts: boolean;
  isEligible: boolean;
}

interface ReferralProgressBannerProps {
  progress: ReferralProgress;
  onCheckReferral?: () => void;
}

export function ReferralProgressBanner({ progress, onCheckReferral }: ReferralProgressBannerProps) {
  const { 
    hoursUntilEligible, 
    criteriaMet, 
    criteriaNeeded, 
    hasVehicle, 
    hasEarnings, 
    hasExpenses, 
    hasShifts,
    isEligible 
  } = progress;

  const progressPercent = Math.min((criteriaMet / criteriaNeeded) * 100, 100);

  const criteria = [
    { 
      id: 'vehicle', 
      label: 'Configurar veículo', 
      done: hasVehicle, 
      icon: Car,
      hint: 'Altere o tipo de veículo nas Configurações'
    },
    { 
      id: 'earnings', 
      label: 'Registrar 1 ganho', 
      done: hasEarnings, 
      icon: DollarSign,
      hint: 'Adicione sua primeira corrida ou entrega'
    },
    { 
      id: 'expenses', 
      label: 'Registrar 1 despesa', 
      done: hasExpenses, 
      icon: Receipt,
      hint: 'Adicione um gasto como combustível'
    },
    { 
      id: 'shifts', 
      label: 'Completar 1 turno', 
      done: hasShifts, 
      icon: Clock,
      hint: 'Registre um turno de trabalho'
    },
  ];

  // If eligible, try to complete the referral
  if (isEligible && onCheckReferral) {
    // Auto-trigger check on render
    setTimeout(onCheckReferral, 500);
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Ative seu bônus de indicação!</span>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progresso</span>
            <span className="text-primary font-medium">{criteriaMet}/{criteriaNeeded} ações</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Time remaining */}
        {hoursUntilEligible > 0 && (
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4" />
            <span>
              Validação disponível em <strong className="text-foreground">{Math.ceil(hoursUntilEligible)}h</strong>
            </span>
          </div>
        )}

        {/* Criteria list */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Complete <strong>2 ações</strong> para ganhar 7 dias PRO:</p>
          
          <div className="grid gap-1.5">
            {criteria.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg transition-colors',
                  item.done 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground'
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 flex-shrink-0" />
                )}
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className={cn(item.done && 'line-through opacity-70')}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ready message */}
        {isEligible && (
          <div className="mt-4 p-3 rounded-lg bg-primary/20 border border-primary/30 text-center">
            <p className="text-sm font-medium text-primary">
              🎉 Pronto! Seu bônus está sendo ativado...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
