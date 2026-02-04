import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLink {
  name: string;
  icon: string;
  deepLink: string;
  playStoreUrl: string;
  color: string;
}

const APP_LINKS: AppLink[] = [
  {
    name: 'Uber',
    icon: '🚗',
    deepLink: 'uberdriver://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.ubercab.driver',
    color: 'from-black to-gray-800',
  },
  {
    name: '99',
    icon: '🚕',
    deepLink: 'motorista99://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.taxis99.motorista',
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    name: 'iFood',
    icon: '🍔',
    deepLink: 'ifood-entregador://',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.ifood.deliveryman',
    color: 'from-red-500 to-red-600',
  },
];

export function QuickAppLinks() {
  const openApp = (app: AppLink) => {
    // Try to open the app via deep link
    const startTime = Date.now();
    
    // Create a hidden iframe to try the deep link (prevents page navigation)
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = app.deepLink;
    document.body.appendChild(iframe);

    // Also try window.location as fallback
    setTimeout(() => {
      // If we're still here after 1.5 seconds, the app probably isn't installed
      // Check if we've been away (app opened)
      if (Date.now() - startTime < 2000) {
        // User is still here, try Play Store
        window.open(app.playStoreUrl, '_blank');
      }
      document.body.removeChild(iframe);
    }, 1500);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {APP_LINKS.map((app) => (
        <button
          key={app.name}
          onClick={() => openApp(app)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50",
            "bg-card hover:bg-accent/50 transition-colors touch-feedback",
            "min-w-fit flex-shrink-0"
          )}
        >
          <span className="text-lg">{app.icon}</span>
          <span className="text-sm font-medium text-foreground">{app.name}</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
