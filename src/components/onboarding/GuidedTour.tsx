import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Play, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  route?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
  highlight?: boolean;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao PEDY Driver! 🚗',
    description: 'O app foi feito pra ser simples: você inicia o turno, trabalha, e no final registra seus ganhos e gastos. Vamos te mostrar como!',
    position: 'center',
    icon: <Play className="w-8 h-8" />,
  },
  {
    id: 'quick-entry',
    title: 'Registro Rápido ⚡',
    description: 'Durante o expediente, use o botão "Rápido" para registrar corridas com apenas 2 toques. Ideal pra não perder tempo!',
    targetSelector: '[href="/quick"]',
    route: '/',
    position: 'top',
    highlight: true,
  },
  {
    id: 'add-button',
    title: 'Lançar Registros',
    description: 'Aqui você encontra todas as opções: iniciar/encerrar turno, registrar ganhos, despesas e turnos manuais.',
    targetSelector: '[href="/add"]',
    route: '/',
    position: 'top',
    highlight: true,
  },
  {
    id: 'start-shift',
    title: 'Iniciar Turno 🟢',
    description: 'Quando começar a trabalhar, toque em "Iniciar Turno". Coloque o KM inicial do odômetro e selecione as plataformas.',
    route: '/add',
    position: 'center',
    icon: <Clock className="w-8 h-8" />,
  },
  {
    id: 'end-shift',
    title: 'Encerrar Turno 🔴',
    description: 'Ao terminar o expediente, encerre o turno. Informe o KM final e adicione os ganhos de cada plataforma + gastos do dia.',
    route: '/add',
    position: 'center',
    icon: <DollarSign className="w-8 h-8" />,
  },
  {
    id: 'dashboard',
    title: 'Resumo do Dashboard',
    description: 'Aqui você vê o resumo: quanto ganhou, quanto gastou e seu lucro real. Tudo calculado automaticamente!',
    targetSelector: '[href="/"]',
    route: '/',
    position: 'top',
    highlight: true,
  },
  {
    id: 'done',
    title: 'Pronto! ✅',
    description: 'É só isso! Inicie o turno → trabalhe → encerre com ganhos e gastos. Os relatórios e configurações são extras pra quem quer mais detalhes.',
    position: 'center',
    icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
  },
];

interface GuidedTourProps {
  onComplete: () => void;
}

export function GuidedTour({ onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Find and highlight target element
  const updateTargetRect = useCallback(() => {
    if (!step.targetSelector) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(step.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [step.targetSelector]);

  // Navigate to correct route and update target
  useEffect(() => {
    if (step.route && location.pathname !== step.route) {
      navigate(step.route);
    }
    
    // Small delay to let DOM update after navigation
    const timer = setTimeout(updateTargetRect, 100);
    return () => clearTimeout(timer);
  }, [step.route, location.pathname, navigate, updateTargetRect]);

  // Update on resize
  useEffect(() => {
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [updateTargetRect]);

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

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (step.position === 'center' || !targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 320;

    switch (step.position) {
      case 'top':
        return {
          position: 'fixed',
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  const overlay = (
    <div className="fixed inset-0 z-[9999]">
      {/* Dark overlay with cutout for target */}
      {targetRect && step.highlight ? (
        <>
          {/* Top */}
          <div 
            className="absolute bg-black/70 transition-all duration-300"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: targetRect.top - 8,
            }}
          />
          {/* Bottom */}
          <div 
            className="absolute bg-black/70 transition-all duration-300"
            style={{
              top: targetRect.bottom + 8,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Left */}
          <div 
            className="absolute bg-black/70 transition-all duration-300"
            style={{
              top: targetRect.top - 8,
              left: 0,
              width: targetRect.left - 8,
              height: targetRect.height + 16,
            }}
          />
          {/* Right */}
          <div 
            className="absolute bg-black/70 transition-all duration-300"
            style={{
              top: targetRect.top - 8,
              left: targetRect.right + 8,
              right: 0,
              height: targetRect.height + 16,
            }}
          />
          {/* Highlight ring */}
          <div 
            className="absolute border-2 border-primary rounded-xl animate-pulse transition-all duration-300"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Tooltip card */}
      <div
        className="w-[320px] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in"
        style={getTooltipStyle()}
      >
        {/* Header */}
        <div className="relative p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} / {tourSteps.length}
            </span>
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

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {step.icon && (
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                {step.icon}
              </div>
            </div>
          )}

          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold">{step.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {step.description}
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

          <Button onClick={handleNext} className="gap-1">
            {isLastStep ? 'Começar!' : 'Próximo'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
