import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled 
          ? "bg-background/95 backdrop-blur-lg border-b border-border shadow-lg" 
          : "bg-background/80 backdrop-blur-lg border-b border-border/50"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/landing" className="flex items-center gap-3">
          <img src={logo} alt="PEDY Driver" className="w-12 h-12 rounded-xl shadow-md object-cover" />
          <span className="font-bold text-lg">PEDY Driver</span>
        </Link>
        
        {/* CTA - Enhanced when scrolled */}
        <Link to="/auth">
          <Button 
            size="sm" 
            className={cn(
              "transition-all duration-300",
              scrolled 
                ? "bg-gradient-profit hover:opacity-90 shadow-md shadow-primary/25 scale-105" 
                : "bg-gradient-profit hover:opacity-90"
            )}
          >
            Começar grátis
          </Button>
        </Link>
      </div>
    </header>
  );
}
