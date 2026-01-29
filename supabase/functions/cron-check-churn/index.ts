import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log("[CRON] Starting daily churn check...");

    let alertCount = 0;

    // 1. Check for PRO users inactive for 7+ days
    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from("profiles")
      .select(`
        user_id,
        full_name,
        last_login_at
      `)
      .lt("last_login_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (inactiveError) {
      console.error("[CRON] Error fetching inactive users:", inactiveError);
    } else if (inactiveUsers) {
      for (const profile of inactiveUsers) {
        // Check if user has active PRO subscription
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("plan, status")
          .eq("user_id", profile.user_id)
          .eq("plan", "pro")
          .eq("status", "active")
          .single();

        if (subscription) {
          // Check if alert already exists
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const { data: existingAlert } = await supabase
            .from("admin_alerts")
            .select("id")
            .eq("user_id", profile.user_id)
            .eq("event_type", "churn_inactive_pro")
            .gt("created_at", sevenDaysAgo)
            .single();

          if (!existingAlert) {
            const lastLogin = profile.last_login_at 
              ? new Date(profile.last_login_at).toLocaleDateString("pt-BR")
              : "nunca";

            await supabase.from("admin_alerts").insert({
              event_type: "churn_inactive_pro",
              user_id: profile.user_id,
              user_name: profile.full_name,
              message: `⚠️ Possível churn: Usuário PRO sem atividade há 7 dias. Último acesso: ${lastLogin}`,
            });
            alertCount++;
            console.log(`[CRON] Created inactive alert for user: ${profile.user_id}`);
          }
        }
      }
    }

    // 2. Check for PRO subscriptions expiring in 3 days
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const { data: expiringSubscriptions, error: expiringError } = await supabase
      .from("subscriptions")
      .select(`
        user_id,
        expires_at
      `)
      .eq("plan", "pro")
      .eq("status", "active")
      .not("expires_at", "is", null)
      .gte("expires_at", now)
      .lte("expires_at", threeDaysFromNow);

    if (expiringError) {
      console.error("[CRON] Error fetching expiring subscriptions:", expiringError);
    } else if (expiringSubscriptions) {
      for (const sub of expiringSubscriptions) {
        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", sub.user_id)
          .single();

        // Check if alert already exists
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data: existingAlert } = await supabase
          .from("admin_alerts")
          .select("id")
          .eq("user_id", sub.user_id)
          .eq("event_type", "churn_expiring_pro")
          .gt("created_at", threeDaysAgo)
          .single();

        if (!existingAlert) {
          const expiresAt = new Date(sub.expires_at!).toLocaleDateString("pt-BR");

          await supabase.from("admin_alerts").insert({
            event_type: "churn_expiring_pro",
            user_id: sub.user_id,
            user_name: profile?.full_name,
            message: `⏰ Plano PRO próximo do vencimento. Expira em: ${expiresAt}`,
          });
          alertCount++;
          console.log(`[CRON] Created expiring alert for user: ${sub.user_id}`);
        }
      }
    }

    console.log(`[CRON] Churn check completed. ${alertCount} new alerts created.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsCreated: alertCount,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("[CRON] Error in cron-check-churn:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
