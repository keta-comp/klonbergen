// Vowly archive-weddings Edge Function
// --------------------------------------
// Server-side archiving at midnight Asia/Tashkent (UTC+5).
//
// Modes:
//   POST /archive-weddings              -> archives every hall whose active
//                                          wedding's date is before today
//                                          (Asia/Tashkent).
//   POST /archive-weddings  ?hall=<id>  -> archives only the given hall.
//
// Authentication: requires a service-role key OR a cron / super-admin bearer.
// On the client side this endpoint is invoked from the admin dashboard on
// initial load, and the super-admin can schedule a pg_cron job hitting it
// every 10 minutes as a safety net (it is idempotent — running it twice on
// the same day is a no-op).

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

/** "today" in Asia/Tashkent, formatted as YYYY-MM-DD. */
function todayInTashkent(): string {
  // Asia/Tashkent is UTC+5 — formatted with toLocaleString for portability.
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const url =
      Deno.env.get("SUPABASE_URL") ??
      Deno.env.get("SB_PROJECT_URL") ??
      "https://vbikhnzwnsfddgjzwuge.supabase.co";
    const serviceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SB_SERVICE_ROLE_KEY");
    if (!serviceKey) return json({ error: "SB_SERVICE_ROLE_KEY secret topilmadi" }, 500);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // ---- auth: accept a service-role key OR a hall admin ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const usingServiceKey = token === serviceKey;

    // Resolve the caller's privilege so we can constrain what they may archive.
    let callerRole: "super_admin" | "hall_admin" | null = null;
    let callerHallId: string | null = null;

    if (!usingServiceKey) {
      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      const { data: hallRow } = await admin
        .from("hall_admins")
        .select("hall_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (roleRow) callerRole = "super_admin";
      else if (hallRow) {
        callerRole = "hall_admin";
        callerHallId = hallRow.hall_id;
      } else return json({ error: "forbidden" }, 403);

      // A hall admin (non-super) may only archive THEIR OWN hall, regardless of
      // any ?hall= override in the request — prevents cross-tenant archiving.
      if (callerRole !== "super_admin" && callerHallId) {
        const { data: archivedId } = await admin.rpc("archive_active_wedding", {
          _hall_id: callerHallId,
        });
        return json({
          success: true,
          archived_count: archivedId ? 1 : 0,
          archived: archivedId
            ? [{ id: archivedId, hall_id: callerHallId }]
            : [],
          today: todayInTashkent(),
          scoped_to: callerHallId,
        });
      }
    }

    const urlObj = new URL(req.url);
    const hallFilter = urlObj.searchParams.get("hall");
    const today = todayInTashkent();

    // 1) Find every active wedding whose date is before today's Tashkent date.
    let q = admin
      .from("weddings")
      .select("id, hall_id, wedding_date, status, bride_name, groom_name")
      .eq("status", "active")
      .lt("wedding_date", today);
    if (hallFilter) q = q.eq("hall_id", hallFilter);
    const { data: due, error: dueErr } = await q;
    if (dueErr) return json({ error: dueErr.message }, 500);
    if (!due || due.length === 0) {
      return json({ success: true, archived_count: 0, archived: [], today });
    }

    // 2) Archive each by flipping status + writing archived_at via RPC.
    const archived: { id: string; hall_id: string; bride_name: string; groom_name: string; wedding_date: string }[] = [];
    for (const w of due) {
      const { error: rpcErr } = await admin.rpc("archive_active_wedding", {
        _hall_id: w.hall_id,
      });
      if (rpcErr) continue;
      archived.push({
        id: w.id,
        hall_id: w.hall_id,
        bride_name: w.bride_name,
        groom_name: w.groom_name,
        wedding_date: w.wedding_date,
      });
    }

    return json({ success: true, archived_count: archived.length, archived, today });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
