import { HelpCircle, AlertTriangle } from 'lucide-react';

export function ProblemSection() {
  return (
    <section className="px-4 py-16 sm:py-20 bg-secondary/30">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/15 mx-auto">
          <HelpCircle className="w-8 h-8 text-orange-500" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold">
          Você sabe quanto realmente lucra por hora?
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <p>Gasolina, manutenção, taxas dos apps... No fim do mês, <strong className="text-foreground">quanto sobra de verdade no seu bolso?</strong></p>
          </div>
          <p className="text-muted-foreground">A maioria dos motoristas não sabe responder isso.</p>
        </div>
      </div>
    </section>
  );
}
