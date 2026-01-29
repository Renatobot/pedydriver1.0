import { HelpCircle, AlertTriangle } from 'lucide-react';

export function ProblemSection() {
  return (
    <section className="px-4 py-16 sm:py-20 bg-secondary/30">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mx-auto">
          <HelpCircle className="w-8 h-8 text-orange-500" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold">
          Você trabalha bastante, mas no fim do dia não sabe se realmente valeu a pena?
        </h2>
        
        <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <p>Com combustível, taxas e desgaste do veículo, <strong className="text-foreground">faturamento não é lucro</strong>.</p>
        </div>
      </div>
    </section>
  );
}
