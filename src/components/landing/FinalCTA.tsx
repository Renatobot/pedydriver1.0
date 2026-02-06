import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';
import { ACTIVE_USERS_COUNT } from '@/lib/constants';
import { useAnalytics } from '@/hooks/useAnalytics';

export function FinalCTA() {
  const { trackCTAClick } = useAnalytics();

  const handleCTAClick = () => {
    trackCTAClick('final_cta', '/landing');
  };

  return (
    <section className="px-4 py-16 sm:py-24 bg-gradient-to-b from-transparent via-primary/5 to-primary/10">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 mx-auto">
          <Rocket className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold">Pronto pra descobrir seu lucro real?</h2>
        
        <p className="text-muted-foreground">
          Crie sua conta em 30 segundos. É grátis, sem cartão, e você pode cancelar quando quiser.
        </p>
        
        <div className="space-y-3">
          <Link to="/auth" onClick={handleCTAClick}>
            <Button size="lg" className="bg-gradient-profit hover:opacity-90 text-lg px-10 py-6 h-auto touch-feedback">
              Criar minha conta grátis
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">Junte-se a +{ACTIVE_USERS_COUNT} motoristas</p>
        </div>
      </div>
    </section>
  );
}
