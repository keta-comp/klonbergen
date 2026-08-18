/**
 * Vowly Super Admin — redesigned dashboard.
 * Sections: Bosh sahifa, Toyxonalar, Adminlar, To'ylar, To'lovlar, Hisobotlar, Sozlamalar, Bildirishnomalar, Activity Log.
 * Layout: SuperAdminLayout (sidebar + header + right column). Active section is internal state.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Building2, ShieldCheck, Clock, AlertCircle, Heart, Users, Receipt, BarChart3, Settings as SettingsIcon, Bell as BellIcon, Activity } from 'lucide-react';

import { useTranslation } from '@/i18n/LanguageContext';
import { formatNumber, formatDate, formatDateTime } from '@/i18n/format';
import { useAuth } from '@/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import {
  useAdminHalls,
  useAllSubscriptions,
  usePayments,
  useAdminNotifications,
  useActivityLogs,
  useArchiveHall,
  useRestoreHall,
  useDeleteHall,
  useMarkNotificationRead,
} from '@/hooks/useAdminData';
import { daysRemaining } from '@/lib/subscription';

import SuperAdminLayout, { SectionId } from '@/components/superadmin/SuperAdminLayout';
import VenueCard from '@/components/superadmin/VenueCard';
import AddHallModal from '@/components/superadmin/AddHallModal';
import AddAdminModal from '@/components/superadmin/AddAdminModal';
import PaymentConfirmModal from '@/components/superadmin/PaymentConfirmModal';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Hall = Tables<'wedding_halls'>;

const FILTERS = ['all', 'active', 'trial', 'expired', 'blocked', 'archived'] as const;
type Filter = (typeof FILTERS)[number];

export default function SuperAdminDashboard() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [active, setActive] = useState<SectionId>('bosh_sahifa');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [payHall, setPayHall] = useState<Hall | null>(null);

  // For now we use the same halls list (active or archived) for the page.
  const { data: halls = [] } = useAdminHalls({ includeArchived: true });
  const { data: allSubs = [] } = useAllSubscriptions();
  const archive = useArchiveHall();
  const restore = useRestoreHall();
  const remove = useDeleteHall();
  const markRead = useMarkNotificationRead();

  // ---- Stat computation (real data) -----------------------------------------
  const stats = useMemo(() => {
    let active = 0;
    let trial = 0;
    let expired = 0;
    const byHall: Record<string, (typeof allSubs)[number] | undefined> = {};
    for (const s of allSubs) {
      byHall[s.hall_id] = s;
    }
    for (const h of halls) {
      if (h.archived) continue;
      const s = byHall[h.id];
      if (!s) { trial++; continue; }
      const days = daysRemaining(s.expires_at);
      if (s.status === 'trial' || (s.status === 'active' && days > 30)) trial++;
      else if (s.status === 'active' && days > 0) active++;
      else expired++;
    }
    return { total: halls.length, active, trial, expired };
  }, [halls, allSubs]);

  // ---- Filtered halls -------------------------------------------------------
  const visibleHalls = useMemo(() => {
    return halls.filter((h) => {
      // search
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !h.name.toLowerCase().includes(q) &&
          !(h.address ?? '').toLowerCase().includes(q) &&
          !(h.phone ?? '').toLowerCase().includes(q)
        ) return false;
      }
      if (filter === 'archived') {
        if (!h.archived) return false;
      } else if (filter !== 'all') {
        if (h.archived) return false;
        const s = allSubs.find((x) => x.hall_id === h.id);
        if (filter === 'active') {
          if (!s || s.status !== 'active' || daysRemaining(s.expires_at) <= 0) return false;
        } else if (filter === 'trial') {
          if (!s || s.status !== 'trial') return false;
        } else if (filter === 'expired') {
          if (!s || s.status === 'active' || daysRemaining(s.expires_at) > 0) return false;
        }
      }
      return true;
    });
  }, [halls, search, filter, allSubs]);

  const onManage = (hallId: string) => {
    // jump to that hall's admin panel (locale-prefixed route)
    navigate(`/${locale}/admin/bosh-sahifa?hall=${hallId}`);
  };

  const onAdmins = (hall: Hall) => {
    // TODO: open admins panel for that hall
    setActive('adminlar');
  };

  const onArchive = async (hall: Hall) => {
    if (!confirm(t('superadmin.archiveConfirm', { name: hall.name }))) return;
    await archive.mutateAsync(hall.id);
  };
  const onRestore = async (hall: Hall) => {
    await restore.mutateAsync(hall.id);
  };
  const onDelete = async (hall: Hall) => {
    if (!confirm(t('superadmin.deleteConfirm', { name: hall.name }))) return;
    try {
      await remove.mutateAsync(hall.id);
      toast.success(t('superadmin.deleted', { name: hall.name }));
    } catch (e) {
      toast.error(t('superadmin.deleteFailed', { message: (e as Error).message }));
    }
  };

  return (
    <SuperAdminLayout active={active} onChange={setActive}>
      {active === 'bosh_sahifa' && (
        <BoshSahifa
          stats={stats}
          onGoToHalls={() => setActive('toyxonalar')}
          onAdd={() => setAddOpen(true)}
        />
      )}

      {active === 'toyxonalar' && (
        <section>
          <SectionHeader
            title={t('superadmin.halls.title')}
            subtitle={t('superadmin.halls.subtitle')}
            right={
              <Button
                onClick={() => setAddOpen(true)}
                className="rounded-lg bg-[#3a4530] px-3 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-[#2f3827]"
              >
                <Plus className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">{t('superadmin.halls.add')}</span>
                <span className="sm:hidden">+</span>
              </Button>
            }
          />

          {/* Search + filter bar */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('superadmin.halls.search')}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-full px-3 py-1 text-[12px] font-medium transition-colors',
                    filter === f
                      ? 'bg-[#3a4530] text-white'
                      : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
                  )}
                >
                  {t(`superadmin.halls.filter.${f}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          {visibleHalls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-[13px] text-neutral-500">
              {halls.length === 0 ? t('superadmin.halls.empty') : t('superadmin.halls.no_results')}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleHalls.map((hall) => (
                <VenueCard
                  key={hall.id}
                  hall={hall}
                  onManage={onManage}
                  onAdmins={onAdmins}
                  onPay={(h) => setPayHall(h)}
                  onArchive={onArchive}
                  onRestore={onRestore}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Other sections — themed placeholders that route to real data where possible */}
      {active === 'adminlar' && <AdminlarPage halls={halls} />}
      {active === 'toylar' && <ToylarPage />}
      {active === 'tolovlar' && <TolovlarPage />}
      {active === 'hisobotlar' && <ComingSoon title={t('superadmin.nav.hisobotlar')} icon={BarChart3} />}
      {active === 'sozlamalar' && <ComingSoon title={t('superadmin.nav.sozlamalar')} icon={SettingsIcon} />}
      {active === 'bildirishnomalar' && <BildirishnomalarPage markRead={markRead.mutate} />}
      {active === 'activity' && <ActivityPage />}

      {addOpen && <AddHallModal onClose={() => setAddOpen(false)} />}
      {payHall && <PaymentConfirmModal hall={payHall} onClose={() => setPayHall(null)} />}
    </SuperAdminLayout>
  );
}

/* ============================================================================ */
/* Sub-pages                                                                     */
/* ============================================================================ */

function BoshSahifa({ stats, onGoToHalls, onAdd }: { stats: { total: number; active: number; trial: number; expired: number }; onGoToHalls: () => void; onAdd: () => void }) {
  const { t, locale } = useTranslation();
  return (
    <section className="space-y-5">
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Building2}
          color="bg-[#3a4530]/10 text-[#3a4530]"
          value={stats.total}
          label={t('superadmin.stats.total')}
          sub={t('superadmin.stats.totalSub')}
        />
        <StatCard
          icon={ShieldCheck}
          color="bg-emerald-50 text-emerald-700"
          value={stats.active}
          label={t('superadmin.stats.active')}
          sub={t('superadmin.stats.activeSub')}
        />
        <StatCard
          icon={Clock}
          color="bg-amber-50 text-amber-700"
          value={stats.trial}
          label={t('superadmin.stats.trial')}
          sub={t('superadmin.stats.trialSub')}
        />
        <StatCard
          icon={AlertCircle}
          color="bg-rose-50 text-rose-700"
          value={stats.expired}
          label={t('superadmin.stats.expired')}
          sub={t('superadmin.stats.expiredSub')}
        />
      </div>

      <div className="rounded-2xl border border-neutral-200/70 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-neutral-900">{t('superadmin.halls.title')}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onGoToHalls}>
              {t('superadmin.all')}
            </Button>
            <Button size="sm" onClick={onAdd} className="bg-[#3a4530] text-white hover:bg-[#2f3827]">
              <Plus className="mr-1 h-3.5 w-3.5" /> {t('superadmin.halls.add')}
            </Button>
          </div>
        </div>
        <p className="text-[12.5px] text-neutral-500">
          {t('superadmin.halls.subtitle')}
        </p>
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, color, value, label, sub }: { icon: React.ElementType; color: string; value: number; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm">
      <div className={cn('grid h-11 w-11 flex-shrink-0 place-items-center rounded-full', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[22px] font-semibold leading-none text-neutral-900">{value}</p>
        <p className="mt-0.5 truncate text-[12.5px] font-medium text-neutral-700">{label}</p>
        <p className="truncate text-[10.5px] text-neutral-500">{sub}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, right }: { title: string; subtitle: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-[20px] font-semibold text-neutral-900 md:text-[22px]">{title}</h2>
        <p className="mt-0.5 text-[12.5px] text-neutral-500">{subtitle}</p>
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}

function ComingSoon({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  const { t, locale } = useTranslation();
  return (
    <section>
      <SectionHeader title={title} subtitle={t('superadmin.common.coming_soon')} />
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-neutral-500">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-[13px] text-neutral-500">{t('superadmin.common.coming_soon')}</p>
      </div>
    </section>
  );
}

/* ----- Adminlar ----- */
function AdminlarPage({ halls }: { halls: Hall[] }) {
  const { t } = useTranslation();
  const [addOpen, setAddOpen] = useState(false);
  return (
    <section>
      <SectionHeader
        title={t('superadmin.nav.adminlar')}
        subtitle={t('superadmin.admins.intro')}
        right={
          <Button
            onClick={() => setAddOpen(true)}
            disabled={halls.length === 0}
            className="rounded-lg bg-[#3a4530] px-3 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-[#2f3827] disabled:bg-neutral-300"
            title={halls.length === 0 ? t('superadmin.admins.no_halls') : undefined}
          >
            <Plus className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">{t('superadmin.admins.add')}</span>
            <span className="sm:hidden">+</span>
          </Button>
        }
      />
      <AdminlarList halls={halls} />
      {addOpen && <AddAdminModal halls={halls} onClose={() => setAddOpen(false)} />}
    </section>
  );
}

function AdminlarList({ halls }: { halls: Hall[] }) {
  const { t } = useTranslation();
  const { data: profiles } = useProfilesData();
  const { data: allAdmins } = useAdminsData();
  if (!profiles) return <div className="rounded-2xl border bg-white p-6 text-center text-[12.5px] text-neutral-500">{t('superadmin.loading')}</div>;
  if (profiles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-[13px] text-neutral-500">
        {t('superadmin.admins.empty')}
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white">
      <ul className="divide-y divide-neutral-100">
        {profiles.map((p) => {
          const isAdmin = allAdmins?.find((a) => a.user_id === p.user_id);
          const hall = isAdmin ? halls.find((h) => h.id === isAdmin.hall_id) : null;
          return (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-200 text-[12px] font-semibold text-neutral-600">
                {(p.full_name || p.email || '?').slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-neutral-800">{p.full_name || p.email}</p>
                <p className="truncate text-[11.5px] text-neutral-500">{p.email}</p>
              </div>
              <div className="text-right">
                {p.approved ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700">{t('superadmin.approved')}</span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700">{t('superadmin.pending')}</span>
                )}
                {hall && <p className="mt-1 text-[10.5px] text-neutral-500">{hall.name}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function useProfilesData() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; user_id: string; full_name: string | null; email: string | null; avatar_url: string | null; approved: boolean | null; approved_at: string | null; created_at: string | null }>;
    },
  });
}

function useAdminsData() {
  return useQuery({
    queryKey: ['hall_admins'],
    queryFn: async () => {
      const { data, error } = await supabase.from('hall_admins').select('*');
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; hall_id: string; user_id: string; email: string; full_name: string | null }>;
    },
  });
}

/* ----- To'ylar ----- */
function ToylarPage() {
  const { t, locale } = useTranslation();
  const { data: halls = [] } = useAdminHalls();
  const { data: weddings } = useQuery({
    queryKey: ['all-weddings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('weddings').select('*').order('wedding_date', { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; hall_id: string; bride_name: string; groom_name: string; wedding_date: string | null; status: string | null }>;
    },
  });

  return (
    <section>
      <SectionHeader title={t('superadmin.nav.toylar')} subtitle={t('superadmin.allWeddings')} />
      <div className="rounded-2xl border border-neutral-200/70 bg-white">
        {!weddings ? (
          <p className="p-6 text-center text-[12.5px] text-neutral-500">{t('superadmin.loading')}</p>
        ) : weddings.length === 0 ? (
          <p className="p-6 text-center text-[12.5px] text-neutral-500">{t('superadmin.noWeddings')}</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {weddings.map((w) => {
              const hall = halls.find((h) => h.id === w.hall_id);
              return (
                <li key={w.id} className="flex items-center gap-3 px-4 py-3">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-neutral-800">
                      {w.groom_name} &amp; {w.bride_name}
                    </p>
                    <p className="truncate text-[11.5px] text-neutral-500">{hall?.name ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-neutral-700">{w.wedding_date ?? '—'}</p>
                    <p className="text-[10.5px] text-neutral-500">{w.status}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ----- To'lovlar ----- */
function TolovlarPage() {
  const { t, locale } = useTranslation();
  const { data: payments = [] } = usePayments();
  return (
    <section>
      <SectionHeader title={t('superadmin.nav.tolovlar')} subtitle={t('superadmin.paymentsHistory')} />
      <div className="rounded-2xl border border-neutral-200/70 bg-white">
        {payments.length === 0 ? (
          <p className="p-6 text-center text-[12.5px] text-neutral-500">{t('superadmin.noPayments')}</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-neutral-800">
                    {p.hall?.name ?? '—'} — {p.plan?.name ?? '—'}
                  </p>
                  <p className="truncate text-[11.5px] text-neutral-500">
                    {formatDate(locale, p.paid_at)}
                  </p>
                </div>
                <p className="text-[13.5px] font-semibold text-neutral-800">
                  {formatNumber(locale, Number(p.amount))} {t('common.currency')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ----- Bildirishnomalar ----- */
function BildirishnomalarPage({ markRead }: { markRead: (id: string) => void }) {
  const { t, locale } = useTranslation();
  const { data: notifications = [] } = useAdminNotifications(100);
  return (
    <section>
      <SectionHeader title={t('superadmin.nav.bildirishnomalar')} subtitle={t('superadmin.allNotifications')} />
      <div className="rounded-2xl border border-neutral-200/70 bg-white">
        {notifications.length === 0 ? (
          <p className="p-6 text-center text-[12.5px] text-neutral-500">{t('superadmin.notifications.empty')}</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={cn('flex items-start gap-3 px-4 py-3', !n.read_at && 'bg-[#3a4530]/5')}
              >
                <span className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', n.read_at ? 'bg-neutral-300' : 'bg-[#3a4530]')} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-neutral-800">{n.title}</p>
                  <p className="text-[12.5px] text-neutral-500">{n.message}</p>
                  <p className="mt-0.5 text-[10.5px] text-neutral-400">{formatDateTime(locale, n.created_at)}</p>
                </div>
                {!n.read_at && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="text-[11.5px] font-medium text-[#3a4530] hover:underline"
                  >
                    {t('superadmin.markRead')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ----- Activity Log ----- */
function ActivityPage() {
  const { t, locale } = useTranslation();
  const { data: logs = [] } = useActivityLogs(200);
  return (
    <section>
      <SectionHeader title={t('superadmin.nav.activity')} subtitle={t('superadmin.allActions')} />
      <div className="rounded-2xl border border-neutral-200/70 bg-white">
        {logs.length === 0 ? (
          <p className="p-6 text-center text-[12.5px] text-neutral-500">{t('superadmin.activity.empty')}</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {logs.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                <Activity className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-neutral-800">
                  {(() => {
                    const sep = a.description.indexOf('|');
                    if (sep <= 0) return a.description;
                    const key = `superadmin.activity.${a.description.slice(0, sep)}`;
                    const name = a.description.slice(sep + 1);
                    const out = t(key, { name });
                    return out === key ? a.description : out;
                  })()}
                </p>
                  <p className="text-[10.5px] text-neutral-400">
                    {a.actor_email ?? '—'} · {formatDateTime(locale, a.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
