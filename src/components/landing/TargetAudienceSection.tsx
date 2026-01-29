import { Car, Bike, Smartphone } from 'lucide-react';

const audiences = [
  { icon: Car, text: 'Motoristas de aplicativo' },
  { icon: Bike, text: 'Entregadores' },
  { icon: Smartphone, text: 'Uber, 99, iFood, InDrive e similares' },
];

export function TargetAudienceSection() {
  return (
    <section className="px-4 py-16 sm:py-20 bg-secondary/30">
      <div className="max-w-3xl mx-auto space-y-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">Para quem é o PEDY Driver?</h2>
        
        <div className="flex flex-wrap justify-center gap-4">
          {audiences.map(({ icon: Icon, text }) => (
            <div 
              key={text}
              className="flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border/50"
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="font-medium">{text}</span>
            </div>
          ))}
        </div>
        
        <p className="text-lg text-muted-foreground">
          Se você dirige para ganhar dinheiro, <span className="text-primary font-medium">isso é pra você</span>.
        </p>
      </div>
    </section>
  );
}
