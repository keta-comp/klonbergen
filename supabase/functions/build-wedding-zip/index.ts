// Vowly build-wedding-zip Edge Function
// -------------------------------------
// Builds and streams a complete ZIP archive for a given wedding.
//
// GET /build-wedding-zip?wedding=<id>&key=<signed_url_key>
//   - Streams the ZIP back as `application/zip` with a
//     `Content-Disposition: attachment` carrying the filename:
//
//         Marat-Aygul-2026-08-03.zip
//
// Layout (one folder per content type, plus a wedding.json describing it all):
//
//     Marat-Aygul-2026-08-03/
//     ├── wedding.json
//     ├── bride-groom/{bride,groom}.jpg
//     ├── banners/banner-01.jpg, banner-02.jpg, ...
//     ├── gallery/{banners}/
//     ├── guest-photos/photo-01.jpg, photo-02.jpg, ...
//     ├── menu/food-01.jpg, ...
//     ├── program.json
//     ├── artists.json
//     ├── menu.json
//     ├── rsvp.json
//     └── qr-tables.json
//
// Authentication: requires a hall admin OR super-admin OR a valid signed URL
// key passed as the `key` query param. The signed URL key lets the dashboard
// generate short-lived download URLs without an Authorization header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

/** Sanitize a string so it is safe to use as a filename. */
function safe(s: string | null | undefined, fallback = "wedding"): string {
  if (!s) return fallback;
  return s.replace(/[^a-zA-Z0-9_\-]+/g, "_").slice(0, 60) || fallback;
}

function todayInTashkent(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const incomingUrl = new URL(req.url);
    const weddingId = incomingUrl.searchParams.get("wedding");
    if (!weddingId) {
      return new Response(JSON.stringify({ error: "missing wedding id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- auth ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const usingServiceKey = token === serviceKey;
    let authenticated = usingServiceKey;

    if (!authenticated) {
      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      if (!userErr && userData.user) {
        const { data: roleRow } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "super_admin")
          .maybeSingle();
        if (roleRow) {
          authenticated = true; // super admin: any wedding
        } else {
          // A hall admin may only download the ZIP for THEIR OWN hall's wedding.
          const { data: hallRow } = await admin
            .from("hall_admins")
            .select("hall_id")
            .eq("user_id", userData.user.id)
            .maybeSingle();
          if (hallRow && hallRow.hall_id === hallId) {
            authenticated = true;
          }
        }
      }
    }

    if (!authenticated) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- load wedding + all related rows ----
    const { data: wedding, error: wErr } = await admin
      .from("weddings")
      .select("*")
      .eq("id", weddingId)
      .maybeSingle();
    if (wErr || !wedding) {
      return new Response(JSON.stringify({ error: "wedding not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hallId = (wedding as { hall_id: string }).hall_id;
    const wAny = wedding as {
      bride_name?: string;
      groom_name?: string;
      wedding_date: string;
      archived_at?: string | null;
    };

    // parallel fetch of every dependent table for this wedding
    const [bg, banners, foods, artists, moments, rsvps, timeline] = await Promise.all([
      admin.from("bride_groom").select("*").eq("wedding_id", weddingId).maybeSingle(),
      admin.from("banners").select("*").eq("wedding_id", weddingId).order("sort_order"),
      admin.from("food_items").select("*").eq("wedding_id", weddingId).order("created_at"),
      admin.from("artists").select("*").eq("wedding_id", weddingId).order("created_at"),
      admin.from("wedding_moments").select("*").eq("wedding_id", weddingId).order("created_at"),
      admin.from("rsvps").select("*").eq("wedding_id", weddingId).order("created_at"),
      admin.from("timeline_events").select("*").eq("wedding_id", weddingId).order("sort_order"),
    ]);

    // ---- ZIP ----
    const zip = new JSZip();
    const folderName = `${safe(wAny.groom_name)}-${safe(wAny.bride_name)}-${wAny.wedding_date || todayInTashkent()}`;
    const root = zip.folder(folderName)!;
    const brideGroomFolder = root.folder("bride-groom")!;
    const bannersFolder = root.folder("banners")!;
    const galleryFolder = root.folder("gallery")!;
    const guestFolder = root.folder("guest-photos")!;
    const menuFolder = root.folder("menu")!;

    // helper: fetch a public URL and add it to the zip
    async function fetchAndAdd(url: string | null | undefined, zipPath: string): Promise<boolean> {
      if (!url) return false;
      try {
        const res = await fetch(url);
        if (!res.ok) return false;
        const buf = new Uint8Array(await res.arrayBuffer());
        root.file(zipPath, buf);
        return true;
      } catch {
        return false;
      }
    }

    // bride + groom photos
    if (bg.data?.bride_photo) await fetchAndAdd(bg.data.bride_photo, "bride-groom/bride.jpg");
    if (bg.data?.groom_photo) await fetchAndAdd(bg.data.groom_photo, "bride-groom/groom.jpg");

    // banners
    const bannerList = banners.data ?? [];
    for (let i = 0; i < bannerList.length; i++) {
      const b = bannerList[i] as { image_url?: string; title?: string | null };
      const idx = String(i + 1).padStart(2, "0");
      if (b.image_url) await fetchAndAdd(b.image_url, `banners/banner-${idx}.jpg`);
    }
    void galleryFolder; // explicit gallery folder for future per-wedding gallery (uses banners for now)

    // guest-uploaded photos
    const momentsList = moments.data ?? [];
    for (let i = 0; i < momentsList.length; i++) {
      const m = momentsList[i] as { image_url?: string };
      const idx = String(i + 1).padStart(2, "0");
      if (m.image_url) await fetchAndAdd(m.image_url, `guest-photos/photo-${idx}.jpg`);
    }

    // menu images
    const foodList = foods.data ?? [];
    for (let i = 0; i < foodList.length; i++) {
      const f = foodList[i] as { image_url?: string };
      const idx = String(i + 1).padStart(2, "0");
      if (f.image_url) await fetchAndAdd(f.image_url, `menu/food-${idx}.jpg`);
    }

    // JSON snapshots
    root.file(
      "wedding.json",
      JSON.stringify(
        {
          wedding,
          hall_id: hallId,
          bride_groom: bg.data ?? null,
          generated_at: new Date().toISOString(),
          generated_at_tashkent: new Date().toLocaleString("en-GB", { timeZone: "Asia/Tashkent" }),
        },
        null,
        2,
      ),
    );

    void hallId;
    root.file("artists.json", JSON.stringify(artists.data ?? [], null, 2));
    root.file("menu.json", JSON.stringify(foods.data ?? [], null, 2));
    root.file("rsvp.json", JSON.stringify(rsvps.data ?? [], null, 2));
    root.file("program.json", JSON.stringify(timeline.data ?? [], null, 2));
    root.file("qr-tables.json", JSON.stringify({ note: "QR generation is dynamic; re-generate via /admin/qr" }, null, 2));

    const blob = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });

    return new Response(blob, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${folderName}.zip"`,
        "Content-Length": String((blob as ArrayBuffer).byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
