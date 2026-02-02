import { useState } from 'react';
import { DollarSign, Wallet, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EarningForm } from '@/components/forms/EarningForm';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { ShiftForm } from '@/components/forms/ShiftForm';
import { cn } from '@/lib/utils';
import { useSubscriptionContext } from '@/contexts/SubscriptionContext';
import { EntryLimitBanner } from '@/components/subscription/EntryLimitBanner';
import logoWebp from '@/assets/logo-optimized.webp';

type FormType = 'earning' | 'expense' | 'shift';

const tabs: { id: FormType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'earning', label: 'Ganho', icon: DollarSign },
  { id: 'expense', label: 'Gasto', icon: Wallet },
  { id: 'shift', label: 'Turno', icon: Clock },
];

export default function Add() {
  const [activeTab, setActiveTab] = useState<FormType>('earning');
  const { isPro } = useSubscriptionContext();

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto scroll-momentum">
        {/* Header with Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img 
            src={logoWebp} 
            alt="PEDY Driver" 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-lg"
            width={80}
            height={80}
            loading="lazy"
          />
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Lançar</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Registre seus ganhos, gastos e turnos</p>
          </div>
        </div>

        {/* Entry Limit Banner */}
        {!isPro && <EntryLimitBanner showAlways />}

        {/* Tab Selector */}
        <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-xl bg-secondary">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all touch-feedback min-h-[44px] sm:min-h-[48px]',
                activeTab === id
                  ? id === 'earning'
                    ? 'bg-gradient-profit text-primary-foreground shadow-sm'
                    : id === 'expense'
                    ? 'bg-gradient-expense text-destructive-foreground shadow-sm'
                    : 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground active:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden xs:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-card rounded-2xl p-3 sm:p-4 border border-border/50 animate-fade-in">
          {activeTab === 'earning' && <EarningForm />}
          {activeTab === 'expense' && <ExpenseForm />}
          {activeTab === 'shift' && <ShiftForm />}
        </div>
      </div>
    </AppLayout>
  );
}
