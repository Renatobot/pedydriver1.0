import { Shield, Settings, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo-optimized.webp';

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
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={logo} alt="PEDY Driver" className="w-12 h-12 rounded-xl shadow-md object-cover" />
            <span className="font-bold">PEDY Driver</span>
          </Link>
          
          {/* Legal Links */}
          <div className="flex justify-center gap-4 text-xs">
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Termos de Uso
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
          </div>
          
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PEDY Driver. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Uma solução da PEDY Soluções Digitais
          </p>
        </div>
      </div>
    </footer>
  );
}
