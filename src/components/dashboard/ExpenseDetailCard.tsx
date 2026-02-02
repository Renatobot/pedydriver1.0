import { useState } from 'react';
import { Wallet, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { Expense, ExpenseCategory } from '@/types/database';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/formatters';

interface ExpenseDetailCardProps {
  totalExpenses: number;
  expenses: Expense[];
}

export function ExpenseDetailCard({ totalExpenses, expenses }: ExpenseDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Agrupa gastos por categoria
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category;
    acc[category] = (acc[category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  // Ordena por valor (maior primeiro)
  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a);

  const hasExpenses = sortedCategories.length > 0;

  return (
    <div 
      className={cn(
        'rounded-xl bg-card border border-border/50 transition-all duration-200 overflow-hidden',
        hasExpenses && 'cursor-pointer hover:border-border active:scale-[0.99]',
        isExpanded && 'border-expense/30'
      )}
      onClick={() => hasExpenses && setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
            <span className="text-2xs sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Gastos
            </span>
            {hasExpenses && (
              <span className="text-2xs text-muted-foreground/60">
                (toque para detalhes)
              </span>
            )}
          </div>
          <p className="text-lg sm:text-xl md:text-2xl font-bold font-mono text-expense">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-expense">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </span>
          {hasExpenses && (
            <span className={cn(
              'text-muted-foreground transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}>
              <ChevronDown className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      {/* Detalhamento por categoria */}
      <div 
        className={cn(
          'grid transition-all duration-200 ease-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-border/30 pt-3">
            <div className="space-y-2">
              {sortedCategories.map(([category, amount]) => (
                <div 
                  key={category}
                  className="flex items-center justify-between text-sm animate-fade-in"
                >
                  <span className="text-muted-foreground">
                    {EXPENSE_CATEGORY_LABELS[category] || category}
                  </span>
                  <span className="font-mono font-medium text-foreground">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Total */}
            <div className="flex items-center justify-between text-sm mt-3 pt-2 border-t border-border/30">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-mono font-bold text-expense">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
