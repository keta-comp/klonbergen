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

export function useFoodItems(hallId: string) {
  return useQuery({
    queryKey: ['food_items', hallId],
    queryFn: async () => {
      const { data, error } = await supabase.from('food_items').select('*').eq('hall_id', hallId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });
}

export function useArtists(hallId: string) {
  return useQuery({
    queryKey: ['artists', hallId],
    queryFn: async () => {
      const { data, error } = await supabase.from('artists').select('*').eq('hall_id', hallId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });
}

export function useBrideGroom(hallId: string) {
  return useQuery({
    queryKey: ['bride_groom', hallId],
    queryFn: async () => {
      const { data, error } = await supabase.from('bride_groom').select('*').eq('hall_id', hallId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });
}

export function useBanners(hallId: string) {
  return useQuery({
    queryKey: ['banners', hallId],
    queryFn: async () => {
      const { data, error } = await supabase.from('banners').select('*').eq('hall_id', hallId).order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });
}

export function useMutateHall() {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async (hall: { name: string; address?: string; phone?: string }) => {
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

export function useMutateFood(hallId: string) {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async (item: { name: string; price?: number; description?: string; is_today?: boolean }) => {
      const { error } = await supabase.from('food_items').insert({ ...item, hall_id: hallId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food_items', hallId] }),
  });
  const update = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string; name?: string; price?: number; description?: string; is_today?: boolean }) => {
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

export function useMutateArtist(hallId: string) {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async (item: { name: string; performance_time?: string; description?: string }) => {
      const { error } = await supabase.from('artists').insert({ ...item, hall_id: hallId });
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

export function useMutateBrideGroom(hallId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { bride_name: string; groom_name: string; bride_photo?: string; groom_photo?: string; love_story?: string; wedding_date?: string; id?: string }) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from('bride_groom').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bride_groom').insert({ ...data, hall_id: hallId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bride_groom', hallId] }),
  });
}

export function useMutateBanner(hallId: string) {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: async (item: { title?: string; image_url: string; sort_order?: number }) => {
      const { error } = await supabase.from('banners').insert({ ...item, hall_id: hallId });
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

export function useTimelineEvents(hallId: string) {
  return useQuery({
    queryKey: ['timeline_events', hallId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('hall_id', hallId)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data as TimelineEvent[];
    },
    enabled: !!hallId,
  });
}

type TimelineInput = { title: string; description?: string | null; icon?: string | null; start_time: string; end_time?: string | null; sort_order?: number };

export function useMutateTimeline(hallId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['timeline_events', hallId] });
  const create = useMutation({
    mutationFn: async (item: TimelineInput) => {
      const { error } = await supabase.from('timeline_events').insert({ ...item, hall_id: hallId });
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
