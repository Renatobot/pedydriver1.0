import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import logo from '@/assets/logo-optimized.webp';

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { trackCTAClick } = useAnalytics();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCTAClick = () => {
    trackCTAClick('header_cta', '/landing');
  };

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
        
        {/* CTA - Enhanced when scrolled with pulse animation */}
        <Link to="/demo" onClick={handleCTAClick}>
          <Button 
            size="sm" 
            className={cn(
              "transition-all duration-300 font-semibold",
              scrolled 
                ? "bg-gradient-profit hover:opacity-90 shadow-lg shadow-primary/30 scale-105 animate-[pulse_2s_ease-in-out_infinite]" 
                : "bg-gradient-profit hover:opacity-90",
              "sm:text-sm sm:px-4 sm:py-2"
            )}
          >
            Testar grátis
          </Button>
        </Link>
      </div>
    </header>
  );
}
