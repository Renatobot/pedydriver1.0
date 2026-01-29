import { Shield, Settings, XCircle, Car } from 'lucide-react';
import { Link } from 'react-router-dom';

const trustSignals = [
  { icon: Shield, text: 'Seus dados são privados' },
  { icon: Settings, text: 'Você controla tudo' },
  { icon: XCircle, text: 'Cancele quando quiser' },
];

export function TrustFooter() {
  return (
    <footer className="px-4 py-10 border-t border-border/50">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-6">
          {trustSignals.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="w-4 h-4 text-primary" />
              <span>{text}</span>
            </div>
          ))}
        </div>
        
        {/* Brand */}
        <div className="text-center space-y-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-profit flex items-center justify-center">
              <Car className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">PEDY Driver</span>
          </Link>
          
          <p className="text-xs text-muted-foreground">
            © 2026 PEDY Driver. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Uma solução da PEDY Soluções Digitais
          </p>
        </div>
      </div>
    </footer>
  );
}
