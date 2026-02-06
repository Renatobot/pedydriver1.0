import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalyticsFunnel } from '@/components/admin/analytics/AnalyticsFunnel';
import { AnalyticsErrorsTable } from '@/components/admin/analytics/AnalyticsErrorsTable';
import { AnalyticsSessionList } from '@/components/admin/analytics/AnalyticsSessionList';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';

type PeriodFilter = 7 | 14 | 30;
type SessionFilter = 'all' | 'completed' | 'abandoned';

export default function AdminAnalytics() {
  const [period, setPeriod] = useState<PeriodFilter>(7);
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('all');

  // Fetch summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_analytics_summary');
      if (error) throw error;
      return data as {
        today: { visitors: number; signups: number };
        week: { visitors: number; signups: number };
        month: { visitors: number; signups: number };
        top_error: string | null;
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch funnel data
  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['analytics-funnel', period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_analytics_funnel', { _days: period });
      if (error) throw error;
      return data as {
        landing_views: number;
        cta_clicks: number;
        auth_views: number;
        form_starts: number;
        form_submits: number;
        signup_errors: number;
        signup_complete: number;
      };
    },
  });

  // Fetch errors
  const { data: errors, isLoading: errorsLoading } = useQuery({
    queryKey: ['analytics-errors', period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_analytics_errors', { _days: period });
      if (error) throw error;
      return data as { error_message: string; count: number; percentage: number }[];
    },
  });

  // Fetch sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['analytics-sessions', sessionFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_analytics_sessions', {
        _limit: 50,
        _filter: sessionFilter,
      });
      if (error) throw error;
      return data as {
        session_id: string;
        first_seen: string;
        last_seen: string;
        device_type: string;
        referrer: string;
        completed: boolean;
        events: { type: string; page: string; metadata: Record<string, unknown>; created_at: string }[];
      }[];
    },
  });

  const conversionRate = summary?.week.visitors && summary?.week.signups
    ? ((summary.week.signups / summary.week.visitors) * 100).toFixed(1)
    : '0';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-primary" />
              Analytics de Conversão
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Acompanhe a jornada dos visitantes e identifique gargalos no cadastro
            </p>
          </div>
          
          {/* Period Filter */}
          <div className="flex gap-1">
            {([7, 14, 30] as PeriodFilter[]).map((days) => (
              <Button
                key={days}
                variant={period === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(days)}
              >
                {days} dias
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Visitantes Hoje</p>
                  <p className="text-2xl font-bold mt-1">
                    {summaryLoading ? '...' : summary?.today.visitors || 0}
                  </p>
                </div>
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cadastros Hoje</p>
                  <p className="text-2xl font-bold mt-1">
                    {summaryLoading ? '...' : summary?.today.signups || 0}
                  </p>
                </div>
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Conversão (7d)</p>
                  <p className="text-2xl font-bold mt-1">{conversionRate}%</p>
                </div>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Erro Principal</p>
                  <p className="text-sm font-medium mt-1 truncate max-w-[150px]">
                    {summaryLoading ? '...' : summary?.top_error || 'Nenhum'}
                  </p>
                </div>
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Funnel */}
          <AnalyticsFunnel data={funnel || null} isLoading={funnelLoading} />

          {/* Errors */}
          <AnalyticsErrorsTable data={errors || null} isLoading={errorsLoading} />
        </div>

        {/* Sessions */}
        <AnalyticsSessionList
          data={sessions || null}
          isLoading={sessionsLoading}
          filter={sessionFilter}
          onFilterChange={setSessionFilter}
        />
      </div>
    </AdminLayout>
  );
}
