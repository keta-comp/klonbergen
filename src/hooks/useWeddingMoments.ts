import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WeddingMoment {
  id: string;
  hall_id: string;
  image_url: string;
  storage_path: string | null;
  guest_name: string | null;
  table_number: string | null;
  caption: string | null;
  approved: boolean;
  created_at: string;
}

/** Photos of one wedding album, kept live via realtime. */
export function useWeddingMoments(hallId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['wedding_moments', hallId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wedding_moments')
        .select('*')
        .eq('hall_id', hallId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WeddingMoment[];
    },
    enabled: !!hallId,
  });

  useEffect(() => {
    if (!hallId) return;
    const channel = supabase
      .channel(`moments-${hallId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wedding_moments', filter: `hall_id=eq.${hallId}` },
        () => qc.invalidateQueries({ queryKey: ['wedding_moments', hallId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [hallId, qc]);

  return query;
}

export function useUploadMoment(hallId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      guestName,
      tableNumber,
      caption,
    }: { file: File; guestName?: string; tableNumber?: string | null; caption?: string }) => {
      const ext = file.name.split('.').pop() || 'jpg';
      // Each wedding album lives in its own folder: weddings/{wedding_id}/
      const path = `weddings/${hallId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('hall-assets')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('hall-assets').getPublicUrl(path);

      const { error } = await supabase.from('wedding_moments').insert({
        hall_id: hallId,
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

export function useRsvps(hallId?: string) {
  return useQuery({
    queryKey: ['rsvps', hallId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('hall_id', hallId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });
}

export function useSendRsvp(hallId: string) {
  return useMutation({
    mutationFn: async (payload: {
      guest_name: string;
      phone?: string;
      guests_count: number;
      attending: boolean;
      message?: string;
      table_number?: string | null;
    }) => {
      const { error } = await supabase.from('rsvps').insert({ ...payload, hall_id: hallId });
      if (error) throw error;
    },
  });
}
