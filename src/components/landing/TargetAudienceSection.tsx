import { Car, Bike, Package, Smartphone, Zap } from 'lucide-react';

const audiences = [
  { icon: Car, text: 'Uber e 99' },
  { icon: Package, text: 'iFood e Rappi' },
  { icon: Smartphone, text: 'InDrive e 99Food' },
  { icon: Bike, text: 'Ciclistas e bikers' },
];

const vehicleTypes = [
  { icon: Car, label: 'Carro', description: 'Gasolina, álcool, flex' },
  { icon: Bike, label: 'Moto', description: 'Maior custo-benefício' },
  { icon: Bike, label: 'Bicicleta', description: 'Só manutenção' },
  { icon: Zap, label: 'Bike Elétrica', description: 'km/kWh inteligente' },
];

export function TargetAudienceSection() {
  return (
    <section className="px-4 py-16 sm:py-20 bg-secondary/30">
      <div className="max-w-3xl mx-auto space-y-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">Feito para quem vive na rua</h2>
        
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
        
        {/* Vehicle Types Support */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">
            Suporte completo para todos os veículos
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {vehicleTypes.map(({ icon: Icon, label, description }) => (
              <div 
                key={label}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
            ))}
          </div>
        </div>
        
        <p className="text-lg text-muted-foreground">
          Se você roda para ganhar dinheiro, o <span className="text-primary font-medium">PEDY Driver é seu copiloto financeiro</span>.
        </p>
      </div>
    </section>
  );
}
