import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type CreateUserBody = {
  email: string;
  password: string;
  fullName?: string;
  phone?: string | null;
  isAdmin?: boolean;
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
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the caller is admin
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: isAdmin, error: adminError } = await supabaseUser.rpc(
      "is_admin"
    );
    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = (await req.json()) as CreateUserBody;
    const email = body?.email?.trim()?.toLowerCase();
    const password = body?.password;
    const fullName = body?.fullName ?? null;
    const phone = body?.phone ?? null;
    const isAdmin_ = body?.isAdmin ?? false;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "email and password are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "password must be at least 6 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Service role client for user creation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create user with email_confirm = true to allow immediate login
    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
        },
      });

    if (createError || !created?.user?.id) {
      return new Response(
        JSON.stringify({
          error: createError?.message || "Failed to create user",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newUserId = created.user.id;

    // Create profile
    await supabaseAdmin.from("profiles").upsert(
      {
        user_id: newUserId,
        full_name: fullName,
        phone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    // Grant role if admin
    if (isAdmin_) {
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert(
        {
          user_id: newUserId,
          role: "admin",
        }
      );

      if (roleError) {
        console.error("Failed to grant admin role:", roleError);
        return new Response(
          JSON.stringify({
            error: "User created but failed to grant admin role",
            userId: newUserId,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Log the creation
    const { data: currentUser } = await supabaseUser.auth.getUser();
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: currentUser?.user?.id ?? null,
      action: "create_user",
      target_user_id: newUserId,
      details: {
        email,
        full_name: fullName,
        is_admin: isAdmin_,
        created_at: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUserId,
        email,
        isAdmin: isAdmin_,
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
