import { PenLine, Eye, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: PenLine,
    title: 'Registre',
    description: 'Adicione ganhos e gastos rapidamente',
  },
  {
    icon: Eye,
    title: 'Veja',
    description: 'Acompanhe seu lucro real em tempo real',
  },
  {
    icon: CheckCircle,
    title: 'Decida',
    description: 'Saiba onde e quando vale mais a pena rodar',
  },
];

export function HowItWorksSection() {
  return (
    <section className="px-4 py-16 sm:py-20 bg-secondary/30">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Como funciona</h2>
          <p className="text-muted-foreground mt-2">Em 3 passos simples</p>
        </div>
        
        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <div 
              key={title}
              className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50"
            >
              {/* Step number */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                {index + 1}
              </div>
              
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mt-2">
                <Icon className="w-7 h-7 text-primary" />
              </div>
              
              <h3 className="text-xl font-bold mb-2">{title}</h3>
              <p className="text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
