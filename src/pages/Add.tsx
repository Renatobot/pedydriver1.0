import { useState } from 'react';
import { DollarSign, Wallet, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EarningForm } from '@/components/forms/EarningForm';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { ShiftForm } from '@/components/forms/ShiftForm';
import { cn } from '@/lib/utils';

type FormType = 'earning' | 'expense' | 'shift';

const tabs: { id: FormType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'earning', label: 'Ganho', icon: DollarSign },
  { id: 'expense', label: 'Gasto', icon: Wallet },
  { id: 'shift', label: 'Turno', icon: Clock },
];

export default function Add() {
  const [activeTab, setActiveTab] = useState<FormType>('earning');

  return (
    <AppLayout>
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Lançar</h1>
          <p className="text-muted-foreground text-sm">Registre seus ganhos, gastos e turnos</p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all touch-target',
                activeTab === id
                  ? id === 'earning'
                    ? 'bg-gradient-profit text-primary-foreground shadow-sm'
                    : id === 'expense'
                    ? 'bg-gradient-expense text-destructive-foreground shadow-sm'
                    : 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-card rounded-2xl p-4 border border-border/50 animate-fade-in">
          {activeTab === 'earning' && <EarningForm />}
          {activeTab === 'expense' && <ExpenseForm />}
          {activeTab === 'shift' && <ShiftForm />}
        </div>
      </div>
    </AppLayout>
  );
}
