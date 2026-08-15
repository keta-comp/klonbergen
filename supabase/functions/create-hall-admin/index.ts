import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // --- authenticate caller ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "unauthorized" }, 401);

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "forbidden" }, 403);

    // --- payload ---
    const { email, password, full_name, hall_id } = await req.json();
    if (!email || !password || !hall_id) return json({ error: "email, password, hall_id kerek" }, 400);
    if (String(password).length < 6) return json({ error: "Parol keminde 6 belgi bolıwı kerek" }, 400);

    const cleanEmail = String(email).trim().toLowerCase();

    // --- create or reuse auth user ---
    let userId: string | null = null;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: { full_name: full_name ?? cleanEmail },
    });

    if (createErr) {
      const msg = createErr.message ?? "";
      const exists = msg.toLowerCase().includes("already");
      if (!exists) return json({ error: msg }, 400);
      // find existing user and reset their password
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = list?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (!found) return json({ error: msg }, 400);
      userId = found.id;
      await admin.auth.admin.updateUserById(userId, { password: String(password), email_confirm: true });
    } else {
      userId = created.user!.id;
    }

    // --- approve profile ---
    await admin.from("profiles").upsert(
      {
        user_id: userId,
        email: cleanEmail,
        full_name: full_name ?? cleanEmail,
        approved: true,
        approved_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    // --- link to hall ---
    const { data: existingAdmin } = await admin
      .from("hall_admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingAdmin) {
      await admin.from("hall_admins").update({ hall_id, email: cleanEmail, full_name: full_name ?? cleanEmail }).eq("id", existingAdmin.id);
    } else {
      const { error: linkErr } = await admin.from("hall_admins").insert({
        hall_id,
        user_id: userId,
        email: cleanEmail,
        full_name: full_name ?? cleanEmail,
      });
      if (linkErr) return json({ error: linkErr.message }, 400);
    }

    return json({ success: true, user_id: userId, email: cleanEmail });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
