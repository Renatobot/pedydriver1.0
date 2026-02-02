import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      console.log("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    const userEmail = claimsData.user.email;

    console.log("Claim payment request from user:", userId, userEmail);

    // First check if user already has PRO
    const { data: currentSub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .single();

    if (currentSub?.plan === "pro" && currentSub?.status === "active") {
      console.log("User already has active PRO subscription");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Already PRO",
          already_pro: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look for pending payments from the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    console.log("Looking for pending payments since:", twoHoursAgo);

    // Try to find a pending payment that hasn't been linked yet
    const { data: pendingPayments, error: fetchError } = await supabase
      .from("pending_payments")
      .select("*")
      .eq("status", "pending")
      .gte("created_at", twoHoursAgo)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching pending payments:", fetchError);
      throw fetchError;
    }

    console.log("Found pending payments:", pendingPayments?.length || 0);

    if (!pendingPayments || pendingPayments.length === 0) {
      // No pending payment found - check if there's a payment_intent that was completed
      const { data: completedIntent } = await supabase
        .from("payment_intents")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("completed_at", twoHoursAgo)
        .order("completed_at", { ascending: false })
        .limit(1);

      if (completedIntent && completedIntent.length > 0) {
        console.log("Found completed payment intent - subscription should be active already");
        // Force refresh the subscription status
        const { data: freshSub } = await supabase
          .from("subscriptions")
          .select("plan, status")
          .eq("user_id", userId)
          .single();

        if (freshSub?.plan === "pro" && freshSub?.status === "active") {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Subscription already activated via webhook",
              already_pro: true 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No pending payment found",
          hint: "Payment may still be processing or was already claimed"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the most recent pending payment
    const payment = pendingPayments[0];
    const amount = payment.amount;

    console.log("Claiming payment:", payment.id, "Amount:", amount);

    // Determine plan type based on amount
    // R$ 14,90 = 1490 centavos = mensal
    // R$ 99,00 = 9900 centavos = anual
    const isAnnual = amount >= 9000;

    // Calculate expiration date
    const expiresAt = new Date();
    if (isAnnual) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Update subscription to PRO
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan: "pro",
        status: "active",
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        stripe_customer_id: payment.transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }

    console.log("Subscription updated to PRO for user:", userId);

    // Mark payment as claimed
    const { error: claimError } = await supabase
      .from("pending_payments")
      .update({
        status: "claimed",
        linked_user_id: userId,
        linked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (claimError) {
      console.error("Error marking payment as claimed:", claimError);
      // Don't throw - subscription was already updated
    }

    // Get user profile for alert
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .single();

    // Create admin alert
    await supabase.from("admin_alerts").insert({
      event_type: "new_user_pro",
      user_id: userId,
      user_name: profile?.full_name,
      user_email: userEmail,
      message: `💰 Novo assinante PRO via claim automático: ${profile?.full_name || userEmail}. Plano: ${isAnnual ? "Anual" : "Mensal"}. Valor: R$ ${(amount / 100).toFixed(2)}`,
    });

    console.log("Payment claimed successfully!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment claimed successfully",
        plan: "pro",
        is_annual: isAnnual,
        expires_at: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Claim payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
