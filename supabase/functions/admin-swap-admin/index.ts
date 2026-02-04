import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SwapAdminBody = {
  newEmail: string;
  newPassword: string;
  newFullName?: string;
  newPhone?: string | null;
  deleteOldAdminUserId?: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client with user's token to verify they are admin
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: isAdmin, error: adminError } = await supabaseUser.rpc("is_admin");
    if (adminError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as SwapAdminBody;
    const newEmail = body?.newEmail?.trim()?.toLowerCase();
    const newPassword = body?.newPassword;

    if (!newEmail || !newPassword) {
      return new Response(JSON.stringify({ error: "newEmail and newPassword are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "newPassword must be at least 6 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create the new admin user (email_confirm true to allow immediate login)
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: newEmail,
      password: newPassword,
      email_confirm: true,
      user_metadata: {
        full_name: body.newFullName ?? null,
        phone: body.newPhone ?? null,
      },
    });

    if (createError || !created?.user?.id) {
      return new Response(
        JSON.stringify({ error: createError?.message || "Failed to create user" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newUserId = created.user.id;

    // Ensure profile row exists (best-effort)
    await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          user_id: newUserId,
          full_name: body.newFullName ?? null,
          phone: body.newPhone ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    // Grant admin role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: newUserId,
      role: "admin",
    });

    if (roleError) {
      return new Response(JSON.stringify({ error: "Failed to grant admin role" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optionally delete the old admin (hard delete + cleanup)
    const deleteOldAdminUserId = body.deleteOldAdminUserId ?? null;
    if (deleteOldAdminUserId) {
      const tablesToClean = [
        "active_shifts",
        "earnings",
        "expenses",
        "shifts",
        "user_achievements",
        "user_gamification",
        "user_notifications",
        "user_settings",
        "device_fingerprints",
        "referrals",
        "support_tickets",
        "subscriptions",
        "profiles",
        "user_roles",
      ];

      for (const table of tablesToClean) {
        await supabaseAdmin.from(table).delete().eq("user_id", deleteOldAdminUserId);
      }

      // Also clean referrals where user is referred person
      await supabaseAdmin.from("referrals").delete().eq("referred_id", deleteOldAdminUserId);

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(deleteOldAdminUserId);
      if (deleteError) {
        return new Response(
          JSON.stringify({
            error: "New admin created, but failed to delete old admin: " + deleteError.message,
            newUserId,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Log the swap (do NOT log passwords)
    const { data: current } = await supabaseUser.auth.getUser();
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: current?.user?.id ?? null,
      action: "swap_admin",
      target_user_id: newUserId,
      details: {
        new_admin_email: newEmail,
        deleted_old_admin_user_id: deleteOldAdminUserId,
        created_at: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        newUserId,
        newEmail,
        deletedOldAdminUserId: deleteOldAdminUserId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
