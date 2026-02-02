import { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEarnings } from './useEarnings';
import { useExpenses } from './useExpenses';
import { useShifts } from './useShifts';
import { useUserSettings } from './useUserSettings';
import { usePlatforms } from './usePlatforms';
import { DashboardMetrics, PlatformMetrics, Platform } from '@/types/database';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type DateRange = 'day' | 'week' | 'month';

export function useDashboard(range: DateRange = 'week') {
  const queryClient = useQueryClient();
  const { data: settings } = useUserSettings();
  const { data: platforms } = usePlatforms();
  
  const weekStartsOn = settings?.week_starts_on === 'domingo' ? 0 : 1;
  
  const dateRange = useMemo(() => {
    const now = new Date();
    if (range === 'day') {
      const today = format(now, 'yyyy-MM-dd');
      return {
        start: today,
        end: today
      };
    } else if (range === 'week') {
      return {
        start: format(startOfWeek(now, { weekStartsOn }), 'yyyy-MM-dd'),
        end: format(endOfWeek(now, { weekStartsOn }), 'yyyy-MM-dd')
      };
    } else {
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd')
      };
    }
  }, [range, weekStartsOn]);

  const { data: earnings, isLoading: earningsLoading } = useEarnings(dateRange.start, dateRange.end);
  const { data: expenses, isLoading: expensesLoading } = useExpenses(dateRange.start, dateRange.end);
  const { data: shifts, isLoading: shiftsLoading } = useShifts(dateRange.start, dateRange.end);

  const costPerKm = settings?.cost_per_km || 0.5;
  const distributionRule = settings?.cost_distribution_rule || 'km';

  const metrics = useMemo((): DashboardMetrics & { 
    grossRevenuePerHour: number; 
    grossRevenuePerKm: number; 
  } => {
    if (!earnings || !expenses || !shifts) {
      return {
        totalRevenue: 0,
        immediateRevenue: 0,
        appRevenue: 0,
        totalExpenses: 0,
        realProfit: 0,
        totalServices: 0,
        revenuePerHour: 0,
        revenuePerKm: 0,
        totalHours: 0,
        totalKm: 0,
        grossRevenuePerHour: 0,
        grossRevenuePerKm: 0
      };
    }

    const totalRevenue = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
    const immediateRevenue = earnings.filter(e => e.payment_type === 'imediato').reduce((sum, e) => sum + Number(e.amount), 0);
    const appRevenue = earnings.filter(e => e.payment_type === 'app').reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalServices = earnings.reduce((sum, e) => sum + e.service_count, 0);
    const totalHours = shifts.reduce((sum, s) => sum + Number(s.hours_worked), 0);
    const totalKm = shifts.reduce((sum, s) => sum + Number(s.km_driven), 0);
    
    const kmCost = totalKm * costPerKm;
    const realProfit = totalRevenue - totalExpenses - kmCost;
    
    // Métricas líquidas (baseadas no lucro real)
    const revenuePerHour = totalHours > 0 ? realProfit / totalHours : 0;
    const revenuePerKm = totalKm > 0 ? realProfit / totalKm : 0;
    
    // Métricas brutas (baseadas na receita bruta)
    const grossRevenuePerHour = totalHours > 0 ? totalRevenue / totalHours : 0;
    const grossRevenuePerKm = totalKm > 0 ? totalRevenue / totalKm : 0;

    return {
      totalRevenue,
      immediateRevenue,
      appRevenue,
      totalExpenses,
      realProfit,
      totalServices,
      revenuePerHour,
      revenuePerKm,
      totalHours,
      totalKm,
      grossRevenuePerHour,
      grossRevenuePerKm
    };
  }, [earnings, expenses, shifts, costPerKm]);

  const platformMetrics = useMemo((): PlatformMetrics[] => {
    if (!earnings || !expenses || !shifts || !platforms) {
      return [];
    }

    // Calculate totals for distribution
    const totalKm = shifts.reduce((sum, s) => sum + Number(s.km_driven), 0);
    const totalHours = shifts.reduce((sum, s) => sum + Number(s.hours_worked), 0);
    const totalRevenue = earnings.reduce((sum, e) => sum + Number(e.amount), 0);

    // General expenses (not tied to a specific platform)
    const generalExpenses = expenses.filter(e => !e.platform_id).reduce((sum, e) => sum + Number(e.amount), 0);

    // Get unique platforms that have data
    const platformIds = new Set([
      ...earnings.map(e => e.platform_id).filter(Boolean),
      ...expenses.filter(e => e.platform_id).map(e => e.platform_id),
      ...shifts.map(s => s.platform_id).filter(Boolean)
    ]);

    const result: PlatformMetrics[] = [];

    platformIds.forEach(platformId => {
      const platform = platforms.find(p => p.id === platformId);
      if (!platform) return;

      const platformEarnings = earnings.filter(e => e.platform_id === platformId);
      const platformExpenses = expenses.filter(e => e.platform_id === platformId);
      const platformShifts = shifts.filter(s => s.platform_id === platformId);

      const revenue = platformEarnings.reduce((sum, e) => sum + Number(e.amount), 0);
      const directExpenses = platformExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const services = platformEarnings.reduce((sum, e) => sum + e.service_count, 0);
      const hours = platformShifts.reduce((sum, s) => sum + Number(s.hours_worked), 0);
      const km = platformShifts.reduce((sum, s) => sum + Number(s.km_driven), 0);

      // Calculate shared expenses based on distribution rule
      let sharedExpenses = 0;
      if (generalExpenses > 0) {
        switch (distributionRule) {
          case 'km':
            sharedExpenses = totalKm > 0 ? (km / totalKm) * generalExpenses : 0;
            break;
          case 'horas':
            sharedExpenses = totalHours > 0 ? (hours / totalHours) * generalExpenses : 0;
            break;
          case 'receita':
            sharedExpenses = totalRevenue > 0 ? (revenue / totalRevenue) * generalExpenses : 0;
            break;
        }
      }

      const kmCost = km * costPerKm;
      const profit = revenue - directExpenses - sharedExpenses - kmCost;
      const avgPerService = services > 0 ? revenue / services : 0;
      const revenuePerHour = hours > 0 ? profit / hours : 0;
      const revenuePerKm = km > 0 ? profit / km : 0;

      result.push({
        platform,
        revenue,
        directExpenses,
        sharedExpenses,
        kmCost,
        profit,
        services,
        avgPerService,
        hours,
        km,
        revenuePerHour,
        revenuePerKm
      });
    });

    return result.sort((a, b) => b.profit - a.profit);
  }, [earnings, expenses, shifts, platforms, costPerKm, distributionRule]);

  const refetch = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['earnings'] }),
      queryClient.invalidateQueries({ queryKey: ['expenses'] }),
      queryClient.invalidateQueries({ queryKey: ['shifts'] }),
    ]);
  }, [queryClient]);

  // Check if there are multi-platform shifts
  const hasMultiPlatformShifts = useMemo(() => {
    if (!shifts) return false;
    return shifts.some(s => (s.platform_ids?.length || 0) > 1);
  }, [shifts]);

  return {
    metrics,
    platformMetrics,
    earnings: earnings || [],
    expenses: expenses || [],
    shifts: shifts || [],
    isLoading: earningsLoading || expensesLoading || shiftsLoading,
    dateRange,
    weekStartsOn,
    costPerKm,
    refetch,
    hasMultiPlatformShifts,
  };
}
