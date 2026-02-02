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

    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's token to verify they're admin
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is an admin
    const { data: isAdmin, error: adminError } = await supabaseUser.rpc("is_admin");
    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { targetUserId, sendNotification } = await req.json();

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "targetUserId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get user info before deletion for logging
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    const userEmail = userData?.user?.email || "unknown";

    // Get the current admin's user ID for logging
    const { data: { user: currentAdmin } } = await supabaseUser.auth.getUser();

    // If sendNotification is true, just send the warning notification
    if (sendNotification) {
      const { error: notifyError } = await supabaseUser.rpc("admin_notify_inactivity_warning", {
        _target_user_id: targetUserId,
      });

      if (notifyError) {
        console.error("Error sending notification:", notifyError);
        return new Response(
          JSON.stringify({ error: "Failed to send notification" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Notification sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete user data from all related tables first
    // The order matters due to foreign key constraints
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
    ];

    for (const table of tablesToClean) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq("user_id", targetUserId);
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        // Continue with other tables even if one fails
      }
    }

    // Also clean referrals where user is the referred person
    await supabaseAdmin
      .from("referrals")
      .delete()
      .eq("referred_id", targetUserId);

    // Delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user: " + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the deletion
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: currentAdmin?.id,
      action: "delete_user",
      target_user_id: targetUserId,
      details: { 
        deleted_email: userEmail,
        deleted_at: new Date().toISOString()
      },
    });

    console.log(`User ${targetUserId} (${userEmail}) deleted successfully by admin ${currentAdmin?.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${userEmail} deleted successfully` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-delete-user:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
