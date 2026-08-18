/**
 * Super Admin data hooks
 * ------------------------
 * Plans, subscriptions, payments, notifications, activity logs.
 * All queries are gated to super_admin via RLS.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Plan = Tables<'plans'>;
export type Subscription = Tables<'subscriptions'>;
export type Payment = Tables<'payments'>;
export type AppNotification = Tables<'notifications'>;
export type ActivityLog = Tables<'activity_logs'>;

/** All active plans (ordered by display_order). */
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });
}

/** All plans (active + inactive) — used by the Super Admin plan manager. */
export function useAllPlans() {
  return useQuery({
    queryKey: ['all-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });
}

/** All halls (active + archived). */
export function useAdminHalls(opts?: { includeArchived?: boolean }) {
  return useQuery({
    queryKey: ['admin-halls', opts?.includeArchived ?? false],
    queryFn: async () => {
      let q = supabase.from('wedding_halls').select('*').order('created_at', { ascending: false });
      if (!opts?.includeArchived) q = q.eq('archived', false);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Tables<'wedding_halls'>[];
    },
  });
}

/** Current subscription for one hall (or all). */
export function useHallSubscription(hallId?: string | null) {
  return useQuery({
    queryKey: ['hall-subscription', hallId ?? 'none'],
    queryFn: async () => {
      if (!hallId) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('hall_id', hallId)
        .in('status', ['active', 'trial', 'expired'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as (Subscription & { plan: Plan }) | null;
    },
    enabled: !!hallId,
  });
}

/** All subscriptions joined with plan and hall (for Super Admin list). */
export function useAllSubscriptions() {
  return useQuery({
    queryKey: ['all-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*), hall:wedding_halls(id,name,archived)')
        .order('expires_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as (Subscription & { plan: Plan | null; hall: { id: string; name: string; archived: boolean } | null })[];
    },
  });
}

/** All payments (newest first). */
export function usePayments(hallId?: string | null) {
  return useQuery({
    queryKey: ['payments', hallId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('payments').select('*, plan:plans(code,name), hall:wedding_halls(id,name)').order('paid_at', { ascending: false });
      if (hallId) q = q.eq('hall_id', hallId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as (Payment & { plan: { code: string; name: string } | null; hall: { id: string; name: string } | null })[];
    },
  });
}

/** All notifications (newest first). */
export function useAdminNotifications(limit = 50) {
  return useQuery({
    queryKey: ['admin-notifications', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
  });
}

/** Unread notification count. */
export function useUnreadNotifications() {
  return useQuery({
    queryKey: ['admin-notifications-unread'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Activity log (newest first). */
export function useActivityLogs(limit = 50) {
  return useQuery({
    queryKey: ['activity-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ActivityLog[];
    },
  });
}

/** Wedding counts per hall (one cheap query, used for cards). */
export function useHallWeddingCounts() {
  return useQuery({
    queryKey: ['hall-wedding-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weddings')
        .select('hall_id', { count: 'exact' });
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((w: { hall_id: string }) => {
        counts[w.hall_id] = (counts[w.hall_id] ?? 0) + 1;
      });
      return counts;
    },
  });
}

/** Admin counts per hall. */
export function useHallAdminCounts() {
  return useQuery({
    queryKey: ['hall-admin-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hall_admins').select('hall_id');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((a: { hall_id: string }) => {
        counts[a.hall_id] = (counts[a.hall_id] ?? 0) + 1;
      });
      return counts;
    },
  });
}

/* =========================== Mutations ===================================== */

/** Run the server-side payment confirmation (RPC) — creates subscription + payment + activity log. */
export function useConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { hallId: string; planId: string; note?: string | null }) => {
      const { data, error } = await supabase.rpc('confirm_subscription_payment', {
        _hall_id: input.hallId,
        _plan_id: input.planId,
        _note: input.note ?? null,
      } as never);
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-subscriptions'] });
      qc.invalidateQueries({ queryKey: ['hall-subscription'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['activity-logs'] });
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });
}

/** Mark notifications as read. */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
      qc.invalidateQueries({ queryKey: ['admin-notifications-unread'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
      qc.invalidateQueries({ queryKey: ['admin-notifications-unread'] });
    },
  });
}

/** Archive a hall (does NOT delete any data). */
export function useArchiveHall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hallId: string) => {
      const { error } = await supabase
        .from('wedding_halls')
        .update({ archived: true, archived_at: new Date().toISOString() })
        .eq('id', hallId);
      if (error) throw error;

      // log it
      const { data: u } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert({
        actor_id: u.user?.id ?? null,
        actor_email: u.user?.email ?? null,
        hall_id: hallId,
        action: 'hall_archived',
        description: 'hall_archived|',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-halls'] });
      qc.invalidateQueries({ queryKey: ['wedding_halls'] });
      qc.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

export function useRestoreHall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hallId: string) => {
      const { error } = await supabase
        .from('wedding_halls')
        .update({ archived: false, archived_at: null })
        .eq('id', hallId);
      if (error) throw error;
      const { data: u } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert({
        actor_id: u.user?.id ?? null,
        actor_email: u.user?.email ?? null,
        hall_id: hallId,
        action: 'hall_restored',
        description: 'hall_restored|',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-halls'] });
      qc.invalidateQueries({ queryKey: ['wedding_halls'] });
      qc.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

/**
 * Permanently delete a hall (super_admin only).
 *
 * Cascade: PostgREST only succeeds if the FK constraints allow it. If the hall
 * has related rows that block deletion (e.g. weddings without ON DELETE CASCADE),
 * the error from `.delete()` will surface — caller should show the message.
 * `hall_admins` rows are removed first to give a clean delete even without a
 * DB-level CASCADE on that FK.
 */
export function useDeleteHall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hallId: string) => {
      // Best-effort cleanup of hall_admins first so the wedding_halls DELETE
      // doesn't fail on FK. Errors are ignored — if no rows exist or RLS blocks,
      // the wedding_halls DELETE will still report the real failure.
      await supabase.from('hall_admins').delete().eq('hall_id', hallId);

      const { error } = await supabase.from('wedding_halls').delete().eq('id', hallId);
      if (error) throw error;

      // Log after a successful delete (use a sentinel hall_id='00000000-0000-0000-0000-000000000000'
      // only if the column is nullable; here we leave hall_id as the deleted id so the log is
      // traceable in audit trails).
      const { data: u } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert({
        actor_id: u.user?.id ?? null,
        actor_email: u.user?.email ?? null,
        hall_id: hallId,
        action: 'hall_deleted',
        description: 'hall_deleted|',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-halls'] });
      qc.invalidateQueries({ queryKey: ['wedding_halls'] });
      qc.invalidateQueries({ queryKey: ['activity-logs'] });
      qc.invalidateQueries({ queryKey: ['hall-admin-counts'] });
      qc.invalidateQueries({ queryKey: ['hall-wedding-counts'] });
    },
  });
}

/** Trigger the auto-notification sync RPC (idempotent). */
export function useSyncSubscriptionNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('sync_subscription_notifications');
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
      qc.invalidateQueries({ queryKey: ['all-subscriptions'] });
    },
  });
}

/* =========================== Plan management =============================== */

export interface UpsertPlanInput {
  id?: string;
  code: string;
  name: string;
  price: number;
  period_days: number;
  description?: string | null;
  is_active: boolean;
  display_order: number;
}

/** Create or update a plan (super admin only). */
export function useUpsertPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertPlanInput) => {
      const payload = {
        code: input.code.trim(),
        name: input.name.trim(),
        price: input.price,
        period_days: input.period_days,
        description: input.description ?? null,
        is_active: input.is_active,
        display_order: input.display_order,
      };
      if (input.id) {
        const { error } = await supabase.from('plans').update(payload).eq('id', input.id);
        if (error) throw error;
        return input.id;
      }
      const { data, error } = await supabase.from('plans').insert(payload).select('id').single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['all-plans'] });
    },
  });
}

/** Delete a plan (super admin only). */
export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['all-plans'] });
    },
  });
}

/** Seed the three standard Vowly plans (venue / invitation / venue+invitation). */
export function useSeedDefaultPlans() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Preferred path: a SECURITY DEFINER RPC that bypasses the plans RLS INSERT
      // policy and inserts idempotently (ON CONFLICT DO UPDATE). See
      // 20260818000200_seed_default_plans_rpc.sql.
      const { error } = await supabase.rpc('seed_default_plans');
      if (error) {
        const rpcMissing = /seed_default_plans.*does not exist|function .*seed_default_plans.*does not exist/i.test(
          error.message ?? '',
        );
        if (rpcMissing) {
          // Fallback for environments where the RPC migration hasn't been applied yet:
          // insert the three standard plans directly (still requires super_admin RLS).
          const defaults: UpsertPlanInput[] = [
            { code: 'venue', name: 'Venue', price: 99000, period_days: 30, description: "Faqat to'yxona boshqaruvi", is_active: true, display_order: 1 },
            { code: 'invitation', name: 'Invitation', price: 299000, period_days: 30, description: "Faqat raqamli taklifnoma", is_active: true, display_order: 2 },
            { code: 'venue_invitation', name: 'Venue + Invitation', price: 399000, period_days: 30, description: "To'yxona va taklifnoma birgalikda", is_active: true, display_order: 3 },
          ];
          for (const d of defaults) {
            const { error: e2 } = await supabase
              .from('plans')
              .upsert(
                { code: d.code, name: d.name, price: d.price, period_days: d.period_days, description: d.description, is_active: d.is_active, display_order: d.display_order },
                { onConflict: 'code' },
              );
            if (e2) throw e2;
          }
        } else {
          throw error;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['all-plans'] });
    },
  });
}
