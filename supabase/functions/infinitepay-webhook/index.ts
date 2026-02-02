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

  if (!customerEmail) {
      console.log("No customer email found in payload - saving for manual linking");
      console.log("Full payload structure:", Object.keys(payload));
      
      // Get item description for more context
      const itemDescription = payload.items?.[0]?.description || "Assinatura PRO";
      
      // Save as pending payment for manual review with more context
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

      // Create admin alert with more details
      const { error: alertError } = await supabase.from("admin_alerts").insert({
        event_type: "payment_user_not_found",
        message: `💰 Pagamento PIX recebido! Valor: R$ ${((paidAmount || amount) / 100).toFixed(2)}. Método: ${captureMethod}. Invoice: ${invoiceSlug || 'N/A'}. Vincule manualmente em Pagamentos Pendentes.`,
      });
      
      if (alertError) {
        console.error("Error creating alert:", alertError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Customer email not found in payload",
          payload_keys: Object.keys(payload)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find user by email in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error listing users:", authError);
      throw authError;
    }

    const user = authUsers.users.find(
      u => u.email?.toLowerCase() === customerEmail.toLowerCase()
    );

    if (!user) {
      console.error("User not found for email:", customerEmail);
      
      // Save as pending payment for manual linking
      await supabase.from("pending_payments").insert({
        email: customerEmail,
        amount: amount,
        transaction_id: transactionId,
        payment_data: payload,
        status: "pending",
      });

      // Create an admin alert for manual review
      await supabase.from("admin_alerts").insert({
        event_type: "payment_user_not_found",
        message: `⚠️ Pagamento recebido mas usuário não encontrado. Email: ${customerEmail}, Valor: R$ ${(amount / 100).toFixed(2)}. Vincule em Pagamentos Pendentes.`,
        user_email: customerEmail,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Payment saved as pending - user not found",
          email: customerEmail 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found user:", user.id, user.email);

    // Calculate expiration date (1 month from now for monthly, 1 year for annual)
    // Detect if it's annual based on amount (R$ 99 = 9900 centavos)
    const isAnnual = amount >= 9000; // R$ 90 or more is considered annual
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
        stripe_customer_id: transactionId, // Using this field to store InfinitePay transaction ID
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      throw updateError;
    }

    console.log("Subscription updated successfully for user:", user.id);

    // Get user profile for alert
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    // Create admin alert for new PRO subscription via InfinitePay
    await supabase.from("admin_alerts").insert({
      event_type: "new_user_pro",
      user_id: user.id,
      user_name: profile?.full_name,
      user_email: user.email,
      message: `💰 Novo assinante PRO via InfinitePay: ${profile?.full_name || user.email}. Plano: ${isAnnual ? 'Anual' : 'Mensal'}. Valor: R$ ${(amount / 100).toFixed(2)}`,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription activated",
        user_id: user.id,
        plan: "pro",
        expires_at: expiresAt.toISOString(),
        is_annual: isAnnual
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
