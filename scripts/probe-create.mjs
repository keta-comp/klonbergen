// Probe the remote Supabase schema to find out why create() fails.
// Tests three payloads:
//   A) full builder payload (t1 + new cols) — mirrors useCreateInvitation exactly
//   B) base columns only (luxury + no new cols) — works if migrations missing
//   C) new columns only (no template) — checks if columns exist
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync(".env", "utf8").split("\n").map((l) => l.trim()).filter(Boolean)
  .reduce((acc, line) => {
    const i = line.indexOf("=");
    if (i > 0) {
      let v = line.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      acc[line.slice(0, i)] = v;
    }
    return acc;
  }, {});
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

const mkSlug = (tag) => `probe-${tag}-${Math.random().toString(36).slice(2, 8)}`;

async function tryInsert(label, payload) {
  const { data, error } = await sb.from("invitations").insert(payload).select().maybeSingle();
  console.log(`\n--- ${label} ---`);
  console.log("payload_keys", Object.keys(payload).join(","));
  if (error) {
    console.log("ERROR_message", error.message);
    console.log("ERROR_details", error.details);
    console.log("ERROR_hint", error.hint);
    console.log("ERROR_code", error.code);
  } else {
    console.log("INSERTED slug =", data?.slug, "id =", data?.id);
    return data;
  }
  return null;
}

// Probe A — exact builder payload (template=t1, new columns)
const a = await tryInsert("A: builder-payload(t1, new-cols)", {
  slug: mkSlug("A"),
  bride_name: "Probe Ayza",
  groom_name: "Probe Nurlan",
  wedding_date: "2026-09-18",
  wedding_time: "18:00",
  hall_name: "Probe Hall",
  address: "Probe addr",
  photos: [],
  template: "t1",
  welcome_text: "p-w",
  invitation_text: "p-i",
  final_text: "p-f",
  phone: "+998901112233",
  maps_url: "https://maps.example/x",
  views: 0,
});

// Probe B — base columns only (template=luxury, no new cols)
const b = await tryInsert("B: base-only(luxury, no-new-cols)", {
  slug: mkSlug("B"),
  bride_name: "Probe B",
  groom_name: "Probe B2",
  wedding_date: "2026-09-18",
  wedding_time: "18:00",
  hall_name: "Probe Hall",
  address: "Probe addr",
  photos: [],
  template: "luxury",
  views: 0,
});

// Probe C — base + template t2 (probes policy only, no new cols)
const c = await tryInsert("C: t2-only(no-new-cols)", {
  slug: mkSlug("C"),
  bride_name: "Probe C",
  groom_name: "Probe C2",
  wedding_date: "2026-09-18",
  wedding_time: "18:00",
  hall_name: "Probe Hall",
  address: "Probe addr",
  photos: [],
  template: "t2",
  views: 0,
});

// Probe D — base + template t4 (probes policy only, no new cols)
const d = await tryInsert("D: t4-only(no-new-cols)", {
  slug: mkSlug("D"),
  bride_name: "Probe D",
  groom_name: "Probe D2",
  wedding_date: "2026-09-18",
  wedding_time: "18:00",
  hall_name: "Probe Hall",
  address: "Probe addr",
  photos: [],
  template: "t4",
  views: 0,
});

// Cleanup successful probe rows so the DB stays clean
for (const row of [a, b, c, d]) {
  if (row?.slug) {
    const { error } = await sb.from("invitations").delete().eq("slug", row.slug);
    console.log(`cleanup ${row.slug}:`, error ? `fail ${error.message}` : "ok");
  }
}

console.log("\ndone");