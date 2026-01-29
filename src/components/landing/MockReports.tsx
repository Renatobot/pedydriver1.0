import { Calendar, TrendingUp, Trophy } from 'lucide-react';

const weekDays = [
  { day: 'Seg', profit: 280, hours: 8 },
  { day: 'Ter', profit: 320, hours: 9 },
  { day: 'Qua', profit: 290, hours: 7 },
  { day: 'Qui', profit: 310, hours: 8 },
  { day: 'Sex', profit: 420, hours: 10, best: true },
  { day: 'Sáb', profit: 180, hours: 5 },
  { day: 'Dom', profit: 47, hours: 2 },
];

const maxProfit = Math.max(...weekDays.map(d => d.profit));

export function MockReports() {
  return (
    <div className="w-[280px] sm:w-[320px] flex-shrink-0 rounded-2xl bg-card border border-border/50 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Melhores dias</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Análise semanal</p>
      </div>
      
      {/* Best day highlight */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium">Melhor dia: <span className="text-primary font-bold">Sexta-feira</span></span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">R$ 42/hora em média</p>
      </div>
      
      {/* Bar chart */}
      <div className="p-4 space-y-3">
        {weekDays.map(({ day, profit, hours, best }) => (
          <div key={day} className="flex items-center gap-3">
            <span className={`text-xs w-8 ${best ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
              {day}
            </span>
            <div className="flex-1 h-6 bg-secondary/50 rounded-full overflow-hidden relative">
              <div 
                className={`h-full rounded-full transition-all ${best ? 'bg-gradient-profit' : 'bg-primary/60'}`}
                style={{ width: `${(profit / maxProfit) * 100}%` }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                R$ {profit}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Insight */}
      <div className="p-4 bg-secondary/30">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">Dica:</span> Sexta-feira você ganha 2x mais que domingo!
          </p>
        </div>
      </div>
    </div>
  );
}
