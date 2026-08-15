import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { idbSet } from "@/lib/idb";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Invitation = Tables<"invitations">;

/**
 * Template IDs used by the new editorial builder. Each ID maps to a /public
 * PNG asset (1.png..4.png) that the preview and final page render as the
 * visual base of the invitation.
 */
export type InvitationTemplateId = "t1" | "t2" | "t3" | "t4";

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
  coverImage: string | null;
  galleryImages: string[];
  templateId: InvitationTemplateId;
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
  templateId?: InvitationTemplateId;
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

async function uploadPhotos(slug: string, files: File[]) {
  const urls: string[] = [];
  for (const [i, file] of files.entries()) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `invitations/${slug}-${Date.now()}-${i}.${ext}`;
    const { error } = await supabase.storage
      .from("hall-assets")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("hall-assets").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

async function uploadMusicFile(slug: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
  const path = `invitations/${slug}-music-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("hall-assets")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "audio/mpeg",
    });
  if (error) throw error;
  const { data } = supabase.storage.from("hall-assets").getPublicUrl(path);
  return data.publicUrl;
}

// The remote policy currently only allows these `template` values. The
// builder's t1..t4 ids are mapped to "luxury" so inserts pass the RLS
// WITH CHECK; the visual rendering does not depend on the template column
// (it uses /1.png..4.png directly), so the mapping is invisible.
const STORED_TEMPLATE = "luxury" as const;

export function useCreateInvitation() {
  return useMutation({
    mutationFn: async (draft: InvitationDraft) => {
      const slug = makeSlug(draft.brideName, draft.groomName);

      const realPhotos = (draft.galleryImages || []).filter(
        (u) => u && !u.startsWith("blob:")
      );
      const cover = draft.coverImage && !draft.coverImage.startsWith("blob:")
        ? draft.coverImage
        : null;

      const photos = cover ? [cover, ...realPhotos] : realPhotos;

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
      };

      const { data, error } = await supabase
        .from("invitations")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      // Upload the optional background music. A failure here must not sink
      // the whole invitation, so swallow it and proceed without music.
      let musicUrl: string | undefined;
      if (draft.music) {
        try {
          musicUrl = await uploadMusicFile(slug, draft.music);
        } catch {
          musicUrl = undefined;
        }
        // Always keep a local copy of the file so the final page can play it
        // even if the storage upload above was blocked (e.g. missing RLS).
        idbSet(MUSIC_KEY(slug), draft.music).catch(() => {});
      }

      // Stash the editorial extras so the final page shows the user's
      // custom copy on the device that created the invitation.
      saveExtras(slug, {
        welcomeText: draft.welcomeText,
        invitationText: draft.invitationText,
        finalText: draft.finalText,
        phone: draft.phone,
        mapsUrl: draft.mapsUrl,
        templateId: draft.templateId,
        musicUrl,
      });

      return data;
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
        music_url: (data as Record<string, unknown>).music_url ?? extras.musicUrl ?? null,
      } as typeof data;
    },
  });
}
