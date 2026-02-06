import { Users } from 'lucide-react';
import { ACTIVE_USERS_COUNT } from '@/lib/constants';

export function DemoSocialProof() {
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-secondary/50 border border-border/50 mx-auto w-fit">
      <div className="flex -space-x-2">
        {/* Avatar stack - generic driver avatars */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-background flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">M</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 border-2 border-background flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">J</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-background flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">A</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="w-3.5 h-3.5" />
        <span>
          <span className="font-semibold text-foreground">+{ACTIVE_USERS_COUNT}</span> motoristas usam o PEDY
        </span>
      </div>
    </div>
  );
}
