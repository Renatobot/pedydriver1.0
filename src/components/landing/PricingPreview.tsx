import { Check, Crown, Infinity, BarChart3, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const FREE_FEATURES = [
  'Registrar ganhos e gastos',
  'Ver lucro do dia',
  'R$/hora e R$/km do dia',
  'Até 30 registros/mês',
  '1 plataforma ativa',
  'Histórico de 7 dias',
];

const PRO_HIGHLIGHTS = [
  { text: 'Relatórios semanais e mensais', icon: Calendar },
  { text: 'Melhor dia para trabalhar', icon: BarChart3 },
  { text: 'Histórico ilimitado', icon: Infinity },
  { text: 'Plataformas ilimitadas', icon: Infinity },
];

export function PricingPreview() {
  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold">Comece grátis</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Você pode usar o PEDY Driver gratuitamente. Quando quiser relatórios completos e histórico ilimitado, é só ativar o plano PRO.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Free */}
          <Card className="p-6 space-y-5">
            <div>
              <h3 className="text-lg font-bold">Grátis pra sempre</h3>
              <p className="text-sm text-muted-foreground">Comece sem pagar nada</p>
            </div>
            
            <ul className="space-y-2.5">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-muted-foreground" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
            
            <Link to="/auth" className="block">
              <Button variant="outline" className="w-full">
                Começar grátis
              </Button>
            </Link>
          </Card>
          
          {/* PRO */}
          <Card className={cn(
            'p-6 space-y-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 relative overflow-hidden'
          )}>
            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              MAIS POPULAR
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">PRO</h3>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-sm text-muted-foreground">Para quem quer lucrar mais</p>
            </div>
            
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2.5 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                Tudo do plano gratuito
              </li>
              {PRO_HIGHLIGHTS.map(({ text, icon: Icon }) => (
                <li key={text} className="flex items-center gap-2.5 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
            
            <div className="space-y-2">
              <Link to="/upgrade" className="block">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                  Ver planos PRO
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground">Mais popular entre motoristas full-time</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
