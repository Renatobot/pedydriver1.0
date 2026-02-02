import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Valores esperados em centavos
const MONTHLY_AMOUNT = 1490;
const ANNUAL_AMOUNT = 9900;
const AMOUNT_TOLERANCE = 100; // Tolerância de R$ 1,00 para variações

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

    // ============================================
    // SECURITY FIX: Buscar payment_intent DO PRÓPRIO USUÁRIO primeiro
    // ============================================
    
    // Janela de tempo reduzida: 30 minutos (mais seguro que 2h)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    console.log("Looking for user's payment intent since:", thirtyMinutesAgo);

    // 1. Primeiro buscar o payment_intent do próprio usuário
    const { data: userIntent, error: intentError } = await supabase
      .from("payment_intents")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gte("created_at", thirtyMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1);

    if (intentError) {
      console.error("Error fetching user's payment intent:", intentError);
    }

    // Se encontrou intent completado recentemente, verificar subscription
    const { data: completedIntent } = await supabase
      .from("payment_intents")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", thirtyMinutesAgo)
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

    // Se não tem intent pendente, não pode reclamar pagamento
    if (!userIntent || userIntent.length === 0) {
      console.log("No pending payment intent found for user:", userId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No payment intent found",
          hint: "Please start the payment process first"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const intent = userIntent[0];
    console.log("Found user's payment intent:", intent.id, "Plan:", intent.plan_type);

    // 2. Determinar o valor esperado baseado no tipo de plano do intent
    const expectedAmount = intent.plan_type === 'annual' ? ANNUAL_AMOUNT : MONTHLY_AMOUNT;
    const minAmount = expectedAmount - AMOUNT_TOLERANCE;
    const maxAmount = expectedAmount + AMOUNT_TOLERANCE;

    console.log(`Looking for pending payment with amount between ${minAmount} and ${maxAmount} (expected: ${expectedAmount})`);

    // 3. Buscar pending_payments com valor correspondente ao plano do usuário
    // Usa janela mais ampla (2h) para pending_payments pois o webhook pode demorar
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data: pendingPayments, error: fetchError } = await supabase
      .from("pending_payments")
      .select("*")
      .eq("status", "pending")
      .gte("amount", minAmount)
      .lte("amount", maxAmount)
      .gte("created_at", twoHoursAgo)
      .order("created_at", { ascending: true }); // FIFO - primeiro pagamento primeiro

    if (fetchError) {
      console.error("Error fetching pending payments:", fetchError);
      throw fetchError;
    }

    console.log("Found matching pending payments:", pendingPayments?.length || 0);

    if (!pendingPayments || pendingPayments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No matching pending payment found",
          hint: "Payment may still be processing or amount doesn't match your plan",
          expected_plan: intent.plan_type,
          expected_amount: expectedAmount
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Preferir pagamento com intent_id vinculado a este usuário
    let payment = pendingPayments.find(p => p.intent_id === intent.id);
    
    // Se não encontrou com intent_id, usar o primeiro disponível (FIFO)
    if (!payment) {
      payment = pendingPayments[0];
      console.log("Using FIFO matching - no intent_id link found");
    } else {
      console.log("Found payment with matching intent_id");
    }

    const amount = payment.amount;
    console.log("Claiming payment:", payment.id, "Amount:", amount);

    // Determinar tipo de plano baseado no intent (não no amount)
    const isAnnual = intent.plan_type === 'annual';

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

    // Mark intent as completed
    const { error: intentUpdateError } = await supabase
      .from("payment_intents")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", intent.id);

    if (intentUpdateError) {
      console.error("Error updating intent status:", intentUpdateError);
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
      message: `💰 Novo assinante PRO via claim seguro: ${profile?.full_name || userEmail}. Plano: ${isAnnual ? "Anual" : "Mensal"}. Valor: R$ ${(amount / 100).toFixed(2)}. Intent: ${intent.id.substring(0, 8)}`,
    });

    console.log("Payment claimed successfully with secure matching!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment claimed successfully",
        plan: "pro",
        is_annual: isAnnual,
        expires_at: expiresAt.toISOString(),
        intent_id: intent.id,
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
