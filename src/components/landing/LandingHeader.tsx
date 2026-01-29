import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/landing" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-profit flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">PEDY Driver</span>
        </Link>
        
        {/* CTA */}
        <Link to="/auth">
          <Button size="sm" className="bg-gradient-profit hover:opacity-90">
            Começar grátis
          </Button>
        </Link>
      </div>
    </header>
  );
}
