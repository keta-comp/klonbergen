// Vowly — wedding lifecycle & archive hooks
// =========================================
// Centralizes all reads/writes for the `weddings` table:
//   - the single ACTIVE wedding for a hall (the "current" one being managed)
//   - the full ARCHIVE list (paginated, searchable)
//   - automatic creation of a new active wedding when the previous one ends
//   - trigger of the server-side archive-weddings Edge Function on load

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Wedding = Tables<"weddings">;

const TZ = "Asia/Tashkent";

/** Today as YYYY-MM-DD in Asia/Tashkent (client-side mirror of the server). */
export function todayInTashkent(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    // fallback to UTC if Intl is unavailable (very unlikely in modern browsers)
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Get the single active wedding for a hall.
 *
 * Behaviour: if there is an active wedding whose `wedding_date` is before
 * today (Asia/Tashkent), this hook will:
 *   1. call the server-side `archive-weddings` Edge Function (idempotent),
 *   2. auto-create a fresh active wedding so the dashboard has something to
 *      manage immediately.
 */
export function useActiveWedding(hallId: string | null | undefined) {
  const qc = useQueryClient();

  return useQuery({
    queryKey: ["active-wedding", hallId],
    enabled: !!hallId,
    queryFn: async (): Promise<Wedding | null> => {
      if (!hallId) return null;

      const today = todayInTashkent();

      // 1) ping the archive endpoint — server will flip any stale active
      //    weddings. We don't block on the response; the next read picks it up.
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token ?? "";
        await supabase.functions.invoke("archive-weddings", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch {
        // offline / 404 — non-fatal; the local refresh below is a safety net.
      }

      // 2) read whatever is active now
      const { data: existing, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("hall_id", hallId)
        .eq("status", "active")
        .order("wedding_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (existing) return existing;

      // 3) no active wedding — try the most-recent of any status
      const { data: any } = await supabase
        .from("weddings")
        .select("*")
        .eq("hall_id", hallId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (any) return any;

      // 4) nothing exists — create today's wedding as a fresh active record.
      // If a concurrent mount already created it (the partial unique index
      // rejects a second active wedding for this hall), re-read instead of failing.
      const { data: created, error: insErr } = await supabase
        .from("weddings")
        .insert({
          hall_id: hallId,
          wedding_date: today,
          status: "active",
        } as TablesInsert<"weddings">)
        .select()
        .single();
      if (insErr) {
        const { data: fallback } = await supabase
          .from("weddings")
          .select("*")
          .eq("hall_id", hallId)
          .eq("status", "active")
          .order("wedding_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (fallback) return fallback as Wedding;
        throw insErr;
      }
      return created as Wedding;
    },
    // re-check every 5 minutes while the page is open so a 00:00 transition
    // becomes visible without a full reload.
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
}

/** Fetch the archive list, paginated + searched by bride/groom/date. */
export function useArchive(hallId: string | null | undefined, opts?: { search?: string; page?: number; pageSize?: number }) {
  const search = opts?.search?.trim() ?? "";
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 8;

  return useQuery({
    queryKey: ["archive", hallId, search, page, pageSize],
    enabled: !!hallId,
    queryFn: async () => {
      if (!hallId) return { rows: [] as Wedding[], total: 0 };

      let q = supabase
        .from("weddings")
        .select("*", { count: "exact" })
        .eq("hall_id", hallId)
        .eq("status", "archived");

      if (search) {
        // escape commas in OR patterns then build OR.
        const esc = search.replace(/[%_\\,]/g, (m) => `\\${m}`);
        const like = `%${esc}%`;
        q = q.or(
          `bride_name.ilike.${like},groom_name.ilike.${like},wedding_date::text.ilike.${like}`,
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await q
        .order("archived_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { rows: (data ?? []) as Wedding[], total: count ?? 0 };
    },
    staleTime: 30 * 1000,
  });
}

/** One-time archive ping invoked when the admin dashboard mounts. */
export function useArchiveOnMount(hallId: string | null | undefined) {
  useEffect(() => {
    if (!hallId) return;
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token ?? "";
        await supabase.functions.invoke("archive-weddings", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch {
        // ignore — best-effort
      }
    })();
  }, [hallId]);
}

export function useUpdateWedding(weddingId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Wedding>) => {
      if (!weddingId) throw new Error("no wedding id");
      const { error } = await supabase.from("weddings").update(patch).eq("id", weddingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-wedding"] });
      qc.invalidateQueries({ queryKey: ["archive"] });
      qc.invalidateQueries({ queryKey: ["wedding"] });
    },
  });
}

export function useCreateNextActiveWedding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hallId: string) => {
      // At most ONE active wedding per hall (partial unique index
      // `weddings_one_active_per_hall`). Reuse the existing one rather than
      // inserting a duplicate that would trip the constraint.
      const { data: existing } = await supabase
        .from("weddings")
        .select("*")
        .eq("hall_id", hallId)
        .eq("status", "active")
        .order("wedding_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) return existing as Wedding;

      const today = todayInTashkent();
      const { data, error } = await supabase
        .from("weddings")
        .insert({
          hall_id: hallId,
          wedding_date: today,
          status: "active",
        } as TablesInsert<"weddings">)
        .select()
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-wedding"] });
      qc.invalidateQueries({ queryKey: ["archive"] });
    },
  });
}

/** Recompute `guest_count`, `qr_scan_count`, `rsvp_count`, `uploaded_photo_count` on the wedding row. */
export async function recomputeWeddingStats(
  weddingId: string,
  hallId: string,
): Promise<void> {
  try {
    const [moments, rsvps] = await Promise.all([
      supabase.from("wedding_moments").select("id", { count: "exact", head: true }).eq("wedding_id", weddingId),
      supabase.from("rsvps").select("guests_count", { count: "exact" }).eq("wedding_id", weddingId),
    ]);
    const photoCount = (moments.count ?? 0) as number;
    let guestCount = 0;
    for (const r of rsvps.data ?? []) {
      guestCount += Number((r as { guests_count?: number }).guests_count ?? 1);
    }
    const rsvpCount = (rsvps.count ?? 0) as number;

    await supabase
      .from("weddings")
      .update({
        uploaded_photo_count: photoCount,
        rsvp_count: rsvpCount,
        guest_count: guestCount,
        qr_scan_count: 0, // populated elsewhere when QR scans become observable
      })
      .eq("id", weddingId);
  } catch {
    // non-fatal — count is just a UI indicator
  }
  void hallId;
}

/** Download the ZIP archive directly via the Edge Function. */
export async function downloadWeddingArchive(weddingId: string, supabaseUrl: string, accessToken: string): Promise<void> {
  const url = `${supabaseUrl}/functions/v1/build-wedding-zip?wedding=${encodeURIComponent(weddingId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`ZIP build failed (${res.status})`);
  const blob = await res.blob();
  const disp = res.headers.get("Content-Disposition") ?? "";
  const m = disp.match(/filename="([^"]+)"/);
  const name = m?.[1] ?? `wedding-${weddingId}.zip`;
  // browser download
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
