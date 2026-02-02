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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the payload from InfinitePay
    const payload = await req.json();
    
    console.log("InfinitePay webhook received:", JSON.stringify(payload, null, 2));

    // InfinitePay webhook format - extract data from their specific structure
    // The payload contains: invoice_slug, amount, paid_amount, capture_method, items, etc.
    
    // Try to find email in various payload locations
    const customerEmail = 
      payload.customer?.email || 
      payload.email || 
      payload.payer?.email ||
      payload.buyer?.email ||
      payload.data?.customer?.email ||
      payload.data?.email ||
      payload.payer_email ||
      payload.customer_email;

    // InfinitePay uses paid_amount to indicate successful payment
    // If paid_amount > 0, the payment was successful
    const paidAmount = payload.paid_amount || 0;
    const amount = payload.amount || payload.value || payload.data?.amount || 0;
    
    // Check if payment was successful by looking at paid_amount or status
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

    // Payment is successful if:
    // 1. paid_amount > 0 (InfinitePay specific)
    // 2. OR status indicates success
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

    // If no email in payload, try to find a recent payment intent
    // This happens because InfinitePay doesn't send customer email in webhook
    let userFromIntent = null;
    let intentEmail = customerEmail;
    
    if (!customerEmail) {
      console.log("No customer email in payload - looking for recent payment intent...");
      
      // Look for a pending payment intent created in the last 2 hours
      // We match by timing since InfinitePay doesn't give us a way to link
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      const { data: recentIntents, error: intentError } = await supabase
        .from("payment_intents")
        .select("*")
        .eq("status", "pending")
        .gte("created_at", twoHoursAgo)
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (intentError) {
        console.error("Error fetching payment intents:", intentError);
      }
      
      if (recentIntents && recentIntents.length > 0) {
        const intent = recentIntents[0];
        console.log("Found recent payment intent:", intent.user_email, intent.plan_type);
        intentEmail = intent.user_email;
        userFromIntent = {
          id: intent.user_id,
          email: intent.user_email,
          plan_type: intent.plan_type,
          intent_id: intent.id
        };
      }
    }
    
    // If still no email, save as pending for manual review
    if (!intentEmail && !userFromIntent) {
      console.log("No customer email and no recent payment intent - saving for manual linking");
      console.log("Full payload structure:", Object.keys(payload));
      
      const { error: insertError } = await supabase.from("pending_payments").insert({
        email: `pix_${invoiceSlug || transactionId}@pending.local`,
        amount: paidAmount || amount,
        transaction_id: transactionId,
        payment_data: payload,
        status: "pending",
      });
      
      if (insertError) {
        console.error("Error saving pending payment:", insertError);
      }

      await supabase.from("admin_alerts").insert({
        event_type: "payment_user_not_found",
        message: `💰 Pagamento PIX recebido! Valor: R$ ${((paidAmount || amount) / 100).toFixed(2)}. Método: ${captureMethod}. Invoice: ${invoiceSlug || 'N/A'}. Vincule manualmente em Pagamentos Pendentes.`,
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Customer email not found and no recent payment intent",
          payload_keys: Object.keys(payload)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Use the email we found (either from payload or from intent)
    const finalEmail = intentEmail || customerEmail;

    // If we have a user from intent, use that directly
    let user = null;
    let userId = null;
    let userEmail = finalEmail;
    
    if (userFromIntent) {
      // We already have the user from the payment intent
      userId = userFromIntent.id;
      userEmail = userFromIntent.email;
      console.log("Using user from payment intent:", userId, userEmail);
    } else {
      // Find user by email in auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error listing users:", authError);
        throw authError;
      }

      user = authUsers.users.find(
        u => u.email?.toLowerCase() === finalEmail.toLowerCase()
      );

      if (!user) {
        console.error("User not found for email:", finalEmail);
        
        // Save as pending payment for manual linking
        await supabase.from("pending_payments").insert({
          email: finalEmail,
          amount: paidAmount || amount,
          transaction_id: transactionId,
          payment_data: payload,
          status: "pending",
        });

        // Create an admin alert for manual review
        await supabase.from("admin_alerts").insert({
          event_type: "payment_user_not_found",
          message: `⚠️ Pagamento recebido mas usuário não encontrado. Email: ${finalEmail}, Valor: R$ ${((paidAmount || amount) / 100).toFixed(2)}. Vincule em Pagamentos Pendentes.`,
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

    // Calculate expiration date
    // Use plan_type from intent if available, otherwise detect from amount
    const intentPlanType = userFromIntent?.plan_type;
    const isAnnual = intentPlanType === 'annual' || (paidAmount || amount) >= 9000;
    
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
        stripe_customer_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }

    console.log("Subscription updated successfully for user:", userId);

    // Mark payment intent as completed if we used one
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

    // Get user profile for alert
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .single();

    // Create admin alert for new PRO subscription via InfinitePay
    await supabase.from("admin_alerts").insert({
      event_type: "new_user_pro",
      user_id: userId,
      user_name: profile?.full_name,
      user_email: userEmail,
      message: `💰 Novo assinante PRO via InfinitePay: ${profile?.full_name || userEmail}. Plano: ${isAnnual ? 'Anual' : 'Mensal'}. Valor: R$ ${((paidAmount || amount) / 100).toFixed(2)}`,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription activated automatically",
        user_id: userId,
        plan: "pro",
        expires_at: expiresAt.toISOString(),
        is_annual: isAnnual,
        matched_via: userFromIntent ? "payment_intent" : "email"
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
