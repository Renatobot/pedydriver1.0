import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NotificationPreviewProps {
  title: string;
  body: string;
  icon?: string;
}

export function NotificationPreview({ title, body, icon = '📢' }: NotificationPreviewProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-muted-foreground font-medium">Pré-visualização</p>
      
      {/* Phone mockup */}
      <div className="relative w-[280px] h-[180px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] p-2 shadow-2xl border-4 border-slate-700">
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full" />
        
        {/* Screen */}
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[1.5rem] overflow-hidden relative">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-2 text-white/80 text-[10px]">
            <span className="font-medium">{timeStr}</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.01 21.49L23.64 7.05c.17-.22.17-.54 0-.76C21.07 2.38 16.48 0 11.99 0S2.92 2.38.37 6.29c-.17.22-.17.54 0 .76l11.63 14.44c.19.23.49.23.01 0z"/>
              </svg>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
              </svg>
            </div>
          </div>

          {/* Notification card */}
          <div className="mx-3 mt-4">
            <Card className="bg-white/95 dark:bg-slate-100 backdrop-blur-xl rounded-2xl p-3 shadow-lg border-0">
              <div className="flex items-start gap-3">
                {/* App icon */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-sm">
                  <img 
                    src="/icons/icon-192.png" 
                    alt="PEDY" 
                    className="w-7 h-7 rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<span class="text-lg">🚗</span>';
                    }}
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      PEDY Driver
                    </span>
                    <span className="text-[10px] text-slate-400">agora</span>
                  </div>
                  
                  <p className={cn(
                    "font-semibold text-slate-900 text-sm mt-0.5 line-clamp-1",
                    !title && "text-slate-400 italic"
                  )}>
                    {title || 'Título da notificação'}
                  </p>
                  
                  <p className={cn(
                    "text-slate-600 text-xs mt-0.5 line-clamp-2 leading-relaxed",
                    !body && "text-slate-400 italic"
                  )}>
                    {body || 'Corpo da mensagem aparecerá aqui...'}
                  </p>
                </div>
              </div>
              
              {/* Action buttons mockup */}
              <div className="flex gap-2 mt-3 pt-2 border-t border-slate-200">
                <button className="flex-1 text-[11px] font-medium text-primary py-1.5 rounded-lg bg-primary/10">
                  Abrir
                </button>
                <button className="flex-1 text-[11px] font-medium text-slate-500 py-1.5 rounded-lg bg-slate-100">
                  Depois
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-muted-foreground text-center max-w-[250px]">
        Aparência pode variar conforme dispositivo e sistema operacional
      </p>
    </div>
  );
}
