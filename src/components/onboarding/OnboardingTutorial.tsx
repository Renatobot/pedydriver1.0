import { useState } from 'react';
import { 
  BarChart3, 
  Plus, 
  FileText, 
  Settings, 
  MessageSquare, 
  ChevronRight, 
  ChevronLeft,
  Zap,
  Car,
  TrendingUp,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logoWebp from '@/assets/logo-3d-optimized.webp';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Car,
    title: 'Bem-vindo ao PEDY Driver! 🎉',
    description: 'Seu assistente financeiro para motoristas de app. Vamos fazer um tour rápido para você aproveitar ao máximo!',
    tip: 'Acompanhe seus ganhos, despesas e descubra quanto realmente está lucrando.',
    color: 'from-primary to-primary/80',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Principal',
    description: 'Na tela inicial você vê um resumo completo: ganhos, despesas, lucro real e métricas por plataforma.',
    tip: 'Use os filtros de data no topo para ver períodos específicos (hoje, semana, mês).',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Plus,
    title: 'Registrando Ganhos e Despesas',
    description: 'Toque no botão "+" na barra inferior para adicionar novos registros. Você pode registrar ganhos, despesas ou turnos de trabalho.',
    tip: 'O "Registro Rápido" (ícone de raio) permite registrar ganhos com apenas 2 toques!',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: Zap,
    title: 'Registro Rápido',
    description: 'Use o ícone de raio na barra inferior para registrar ganhos rapidamente enquanto dirige.',
    tip: 'Ideal para registrar corridas durante o expediente, sem perder tempo.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: FileText,
    title: 'Relatórios Detalhados',
    description: 'Na aba "Relatórios" você encontra análises completas: comparativo entre plataformas, melhores horários e muito mais.',
    tip: 'Descubra qual plataforma dá mais lucro e quais horários são mais rentáveis.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Settings,
    title: 'Configurações',
    description: 'Personalize o app nas Configurações: tipo de veículo, custo por km, tema escuro/claro e lembretes.',
    tip: 'Configure o custo por km para cálculos de lucro mais precisos.',
    color: 'from-slate-500 to-slate-600',
  },
  {
    icon: MessageSquare,
    title: 'Precisa de Ajuda? Suporte!',
    description: 'Encontrou algum problema? Vá em Configurações e role até a seção "Suporte" para enviar uma mensagem direta para nós.',
    tip: 'Respondemos todas as mensagens o mais rápido possível!',
    color: 'from-teal-500 to-teal-600',
    highlight: true,
  },
  {
    icon: TrendingUp,
    title: 'Pronto para começar!',
    description: 'Agora você está pronto para controlar suas finanças como um profissional. Bons trabalhos!',
    tip: 'Registre seus ganhos diariamente para ter uma visão completa do seu desempenho.',
    color: 'from-primary to-primary/80',
  },
];

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 safe-area-inset">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="relative p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <img src={logoWebp} alt="PEDY" className="w-8 h-8 rounded-lg" />
            <span className="font-semibold text-sm">Tutorial</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSkip}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-3 px-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === currentStep
                  ? 'w-6 bg-primary'
                  : index < currentStep
                  ? 'w-1.5 bg-primary/50'
                  : 'w-1.5 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg',
                step.color,
                step.highlight && 'ring-4 ring-primary/20 animate-pulse'
              )}
            >
              <step.icon className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-3">
            <h2 className="text-xl font-bold">{step.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Tip box */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-center">
              <span className="font-medium text-primary">💡 Dica:</span>{' '}
              <span className="text-foreground">{step.tip}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>

          <Button onClick={handleNext} className="gap-1">
            {isLastStep ? 'Começar' : 'Próximo'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
