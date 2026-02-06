import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';

export function HeroSection() {
  const { trackCTAClick } = useAnalytics();

  const handleCTAClick = () => {
    trackCTAClick('hero_cta', '/landing');
  };

  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-16 sm:pt-28 sm:pb-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      
      <div className="relative max-w-4xl mx-auto text-center space-y-6">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-profit glow-profit mx-auto">
          <Car className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" />
        </div>
        
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
          Descubra quanto você{' '}
          <span className="text-primary">realmente lucra</span>{' '}
          como motorista
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Chega de adivinhar. Registre seus ganhos e gastos em segundos e veja seu lucro real por hora, por km e por plataforma.
        </p>
        
        {/* CTA */}
        <div className="space-y-3 pt-4">
          <Link to="/demo" onClick={handleCTAClick}>
            <Button size="lg" className="bg-gradient-profit hover:opacity-90 text-lg px-8 py-6 h-auto touch-feedback">
              Testar grátis agora
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">Sem cadastro. Sem cartão. Experimente em 30 segundos.</p>
        </div>
      </div>
    </section>
  );
}
