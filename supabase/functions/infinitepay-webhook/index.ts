import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Valores esperados em centavos
const MONTHLY_AMOUNT = 1490;
const ANNUAL_AMOUNT = 9900;
const AMOUNT_THRESHOLD = 9000; // Acima disso é anual

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the payload from InfinitePay
    const payload = await req.json();
    
    console.log("InfinitePay webhook received:", JSON.stringify(payload, null, 2));

    // Extract data from InfinitePay payload
    const customerEmail = 
      payload.customer?.email || 
      payload.email || 
      payload.payer?.email ||
      payload.buyer?.email ||
      payload.data?.customer?.email ||
      payload.data?.email ||
      payload.payer_email ||
      payload.customer_email;

    const paidAmount = payload.paid_amount || 0;
    const amount = payload.amount || payload.value || payload.data?.amount || 0;
    
    const paymentStatus = 
      payload.status || 
      payload.payment_status ||
      payload.data?.status ||
      (paidAmount > 0 ? "paid" : "unknown");

    const transactionId = 
      payload.invoice_slug ||
      payload.transaction_nsu ||
      payload.order_nsu ||
      payload.id ||
      payload.transaction_id ||
      payload.payment_id ||
      `ip_${Date.now()}`;

    const captureMethod = payload.capture_method || "unknown";
    const invoiceSlug = payload.invoice_slug || null;

    console.log("Parsed data:", { 
      customerEmail, 
      paymentStatus, 
      transactionId, 
      amount, 
      paidAmount,
      captureMethod,
      invoiceSlug 
    });

    // Check if payment was successful
    const successStatuses = ["approved", "paid", "completed", "success", "captured"];
    const isPaymentSuccessful = paidAmount > 0 || successStatuses.some(
      s => paymentStatus.toLowerCase().includes(s)
    );

    if (!isPaymentSuccessful) {
      console.log("Payment not successful, status:", paymentStatus, "paid_amount:", paidAmount);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Webhook received, payment not successful",
          status: paymentStatus,
          paid_amount: paidAmount
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Payment confirmed as successful!");

    // ============================================
    // SECURITY FIX: Matching seguro por plan_type + FIFO
    // ============================================

    const actualAmount = paidAmount || amount;
    
    // Detectar tipo de plano pelo valor pago
    const isAnnual = actualAmount >= AMOUNT_THRESHOLD;
    const expectedPlanType = isAnnual ? 'annual' : 'monthly';

    console.log(`Payment amount: ${actualAmount}, detected plan: ${expectedPlanType}`);

    // Janela de tempo reduzida: 30 minutos (mais seguro)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    let userFromIntent = null;
    let intentEmail = customerEmail;
    let matchedIntent = null;
    
    if (!customerEmail) {
      console.log("No customer email in payload - looking for matching payment intent...");
      
      // Buscar intent pendente com o mesmo tipo de plano (FIFO - primeiro criado)
      const { data: recentIntents, error: intentError } = await supabase
        .from("payment_intents")
        .select("*")
        .eq("status", "pending")
        .eq("plan_type", expectedPlanType) // Filtrar por tipo de plano
        .gte("created_at", thirtyMinutesAgo) // Janela menor
        .order("created_at", { ascending: true }) // FIFO - primeiro a criar intent
        .limit(1);
      
      if (intentError) {
        console.error("Error fetching payment intents:", intentError);
      }
      
      if (recentIntents && recentIntents.length > 0) {
        const intent = recentIntents[0];
        console.log("Found matching payment intent:", intent.user_email, intent.plan_type, "created:", intent.created_at);
        intentEmail = intent.user_email;
        matchedIntent = intent;
        userFromIntent = {
          id: intent.user_id,
          email: intent.user_email,
          plan_type: intent.plan_type,
          intent_id: intent.id
        };
      } else {
        console.log("No matching intent found for plan_type:", expectedPlanType);
      }
    }
    
    // Se não encontrou email nem intent, salvar como pending para claim posterior
    if (!intentEmail && !userFromIntent) {
      console.log("No customer email and no matching payment intent - saving for claim");
      console.log("Full payload structure:", Object.keys(payload));
      
      const { error: insertError } = await supabase.from("pending_payments").insert({
        email: `pix_${invoiceSlug || transactionId}@pending.local`,
        amount: actualAmount,
        transaction_id: transactionId,
        payment_data: payload,
        status: "pending",
        // Sem intent_id pois não encontramos match
      });
      
      if (insertError) {
        console.error("Error saving pending payment:", insertError);
      }

      // Alerta específico para pagamento órfão (sem intent_id)
      await supabase.from("admin_alerts").insert({
        event_type: "payment_orphan",
        message: `⚠️ PAGAMENTO ÓRFÃO: R$ ${(actualAmount / 100).toFixed(2)} recebido sem intent_id! Plano: ${expectedPlanType}. Invoice: ${invoiceSlug || 'N/A'}. Transaction: ${transactionId}. Nenhum usuário aguardando pagamento nos últimos 30min. Requer vinculação manual ou claim do usuário.`,
      });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Payment saved as pending - no matching intent found",
          amount: actualAmount,
          plan_type: expectedPlanType,
          status: "pending_claim"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const finalEmail = intentEmail || customerEmail;

    // Se temos user do intent, usar diretamente
    let userId = null;
    let userEmail = finalEmail;
    
    if (userFromIntent) {
      userId = userFromIntent.id;
      userEmail = userFromIntent.email;
      console.log("Using user from payment intent:", userId, userEmail);
    } else {
      // Buscar user por email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error listing users:", authError);
        throw authError;
      }

      const user = authUsers.users.find(
        u => u.email?.toLowerCase() === finalEmail.toLowerCase()
      );

      if (!user) {
        console.error("User not found for email:", finalEmail);
        
        // Salvar como pending com intent_id se disponível
        await supabase.from("pending_payments").insert({
          email: finalEmail,
          amount: actualAmount,
          transaction_id: transactionId,
          payment_data: payload,
          status: "pending",
          intent_id: matchedIntent?.id || null,
        });

        await supabase.from("admin_alerts").insert({
          event_type: "payment_user_not_found",
          message: `⚠️ Pagamento recebido mas usuário não encontrado. Email: ${finalEmail}, Valor: R$ ${(actualAmount / 100).toFixed(2)}. Vincule em Pagamentos Pendentes.`,
          user_email: finalEmail,
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Payment saved as pending - user not found",
            email: finalEmail 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      userId = user.id;
      userEmail = user.email;
    }

    console.log("Processing subscription for user:", userId, userEmail);

    // Calcular data de expiração
    const expiresAt = new Date();
    if (isAnnual) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Atualizar subscription para PRO
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan: "pro",
        status: "active",
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        stripe_customer_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }

    console.log("Subscription updated successfully for user:", userId);

    // Marcar payment intent como completado
    if (userFromIntent?.intent_id) {
      await supabase
        .from("payment_intents")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString() 
        })
        .eq("id", userFromIntent.intent_id);
      console.log("Payment intent marked as completed:", userFromIntent.intent_id);
    }

    // Buscar perfil para alerta
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .single();

    // Criar alerta admin
    await supabase.from("admin_alerts").insert({
      event_type: "new_user_pro",
      user_id: userId,
      user_name: profile?.full_name,
      user_email: userEmail,
      message: `💰 Novo assinante PRO via InfinitePay: ${profile?.full_name || userEmail}. Plano: ${isAnnual ? 'Anual' : 'Mensal'}. Valor: R$ ${(actualAmount / 100).toFixed(2)}. Match: ${userFromIntent ? 'intent_' + userFromIntent.intent_id.substring(0, 8) : 'email'}`,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription activated automatically",
        user_id: userId,
        plan: "pro",
        expires_at: expiresAt.toISOString(),
        is_annual: isAnnual,
        matched_via: userFromIntent ? "payment_intent" : "email",
        intent_id: userFromIntent?.intent_id || null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
