import { Check, Clock, TrendingUp, BarChart3, Zap, Calendar } from 'lucide-react';

const solutions = [
  { icon: Zap, text: 'Registre ganhos e gastos em 10 segundos' },
  { icon: TrendingUp, text: 'Veja seu lucro líquido do dia, semana e mês' },
  { icon: Clock, text: 'Descubra seu R$/hora real (descontando gastos)' },
  { icon: BarChart3, text: 'Compare plataformas: Uber, 99, iFood, InDrive' },
  { icon: Calendar, text: 'Identifique seus melhores dias e horários' },
];

export function SolutionSection() {
  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 mx-auto">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Tenha clareza sobre <span className="text-primary">cada real</span> que você ganha
          </h2>
        </div>
        
        <ul className="space-y-4">
          {solutions.map(({ icon: Icon, text }) => (
            <li 
              key={text}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
