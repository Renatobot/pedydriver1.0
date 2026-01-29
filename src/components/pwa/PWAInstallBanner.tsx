import { X, Smartphone, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

export function PWAInstallBanner() {
  const { canInstall, isInstalled, isDismissed, isIOS, installApp, dismissBanner } = usePWAInstall();

  // Don't show if installed, dismissed, or can't install
  if (isInstalled || isDismissed || !canInstall) {
    return null;
  }

  return (
    <div className={cn(
      "relative rounded-xl p-3 sm:p-4 border animate-in fade-in slide-in-from-top-2 duration-300",
      "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30"
    )}>
      {/* Close button */}
      <button
        onClick={dismissBanner}
        className="absolute top-2 right-2 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 sm:gap-4 pr-6">
        {/* Icon */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm sm:text-base text-foreground">
            Instale o PEDY Driver
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isIOS 
              ? 'Toque em Compartilhar e "Adicionar à Tela Inicial"'
              : 'Acesso rápido direto do seu celular!'
            }
          </p>
        </div>

        {/* Install Button */}
        {!isIOS && (
          <Button
            onClick={installApp}
            size="sm"
            className="flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Instalar</span>
          </Button>
        )}

        {/* iOS Share hint */}
        {isIOS && (
          <div className="flex-shrink-0 p-2 rounded-lg bg-primary/20">
            <Share className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
