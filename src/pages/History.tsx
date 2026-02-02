import { useState } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Wallet, Clock, Pencil, Trash2, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DateRangeSelector } from '@/components/dashboard/DateRangeSelector';
import { useEarnings, useDeleteEarning } from '@/hooks/useEarnings';
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { useShifts, useDeleteShift } from '@/hooks/useShifts';
import { useUserSettings } from '@/hooks/useUserSettings';
import { DateRange } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/formatters';
import { EXPENSE_CATEGORY_LABELS, SERVICE_TYPE_LABELS, EARNING_TYPE_LABELS } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EditEarningModal } from '@/components/history/EditEarningModal';
import { EditExpenseModal } from '@/components/history/EditExpenseModal';
import { EditShiftModal } from '@/components/history/EditShiftModal';
import { Earning, Expense, Shift } from '@/types/database';
import logoWebp from '@/assets/logo-optimized.webp';

type TabType = 'earnings' | 'expenses' | 'shifts';

const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'earnings', label: 'Ganhos', icon: DollarSign },
  { id: 'expenses', label: 'Gastos', icon: Wallet },
  { id: 'shifts', label: 'Turnos', icon: Clock },
];

export default function History() {
  const [range, setRange] = useState<DateRange>('month');
  const [activeTab, setActiveTab] = useState<TabType>('earnings');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingEarning, setEditingEarning] = useState<Earning | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  
  const { data: settings } = useUserSettings();
  const weekStartsOn = settings?.week_starts_on === 'domingo' ? 0 : 1;
  
  const deleteEarning = useDeleteEarning();
  const deleteExpense = useDeleteExpense();
  const deleteShift = useDeleteShift();
  
  const now = new Date();
  const dateRange = range === 'week'
    ? { start: format(startOfWeek(now, { weekStartsOn }), 'yyyy-MM-dd'), end: format(endOfWeek(now, { weekStartsOn }), 'yyyy-MM-dd') }
    : range === 'month'
    ? { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') }
    : { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };

  const { data: earnings, isLoading: loadingEarnings } = useEarnings(dateRange.start, dateRange.end);
  const { data: expenses, isLoading: loadingExpenses } = useExpenses(dateRange.start, dateRange.end);
  const { data: shifts, isLoading: loadingShifts } = useShifts(dateRange.start, dateRange.end);

  const isLoading = loadingEarnings || loadingExpenses || loadingShifts;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto scroll-momentum pb-24">
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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Histórico</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Visualize e edite seus registros</p>
          </div>
        </div>

        {/* Date Range Selector */}
        <DateRangeSelector value={range} onChange={setRange} />

        {/* Tab Selector */}
        <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-xl bg-secondary">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all touch-feedback min-h-[44px] sm:min-h-[48px]',
                activeTab === id
                  ? id === 'earnings'
                    ? 'bg-gradient-profit text-primary-foreground shadow-sm'
                    : id === 'expenses'
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

        {/* Content */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Earnings List */}
            {activeTab === 'earnings' && (
              earnings?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum ganho registrado no período</p>
                </div>
              ) : (
                earnings?.map((earning) => (
                  <div key={earning.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                    <button
                      onClick={() => toggleExpand(earning.id)}
                      className="w-full p-3 sm:p-4 flex items-center justify-between touch-feedback"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-profit/10 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-profit" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-medium text-sm sm:text-base text-foreground truncate">
                            {earning.platform?.name || 'Plataforma'}
                          </p>
                          <p className="text-2xs sm:text-xs text-muted-foreground">
                            {format(parseISO(earning.date), "dd 'de' MMM", { locale: ptBR })} • {SERVICE_TYPE_LABELS[earning.service_type]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-profit text-sm sm:text-base">
                          +{formatCurrency(earning.amount)}
                        </span>
                        {expandedId === earning.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    
                    {expandedId === earning.id && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-border/50 bg-secondary/30">
                        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm py-2">
                          <div>
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="ml-1 font-medium">{EARNING_TYPE_LABELS[earning.earning_type]}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Serviços:</span>
                            <span className="ml-1 font-medium">{earning.service_count}</span>
                          </div>
                          {earning.notes && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Obs:</span>
                              <span className="ml-1">{earning.notes}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setEditingEarning(earning)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="flex-1">
                                <Trash2 className="w-4 h-4 mr-1" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir ganho?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O ganho de {formatCurrency(earning.amount)} será removido permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteEarning.mutate(earning.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )
            )}

            {/* Expenses List */}
            {activeTab === 'expenses' && (
              expenses?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum gasto registrado no período</p>
                </div>
              ) : (
                expenses?.map((expense) => (
                  <div key={expense.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                    <button
                      onClick={() => toggleExpand(expense.id)}
                      className="w-full p-3 sm:p-4 flex items-center justify-between touch-feedback"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-expense/10 flex items-center justify-center flex-shrink-0">
                          <Wallet className="w-5 h-5 text-expense" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-medium text-sm sm:text-base text-foreground truncate">
                            {EXPENSE_CATEGORY_LABELS[expense.category]}
                          </p>
                          <p className="text-2xs sm:text-xs text-muted-foreground">
                            {format(parseISO(expense.date), "dd 'de' MMM", { locale: ptBR })}
                            {expense.platform && ` • ${expense.platform.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-expense text-sm sm:text-base">
                          -{formatCurrency(expense.amount)}
                        </span>
                        {expandedId === expense.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    
                    {expandedId === expense.id && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-border/50 bg-secondary/30">
                        <div className="text-xs sm:text-sm py-2">
                          {expense.notes && (
                            <div>
                              <span className="text-muted-foreground">Obs:</span>
                              <span className="ml-1">{expense.notes}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setEditingExpense(expense)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="flex-1">
                                <Trash2 className="w-4 h-4 mr-1" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir gasto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O gasto de {formatCurrency(expense.amount)} será removido permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteExpense.mutate(expense.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )
            )}

            {/* Shifts List */}
            {activeTab === 'shifts' && (
              shifts?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum turno registrado no período</p>
                </div>
              ) : (
                shifts?.map((shift) => {
                  const isMultiPlatform = (shift.platform_ids?.length || 0) > 1 || (shift.platforms?.length || 0) > 1;
                  const platformNames = shift.platforms?.map(p => p.name).join(', ') || shift.platform?.name || 'Plataforma';
                  
                  return (
                  <div key={shift.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                    <button
                      onClick={() => toggleExpand(shift.id)}
                      className="w-full p-3 sm:p-4 flex items-center justify-between touch-feedback"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative",
                          isMultiPlatform ? "bg-amber-500/10" : "bg-primary/10"
                        )}>
                          {isMultiPlatform ? (
                            <Layers className="w-5 h-5 text-amber-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="text-left min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-sm sm:text-base text-foreground truncate">
                              {platformNames}
                            </p>
                            {isMultiPlatform && (
                              <span className="text-2xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                                Multi
                              </span>
                            )}
                          </div>
                          <p className="text-2xs sm:text-xs text-muted-foreground">
                            {format(parseISO(shift.date), "dd 'de' MMM", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="font-mono font-semibold text-foreground text-sm sm:text-base block">
                            {shift.hours_worked}h
                          </span>
                          <span className="text-2xs text-muted-foreground">
                            {shift.km_driven} km
                          </span>
                        </div>
                        {expandedId === shift.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    
                    {expandedId === shift.id && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-border/50 bg-secondary/30">
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setEditingShift(shift)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="flex-1">
                                <Trash2 className="w-4 h-4 mr-1" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir turno?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O turno de {shift.hours_worked}h será removido permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteShift.mutate(shift.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })
              )
            )}
          </div>
        )}
      </div>

      {/* Edit Modals */}
      <EditEarningModal
        earning={editingEarning}
        open={!!editingEarning}
        onClose={() => setEditingEarning(null)}
      />
      <EditExpenseModal
        expense={editingExpense}
        open={!!editingExpense}
        onClose={() => setEditingExpense(null)}
      />
      <EditShiftModal
        shift={editingShift}
        open={!!editingShift}
        onClose={() => setEditingShift(null)}
      />
    </AppLayout>
  );
}
