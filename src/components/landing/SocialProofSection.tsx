import { Users, Quote } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useCountUp } from '@/hooks/useCountUp';

const testimonials = [
  {
    quote: 'Descobri que quinta e sexta são meus melhores dias. Parei de rodar domingo e meu lucro/hora subiu 35%!',
    name: 'Carlos',
    city: 'São Paulo',
  },
  {
    quote: 'Em 2 semanas já sabia exatamente meu custo por km. Agora só aceito corrida que vale a pena.',
    name: 'Marcos',
    city: 'Rio de Janeiro',
  },
  {
    quote: 'Fácil demais. Registro tudo enquanto espero passageiro. Melhor investimento que fiz.',
    name: 'Ana',
    city: 'Belo Horizonte',
  },
];

export function SocialProofSection() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });
  const count = useCountUp({ end: 500, duration: 2500, enabled: isVisible });

  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Counter */}
        <div className="text-center" ref={ref}>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/15 border border-primary/20">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold">
              <span className="tabular-nums">+{count}</span> motoristas controlam seus lucros
            </span>
          </div>
        </div>
        
        {/* Testimonials */}
        <div className="grid sm:grid-cols-3 gap-4">
          {testimonials.map(({ quote, name, city }) => (
            <div 
              key={name}
              className="p-5 rounded-2xl bg-card border border-border/50 space-y-4"
            >
              <Quote className="w-6 h-6 text-primary/40" />
              <p className="text-muted-foreground italic">"{quote}"</p>
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{city}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
