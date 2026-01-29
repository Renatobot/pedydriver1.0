import { DollarSign, Car, Clock, ChevronDown } from 'lucide-react';

export function MockEntry() {
  return (
    <div className="w-[280px] sm:w-[320px] flex-shrink-0 rounded-2xl bg-card border border-border/50 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h3 className="font-bold">Novo lançamento</h3>
        <p className="text-xs text-muted-foreground mt-1">Registre rapidamente</p>
      </div>
      
      {/* Form mockup */}
      <div className="p-4 space-y-4">
        {/* Platform select */}
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Plataforma</label>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                <span className="text-white text-xs font-bold">U</span>
              </span>
              <span className="text-sm">Uber</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        
        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Valor ganho</label>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border/50">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-medium">R$ 85,00</span>
          </div>
        </div>
        
        {/* Quick metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Horas</label>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">2h</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Km</label>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border/50">
              <Car className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">45 km</span>
            </div>
          </div>
        </div>
        
        {/* Save button */}
        <button className="w-full py-3 rounded-lg bg-gradient-profit text-primary-foreground font-medium">
          Salvar lançamento
        </button>
      </div>
    </div>
  );
}
