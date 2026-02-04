import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting community stats calculation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Get the start of the current week (Monday)
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    console.log(`Calculating for period: ${currentPeriod}, week: ${weekStartStr} to ${weekEndStr}`);

    // Get earnings per user for this week
    const { data: earnings, error: earningsError } = await supabase
      .from('earnings')
      .select('user_id, amount, date')
      .gte('date', weekStartStr)
      .lte('date', weekEndStr);

    if (earningsError) {
      console.error('Error fetching earnings:', earningsError);
      throw earningsError;
    }

    // Get shifts per user for this week
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('user_id, hours_worked, km_driven, date')
      .gte('date', weekStartStr)
      .lte('date', weekEndStr);

    if (shiftsError) {
      console.error('Error fetching shifts:', shiftsError);
      throw shiftsError;
    }

    console.log(`Found ${earnings?.length || 0} earnings and ${shifts?.length || 0} shifts`);

    // Aggregate data per user
    const userStats: Record<string, { earnings: number; hours: number; km: number }> = {};

    (earnings || []).forEach((e) => {
      if (!userStats[e.user_id]) {
        userStats[e.user_id] = { earnings: 0, hours: 0, km: 0 };
      }
      userStats[e.user_id].earnings += Number(e.amount);
    });

    (shifts || []).forEach((s) => {
      if (!userStats[s.user_id]) {
        userStats[s.user_id] = { earnings: 0, hours: 0, km: 0 };
      }
      userStats[s.user_id].hours += Number(s.hours_worked);
      userStats[s.user_id].km += Number(s.km_driven);
    });

    // Filter users with enough data
    const usersWithData = Object.entries(userStats)
      .filter(([, stats]) => stats.earnings > 0 && stats.hours > 0)
      .map(([userId, stats]) => ({
        userId,
        weeklyEarnings: stats.earnings,
        revenuePerHour: stats.hours > 0 ? stats.earnings / stats.hours : 0,
        revenuePerKm: stats.km > 0 ? stats.earnings / stats.km : 0,
      }));

    console.log(`Users with valid data: ${usersWithData.length}`);

    if (usersWithData.length < 5) {
      console.log('Not enough users to calculate percentiles');
      return new Response(
        JSON.stringify({ success: true, message: 'Not enough users for stats', count: usersWithData.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate percentiles for each metric
    const calculatePercentiles = (values: number[]): { p10: number; p25: number; p50: number; p75: number; p90: number; avg: number } => {
      const sorted = [...values].sort((a, b) => a - b);
      const n = sorted.length;
      
      const percentile = (p: number) => {
        const index = (p / 100) * (n - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) return sorted[lower];
        return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
      };

      return {
        p10: percentile(10),
        p25: percentile(25),
        p50: percentile(50),
        p75: percentile(75),
        p90: percentile(90),
        avg: values.reduce((a, b) => a + b, 0) / n,
      };
    };

    const metrics = [
      { 
        name: 'revenue_per_hour', 
        values: usersWithData.map(u => u.revenuePerHour).filter(v => v > 0) 
      },
      { 
        name: 'weekly_earnings', 
        values: usersWithData.map(u => u.weeklyEarnings).filter(v => v > 0) 
      },
      { 
        name: 'revenue_per_km', 
        values: usersWithData.filter(u => u.revenuePerKm > 0).map(u => u.revenuePerKm) 
      },
    ];

    // Upsert stats for each metric
    for (const metric of metrics) {
      if (metric.values.length < 5) continue;

      const percentiles = calculatePercentiles(metric.values);
      
      console.log(`Metric ${metric.name}:`, percentiles);

      // Delete existing for this period/metric first
      await supabase
        .from('community_stats')
        .delete()
        .eq('period', currentPeriod)
        .eq('metric', metric.name);

      // Insert new stats using service role (bypasses RLS)
      const { error: insertError } = await supabase
        .from('community_stats')
        .insert({
          period: currentPeriod,
          metric: metric.name,
          p10: percentiles.p10,
          p25: percentiles.p25,
          p50: percentiles.p50,
          p75: percentiles.p75,
          p90: percentiles.p90,
          avg: percentiles.avg,
          count: metric.values.length,
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`Error inserting ${metric.name}:`, insertError);
      } else {
        console.log(`Successfully updated ${metric.name}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        period: currentPeriod, 
        usersAnalyzed: usersWithData.length,
        metricsUpdated: metrics.filter(m => m.values.length >= 5).length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error calculating community stats:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
