import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="px-4 py-16 sm:py-24 bg-gradient-to-b from-transparent via-primary/5 to-primary/10">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
          <Rocket className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold">Comece agora mesmo</h2>
        
        <p className="text-muted-foreground">
          Descubra quanto você realmente ganha. É grátis e leva menos de 1 minuto.
        </p>
        
        <div className="space-y-3">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-profit hover:opacity-90 text-lg px-10 py-6 h-auto touch-feedback">
              Começar grátis agora
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">Sem cartão • Sem compromisso</p>
        </div>
      </div>
    </section>
  );
}
