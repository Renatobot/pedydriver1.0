import { TrendingUp, Clock, Car, Fuel } from 'lucide-react';

export function MockDashboard() {
  return (
    <div className="w-[280px] sm:w-[320px] flex-shrink-0 rounded-2xl bg-card border border-border/50 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gradient-profit p-4">
        <p className="text-primary-foreground/80 text-sm">Olá, João 👋</p>
        <p className="text-primary-foreground text-xs mt-1">Resumo semanal</p>
      </div>
      
      {/* Profit card */}
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Lucro da semana</span>
          </div>
          <p className="text-3xl font-bold text-primary">R$ 1.847,00</p>
          <p className="text-xs text-muted-foreground mt-1">+12% vs semana passada</p>
        </div>
        
        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Horas</span>
            </div>
            <p className="text-lg font-bold">42h</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>R$/hora</span>
            </div>
            <p className="text-lg font-bold text-primary">R$ 43,97</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Car className="w-3.5 h-3.5" />
              <span>Km rodados</span>
            </div>
            <p className="text-lg font-bold">892 km</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Fuel className="w-3.5 h-3.5" />
              <span>Gastos</span>
            </div>
            <p className="text-lg font-bold text-orange-500">R$ 453</p>
          </div>
        </div>
        
        {/* Platforms */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Plataformas:</span>
          <div className="flex gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-black text-white text-xs font-medium">Uber</span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-500 text-black text-xs font-medium">99</span>
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium">iFood</span>
          </div>
        </div>
      </div>
    </div>
  );
}
