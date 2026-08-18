import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useWeddingHalls() {
  return useQuery({
    queryKey: ['wedding_halls'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wedding_halls').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useHallAdmins(hallId?: string) {
  return useQuery({
    queryKey: ['hall_admins', hallId],
    queryFn: async () => {
      let q = supabase.from('hall_admins').select('*');
      if (hallId) q = q.eq('hall_id', hallId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Food items. Optionally scoped to a wedding — if `weddingId` is provided,
 * only that wedding's menu is returned; otherwise legacy hall-wide behavior
 * is used (a null `wedding_id` row matches so old data stays visible).
 */
export function useFoodItems(hallId: string, weddingId?: string | null) {
  return useQuery({
    queryKey: ['food_items', hallId, weddingId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('food_items').select('*').eq('hall_id', hallId);
      if (weddingId) q = q.eq('wedding_id', weddingId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });
}

export function useArtists(hallId: string, weddingId?: string | null) {
  return useQuery({
    queryKey: ['artists', hallId, weddingId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('artists').select('*').eq('hall_id', hallId);
      if (weddingId) q = q.eq('wedding_id', weddingId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });
}

export function useBrideGroom(hallId: string, weddingId?: string | null) {
  return useQuery({
    queryKey: ['bride_groom', hallId, weddingId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('bride_groom').select('*').eq('hall_id', hallId);
      if (weddingId) q = q.eq('wedding_id', weddingId);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });
}

export function useBanners(hallId: string, weddingId?: string | null) {
  return useQuery({
    queryKey: ['banners', hallId, weddingId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('banners').select('*').eq('hall_id', hallId);
      if (weddingId) q = q.eq('wedding_id', weddingId);
      const { data, error } = await q.order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });
}

export function useMutateHall() {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async (hall: { name: string; address?: string; phone?: string; cover_url?: string | null }) => {
      const { data, error } = await supabase.from('wedding_halls').insert(hall).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wedding_halls'] }),
  });
  const update = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string; name?: string; address?: string; phone?: string }) => {
      const { error } = await supabase.from('wedding_halls').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wedding_halls'] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wedding_halls').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wedding_halls'] }),
  });
  return { create, update, remove };
}

export function useMutateFood(hallId: string, weddingId?: string | null) {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async (item: { name: string; price?: number; description?: string; is_today?: boolean; image_url?: string | null }) => {
      const { error } = await supabase.from('food_items').insert({ ...item, hall_id: hallId, wedding_id: weddingId ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food_items', hallId] }),
  });
  const update = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string; name?: string; price?: number; description?: string; is_today?: boolean; image_url?: string | null }) => {
      const { error } = await supabase.from('food_items').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food_items', hallId] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('food_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food_items', hallId] }),
  });
  return { create, update, remove };
}

export function useUpdateHallMusic(hallId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { url: string | null; title?: string | null }) => {
      const update: Record<string, unknown> = {
        // url === null means "remove music": clear everything.
        music_url: payload.url,
        music_title: payload.url ? (payload.title ?? null) : null,
        music_created_at: payload.url ? new Date().toISOString() : null,
      };
      const { error } = await supabase
        .from('wedding_halls')
        .update(update as any)
        .eq('id', hallId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wedding_halls'] });
      qc.invalidateQueries({ queryKey: ['hall', hallId] });
    },
  });
}

/**
 * Best-effort removal of a hall-assets object referenced by a public URL.
 * Only deletes paths under `<hallId>/` so one hall can never delete another
 * hall's files (multi-tenant isolation). Never throws — the DB row is cleared by
 * the caller regardless of the storage outcome.
 */
export async function deleteHallAsset(url: string | null, hallId: string): Promise<void> {
  if (!url) return;
  try {
    const marker = '/hall-assets/';
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = url.slice(idx + marker.length);
    if (!path.startsWith(`${hallId}/`)) return; // safety: not this hall's file
    await supabase.storage.from('hall-assets').remove([path]);
  } catch {
    /* best effort */
  }
}

export function useMutateArtist(hallId: string, weddingId?: string | null) {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async (item: { name: string; performance_time?: string; description?: string; image_url?: string | null }) => {
      const { error } = await supabase.from('artists').insert({ ...item, hall_id: hallId, wedding_id: weddingId ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['artists', hallId] }),
  });
  const update = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string; name?: string; performance_time?: string; description?: string }) => {
      const { error } = await supabase.from('artists').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['artists', hallId] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('artists').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['artists', hallId] }),
  });
  return { create, update, remove };
}

export function useMutateBrideGroom(hallId: string, weddingId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { bride_name: string; groom_name: string; bride_photo?: string; groom_photo?: string; love_story?: string; wedding_date?: string; id?: string }) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from('bride_groom').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bride_groom').insert({ ...data, hall_id: hallId, wedding_id: weddingId ?? null });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bride_groom', hallId] }),
  });
}

export function useMutateBanner(hallId: string, weddingId?: string | null) {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async (item: { title?: string; image_url: string; sort_order?: number }) => {
      const { error } = await supabase.from('banners').insert({ ...item, hall_id: hallId, wedding_id: weddingId ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners', hallId] }),
  });
  const update = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string; title?: string; image_url?: string; sort_order?: number }) => {
      const { error } = await supabase.from('banners').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners', hallId] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners', hallId] }),
  });
  return { create, update, remove };
}

export async function uploadHallAsset(file: File, hallId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${hallId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('hall-assets').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('hall-assets').getPublicUrl(path);
  return data.publicUrl;
}

export interface TimelineEvent {
  id: string;
  hall_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  start_time: string;
  end_time: string | null;
  sort_order: number;
}

export function useTimelineEvents(hallId: string, weddingId?: string | null) {
  return useQuery({
    queryKey: ['timeline_events', hallId, weddingId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('timeline_events').select('*').eq('hall_id', hallId);
      if (weddingId) q = q.eq('wedding_id', weddingId);
      const { data, error } = await q.order('start_time', { ascending: true });
      if (error) throw error;
      return data as TimelineEvent[];
    },
    enabled: !!hallId,
  });
}

type TimelineInput = { title: string; description?: string | null; icon?: string | null; start_time: string; end_time?: string | null; sort_order?: number };

export function useMutateTimeline(hallId: string, weddingId?: string | null) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['timeline_events', hallId] });
  const create = useMutation({
    mutationFn: async (item: TimelineInput) => {
      const { error } = await supabase.from('timeline_events').insert({ ...item, hall_id: hallId, wedding_id: weddingId ?? null });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...rest }: TimelineInput & { id: string }) => {
      const { error } = await supabase.from('timeline_events').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('timeline_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  return { create, update, remove };
}
