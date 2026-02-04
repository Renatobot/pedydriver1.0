import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UpdateEmailRequest {
  targetUserId: string;
  newEmail: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header missing" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify admin status
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify caller is admin
    const { data: isAdmin, error: adminError } = await supabaseUser.rpc("is_admin");
    if (adminError || !isAdmin) {
      console.error("Admin check failed:", adminError);
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas administradores podem alterar emails." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { targetUserId, newEmail }: UpdateEmailRequest = await req.json();

    // Validate inputs
    if (!targetUserId || !newEmail) {
      return new Response(
        JSON.stringify({ error: "targetUserId e newEmail são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return new Response(
        JSON.stringify({ error: "Formato de email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user to log old email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (userError || !userData?.user) {
      console.error("Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const oldEmail = userData.user.email;

    // Check if new email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === newEmail.toLowerCase() && u.id !== targetUserId
    );

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "Este email já está em uso por outro usuário" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update email via admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      email: newEmail,
      email_confirm: true, // Auto-confirm the new email
    });

    if (updateError) {
      console.error("Error updating email:", updateError);
      return new Response(
        JSON.stringify({ error: "Falha ao atualizar email: " + updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin user ID from token
    const { data: { user: adminUser } } = await supabaseUser.auth.getUser();

    // Log the action in admin_logs
    const { error: logError } = await supabaseAdmin.from("admin_logs").insert({
      admin_id: adminUser?.id,
      action: "update_user_email",
      target_user_id: targetUserId,
      details: {
        old_email: oldEmail,
        new_email: newEmail,
      },
    });

    if (logError) {
      console.error("Error logging action:", logError);
      // Don't fail the request if logging fails
    }

    console.log(`Email updated for user ${targetUserId}: ${oldEmail} -> ${newEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email atualizado com sucesso",
        oldEmail,
        newEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
