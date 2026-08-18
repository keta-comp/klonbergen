import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeddingMoment {
  id: string;
  hall_id: string;
  wedding_id: string | null;
  image_url: string;
  storage_path: string | null;
  guest_name: string | null;
  table_number: string | null;
  caption: string | null;
  approved: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Realtime channel is deduped by Supabase by topic (channel name). Both the
// Moments admin page and the AdminTopbar call `useWeddingMoments(hallId)`
// with the same effective args, so the second `.channel().on()` would land on
// an already-subscribed channel and throw:
//   "cannot add 'postgres_changes' callbacks ... after subscribe(...)"
// To stay safe we share ONE channel per (hallId, weddingId) at the module
// level with a refcount: only the first subscriber creates + binds + subscribes;
// later callers just bump the refcount. The channel is removed once the last
// caller releases.
// ---------------------------------------------------------------------------
type MomentsEntry = { channel: ReturnType<typeof supabase.channel>; refs: number };
const momentsRegistry = new Map<string, MomentsEntry>();

const momentsKey = (hallId: string, weddingId: string | null | undefined) =>
  `${hallId}|${weddingId ?? 'all'}`;

function subscribeMoments(
  hallId: string,
  weddingId: string | null | undefined,
  qc: QueryClient,
): () => void {
  const key = momentsKey(hallId, weddingId);
  let entry = momentsRegistry.get(key);
  if (entry) {
    entry.refs += 1;
  } else {
    const channel = supabase
      .channel(`moments-${hallId}-${weddingId ?? 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wedding_moments', filter: `hall_id=eq.${hallId}` },
        () => qc.invalidateQueries({ queryKey: ['wedding_moments', hallId] }),
      )
      .subscribe();
    entry = { channel, refs: 1 };
    momentsRegistry.set(key, entry);
  }
  return () => {
    const e = momentsRegistry.get(key);
    if (!e) return;
    e.refs -= 1;
    if (e.refs <= 0) {
      supabase.removeChannel(e.channel);
      momentsRegistry.delete(key);
    }
  };
}

/** Photos of one wedding album, kept live via realtime. */
export function useWeddingMoments(hallId?: string, weddingId?: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['wedding_moments', hallId, weddingId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('wedding_moments').select('*').eq('hall_id', hallId!);
      if (weddingId) q = q.eq('wedding_id', weddingId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data as WeddingMoment[];
    },
    enabled: !!hallId,
  });

  useEffect(() => {
    if (!hallId) return;
    // Module-level refcounted channel: shared with any other component that
    // subscribes for the same (hallId, weddingId), so .on() is never called
    // after subscribe.
    return subscribeMoments(hallId, weddingId, qc);
  }, [hallId, qc, weddingId]);

  return query;
}

export function useUploadMoment(hallId: string, weddingId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      guestName,
      tableNumber,
      caption,
    }: { file: File; guestName?: string; tableNumber?: string | null; caption?: string }) => {
      const ext = file.name.split('.').pop() || 'jpg';
      // Each wedding album lives in its own folder: weddings/{hall_id}/{wedding_id}/
      const path = `weddings/${hallId}/${weddingId ?? 'current'}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('hall-assets')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('hall-assets').getPublicUrl(path);

      const { error } = await supabase.from('wedding_moments').insert({
        hall_id: hallId,
        wedding_id: weddingId ?? null,
        image_url: pub.publicUrl,
        storage_path: path,
        guest_name: guestName || null,
        table_number: tableNumber || null,
        caption: caption || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wedding_moments', hallId] }),
  });
}

export function useDeleteMoment(hallId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (moment: WeddingMoment) => {
      if (moment.storage_path) {
        await supabase.storage.from('hall-assets').remove([moment.storage_path]);
      }
      const { error } = await supabase.from('wedding_moments').delete().eq('id', moment.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wedding_moments', hallId] }),
  });
}

export function useToggleMomentApproval(hallId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase.from('wedding_moments').update({ approved }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wedding_moments', hallId] }),
  });
}

export function useRsvps(hallId?: string, weddingId?: string | null) {
  return useQuery({
    queryKey: ['rsvps', hallId, weddingId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('rsvps').select('*').eq('hall_id', hallId!);
      if (weddingId) q = q.eq('wedding_id', weddingId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });
}

export function useSendRsvp(hallId: string, weddingId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      guest_name: string;
      phone?: string;
      guests_count: number;
      attending: boolean;
      message?: string;
      table_number?: string | null;
    }) => {
      const { error } = await supabase.from('rsvps').insert({ ...payload, hall_id: hallId, wedding_id: weddingId ?? null });
      if (error) throw error;
    },
    // keep the admin RSVP list (keyed by ['rsvps', hallId, ...]) fresh after a guest submits
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rsvps', hallId] }),
  });
}
