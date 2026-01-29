import { Check, DollarSign, Clock, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react';

const solutions = [
  { icon: DollarSign, text: 'Registre ganhos e gastos' },
  { icon: TrendingUp, text: 'Veja seu lucro real' },
  { icon: Clock, text: 'Saiba quanto ganha por hora e por km' },
  { icon: BarChart3, text: 'Descubra os melhores dias e plataformas' },
  { icon: Lightbulb, text: 'Tome decisões melhores para ganhar mais' },
];

export function SolutionSection() {
  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Com o PEDY Driver você tem <span className="text-primary">controle total</span>
          </h2>
        </div>
        
        <ul className="space-y-4">
          {solutions.map(({ icon: Icon, text }) => (
            <li 
              key={text}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
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
