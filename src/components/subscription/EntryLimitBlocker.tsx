import { Lock, Crown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';

interface EntryLimitBlockerProps {
  onContinueViewing?: () => void;
}

export function EntryLimitBlocker({ onContinueViewing }: EntryLimitBlockerProps) {
  const { monthlyEntryCount, limits } = useSubscriptionContext();

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/95 backdrop-blur-sm rounded-2xl">
      <div className="text-center p-6 max-w-sm space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">
            Limite de Registros Atingido
          </h3>
          <p className="text-sm text-muted-foreground">
            Você usou todos os {limits.maxEntriesPerMonth} registros gratuitos deste mês.
          </p>
          <p className="text-sm text-muted-foreground">
            Para continuar acompanhando seus ganhos, ative o plano PRO.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <Button asChild className="w-full h-12 bg-gradient-profit hover:opacity-90">
            <Link to="/upgrade">
              <Crown className="w-4 h-4 mr-2" />
              Desbloquear Registros
            </Link>
          </Button>
          
          {onContinueViewing && (
            <Button 
              variant="ghost" 
              className="w-full text-sm text-muted-foreground"
              onClick={onContinueViewing}
            >
              <Eye className="w-4 h-4 mr-2" />
              Continuar visualizando
            </Button>
          )}
        </div>

        <p className="text-2xs text-muted-foreground">
          Seus dados estão seguros e não serão apagados
        </p>
      </div>
    </div>
  );
}
