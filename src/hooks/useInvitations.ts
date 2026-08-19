import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { idbSet } from "@/lib/idb";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Invitation = Tables<"invitations">;

export interface InvitationDraft {
  brideName: string;
  groomName: string;
  weddingDate: string;
  weddingTime: string;
  venueName: string;
  address: string;
  phone: string;
  mapsUrl: string;
  welcomeText: string;
  invitationText: string;
  finalText: string;
  music: File | null;
}

const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

// ---- localStorage enrichment ----
// The remote invitations table only ships the original schema; the new
// editorial columns (welcome_text, invitation_text, final_text, phone,
// maps_url) and the policy update that allows t1..t4 land via Supabase
// migrations. Until those migrations are pushed to the remote DB, we stash
// the editorial extras in localStorage keyed by slug and merge them into the
// fetched row so the final page renders the user's custom copy. This is a
// transparent progressive enhancement: once the migrations run, the DB has
// the fields and localStorage is simply ignored.
const EXTRAS_KEY = (slug: string) => `vowly:invitation-extras:${slug}`;

// The picked background music is a `File` — it cannot live in localStorage, so
// we stash the actual file in IndexedDB keyed by slug. The final page reads it
// back and plays it. This is the reliable path: the Supabase storage upload
// (hall-assets bucket) can be blocked by missing RLS, in which case the
// server-side `music_url` is missing and this local copy keeps the music working.
const MUSIC_KEY = (slug: string) => `vowly_invitation_music_${slug}`;

interface InvitationExtras {
  welcomeText?: string;
  invitationText?: string;
  finalText?: string;
  phone?: string;
  mapsUrl?: string;
  musicUrl?: string;
}

function saveExtras(slug: string, extras: InvitationExtras) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EXTRAS_KEY(slug), JSON.stringify(extras));
  } catch {
    /* localStorage quota / disabled — fall back gracefully */
  }
}

function loadExtras(slug: string): InvitationExtras {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(EXTRAS_KEY(slug));
    return raw ? (JSON.parse(raw) as InvitationExtras) : {};
  } catch {
    return {};
  }
}

function makeSlug(bride: string, groom: string) {
  const base = `${bride}-${groom}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  const rand = Array.from({ length: 6 }, () =>
    ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  ).join("");
  return base ? `${base}-${rand}` : `toy-${rand}`;
}

async function uploadMusicFile(slug: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
  const path = `invitations/${slug}-music-${Date.now()}.${ext}`;
  console.log(`[MUSIC] uploading music for slug=${slug} -> ${path} (${file.type || "unknown"} ${file.size} bytes)`);
  const { error } = await supabase.storage
    .from("hall-assets")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "audio/mpeg",
    });
  if (error) throw error;
  const { data } = supabase.storage.from("hall-assets").getPublicUrl(path);
  console.log(`[MUSIC] uploaded OK, publicUrl=${data.publicUrl}`);
  return data.publicUrl;
}

/** Extract the storage object path from a hall-assets public URL so it can
 *  be deleted when the track is replaced/removed. Returns null if the URL is
 *  not a hall-assets public object. */
function musicPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = "/public/hall-assets/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function deleteMusicFile(url: string | null | undefined) {
  const path = musicPathFromUrl(url);
  if (!path) return;
  console.log(`[MUSIC] deleting old music object: ${path}`);
  await supabase.storage.from("hall-assets").remove([path]);
}

// The remote policy currently only allows the "luxury" `template` value, so
// every created invitation is stored as luxury. The premium Vowly design is
// applied automatically — the wizard no longer asks the creator to pick a
// template — and the visual rendering does not depend on this column.
const STORED_TEMPLATE = "luxury" as const;

export function useCreateInvitation() {
  return useMutation({
    mutationFn: async (draft: InvitationDraft) => {
      const slug = makeSlug(draft.groomName, draft.brideName);
      console.log(`[MUSIC] createInvitation start for slug=${slug}`);

      const photos: string[] = [];

      // Upload the optional background music FIRST so we can persist its URL
      // on the invitation row. A failure must not sink the whole invitation.
      let musicUrl: string | undefined;
      if (draft.music) {
        try {
          musicUrl = await uploadMusicFile(slug, draft.music);
        } catch (e) {
          console.warn(`[MUSIC] upload failed, continuing without music:`, e);
          musicUrl = undefined;
        }
        // Keep a per-device copy in IndexedDB as a last-resort fallback for
        // the creating device (e.g. if the storage backend is unreachable).
        idbSet(MUSIC_KEY(slug), draft.music).catch(() => {});
      }

      const payload: TablesInsert<"invitations"> = {
        slug,
        bride_name: draft.brideName.trim(),
        groom_name: draft.groomName.trim(),
        wedding_date: draft.weddingDate,
        wedding_time: draft.weddingTime,
        hall_name: draft.venueName.trim(),
        address: draft.address.trim() || null,
        photos,
        template: STORED_TEMPLATE,
        views: 0,
        music_url: musicUrl ?? null,
      };

      // Try the full payload. If the remote DB has not yet run the music_url
      // migration the column is missing — strip it and retry so creation still
      // works (music simply won't persist until the migration lands).
      let inserted: Tables<"invitations">;
      let dbError: unknown;
      const res = await supabase
        .from("invitations")
        .insert(payload)
        .select()
        .single();
      if (res.error && /music_url/.test(res.error.message)) {
        console.warn(`[MUSIC] music_url column missing on remote, retrying without it`);
        const res2 = await supabase
          .from("invitations")
          .insert({ ...payload, music_url: undefined })
          .select()
          .single();
        inserted = res2.data as Tables<"invitations">;
        dbError = res2.error;
      } else {
        inserted = res.data as Tables<"invitations">;
        dbError = res.error;
      }
      if (dbError) throw dbError;
      console.log(`[MUSIC] invitation created, music_url=${musicUrl ?? "none"}`);

      // Stash the editorial extras so the final page shows the user's
      // custom copy on the device that created the invitation.
      saveExtras(slug, {
        welcomeText: draft.welcomeText,
        invitationText: draft.invitationText,
        finalText: draft.finalText,
        phone: draft.phone,
        mapsUrl: draft.mapsUrl,
        musicUrl,
      });

      return inserted;
    },
  });
}

export function useInvitation(slug?: string) {
  return useQuery({
    queryKey: ["invitation", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      // Merge any localStorage-stored extras. Once the migrations add the
      // columns to the remote table, the DB values take precedence.
      const extras = loadExtras(slug!);
      return {
        ...data,
        welcome_text: data.welcome_text ?? extras.welcomeText ?? null,
        invitation_text: data.invitation_text ?? extras.invitationText ?? null,
        final_text: data.final_text ?? extras.finalText ?? null,
        phone: data.phone ?? extras.phone ?? null,
        maps_url: data.maps_url ?? extras.mapsUrl ?? null,
        music_url: data.music_url ?? extras.musicUrl ?? null,
      } as typeof data;
    },
  });
}

/**
 * Replace or remove the background music of an existing invitation.
 * - `{ file }`  → upload the new track, delete the old object, persist new URL
 * - `{ remove: true }` → delete the old object and clear music_url
 * Returns the resulting music_url (or null when removed).
 */
export function useUpdateInvitationMusic(slug: string) {
  return useMutation({
    mutationFn: async (opts: { file?: File | null; remove?: boolean }) => {
      console.log(`[MUSIC] useUpdateInvitationMusic slug=${slug} remove=${!!opts.remove}`);
      const { data: cur } = await supabase
        .from("invitations")
        .select("music_url")
        .eq("slug", slug)
        .maybeSingle();
      const oldUrl = (cur as { music_url?: string | null } | null)?.music_url ?? null;

      let newUrl: string | null = oldUrl;
      if (opts.remove) {
        await deleteMusicFile(oldUrl);
        newUrl = null;
      } else if (opts.file) {
        const uploaded = await uploadMusicFile(slug, opts.file);
        await deleteMusicFile(oldUrl);
        newUrl = uploaded;
      }

      const { error } = await supabase
        .from("invitations")
        .update({ music_url: newUrl } satisfies Partial<TablesUpdate<"invitations">>)
        .eq("slug", slug);
      if (error) throw error;
      console.log(`[MUSIC] music updated -> ${newUrl ?? "removed"}`);
      return newUrl;
    },
  });
}
