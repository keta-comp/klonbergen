/**
 * VenueCard — the big horizontal card used on the Super Admin "Toyxonalar" page.
 *
 * Responsive 4-column layout (desktop):  Image | Main Info | Subscription | Actions
 *   - Tablet (md): two rows → [Image · Main Info] / [Subscription · Actions]
 *   - Mobile: full vertical stack, every block full width.
 *
 * The status badge lives inside Main Info; Subscription combines TARIF + ABONEMENT.
 * Action buttons never shrink (flex-shrink-0) so labels can't be clipped/overlapped.
 */
import { useState } from 'react';
import { Building2, MapPin, Phone, Users, Heart, MoreVertical, Settings, Archive, ArchiveRestore, CreditCard } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { formatNumber, formatDate as formatLocaleDate } from '@/i18n/format';
import { useHallSubscription, useHallWeddingCounts, useHallAdminCounts } from '@/hooks/useAdminData';
import { daysRemaining, statusKey, totalDays } from '@/lib/subscription';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Hall = Tables<'wedding_halls'>;

interface Props {
  hall: Hall;
  onManage: (hallId: string) => void;
  onAdmins: (hall: Hall) => void;
  onPay: (hall: Hall) => void;
  onArchive: (hall: Hall) => void;
  onRestore: (hall: Hall) => void;
}

export default function VenueCard({ hall, onManage, onAdmins, onPay, onArchive, onRestore }: Props) {
  const { t, locale } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: sub } = useHallSubscription(hall.id);
  const { data: weddingCounts } = useHallWeddingCounts();
  const { data: adminCounts } = useHallAdminCounts();

  const days = sub ? daysRemaining(sub.expires_at) : null;
  const total = sub ? totalDays(sub.started_at, sub.expires_at) : 30;
  const remaining = days !== null ? Math.max(0, days) : 0;
  const elapsed = total - remaining;
  const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
  const isExpired = days !== null && days <= 0;
  const status: 'faol' | 'sinov' | 'muddati_tugagan' | 'bloklangan' | 'archived' = hall.archived
    ? 'archived'
    : sub
      ? statusKey(sub.status as 'active' | 'trial' | 'expired' | 'blocked' | 'archived', days ?? 0)
      : 'sinov';

  const statusColors: Record<typeof status, string> = {
    faol: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    sinov: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    muddati_tugagan: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    bloklangan: 'bg-rose-100 text-rose-800 ring-rose-600/20',
    archived: 'bg-neutral-100 text-neutral-600 ring-neutral-500/20',
  } as Record<typeof status, string>;

  const dotColor =
    status === 'faol' ? 'bg-emerald-500' : status === 'sinov' ? 'bg-amber-500' : status === 'muddati_tugagan' ? 'bg-rose-500' : 'bg-neutral-400';

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-center lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)_auto] lg:gap-6">
        {/* IMAGE */}
        <div className="flex items-center justify-center lg:block">
          {hall.cover_url ? (
            <img src={hall.cover_url} alt={hall.name} className="h-28 w-28 rounded-xl object-cover" />
          ) : (
            <div className="grid h-28 w-28 place-items-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200">
              <Building2 className="h-7 w-7 text-neutral-400" />
            </div>
          )}
        </div>

        {/* MAIN INFO */}
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-1 text-[15.5px] font-semibold text-neutral-900">{hall.name}</h3>
            <span
              className={cn(
                'inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset',
                statusColors[status],
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />
              {t(`superadmin.halls.status.${status}`)}
            </span>
          </div>
          <div className="space-y-0.5 text-[12px] text-neutral-500">
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{hall.address || t('superadmin.halls.card.no_address')}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{hall.phone || t('superadmin.halls.card.no_phone')}</span>
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11.5px] text-neutral-500">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {adminCounts?.[hall.id] ?? 0} {t('superadmin.halls.card.adminlar')}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" /> {weddingCounts?.[hall.id] ?? 0} {t('superadmin.halls.card.toylar')}
            </span>
          </div>
        </div>

        {/* SUBSCRIPTION (TARIF + ABONEMENT) */}
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400">
            {t('superadmin.halls.card.tarif')}
          </p>
          {sub?.plan ? (
            <>
              <p className="mt-1 line-clamp-1 text-[13px] font-medium text-neutral-800">{sub.plan.name}</p>
              <p className="text-[12px] text-neutral-500">
                {formatNumber(locale, Number(sub.plan.price))} {t('superadmin.plans.per_month')}
              </p>
            </>
          ) : (
            <p className="mt-1 text-[12px] italic text-neutral-400">—</p>
          )}

          <p className="mt-2 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400">
            {t('superadmin.halls.card.abonement')}
          </p>
          {sub ? (
            <div className="mt-1 space-y-1">
              <p className="text-[12px] text-neutral-700">
                {formatLocaleDate(sub.started_at)} <span className="text-neutral-400">→</span> {formatLocaleDate(sub.expires_at)}
              </p>
              {!isExpired ? (
                <>
                  <p className="text-[11.5px] text-neutral-500">
                    {t('superadmin.halls.card.qolgan')}: <span className="font-semibold text-neutral-700">{remaining}</span> {t('superadmin.halls.card.kun')}
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        days !== null && days <= 3
                          ? 'bg-rose-500'
                          : days !== null && days <= 7
                            ? 'bg-amber-500'
                            : 'bg-emerald-500',
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-[12px] font-medium text-rose-600">
                  {t('superadmin.halls.card.muddati_tugagan')}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-1 text-[12px] italic text-neutral-400">—</p>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
          {!hall.archived && (
            <button
              type="button"
              onClick={() => onPay(hall)}
              className={cn(
                'flex-shrink-0 rounded-lg px-3 py-1.5 text-[11.5px] font-medium shadow-sm',
                isExpired
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
              )}
            >
              <CreditCard className="mr-1 inline h-3 w-3" /> {t('superadmin.halls.actions.pay')}
            </button>
          )}
          <button
            type="button"
            onClick={() => onManage(hall.id)}
            className="flex-shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Settings className="mr-1 inline h-3 w-3" /> {t('superadmin.halls.actions.manage')}
          </button>
          <button
            type="button"
            onClick={() => onAdmins(hall)}
            className="flex-shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Users className="mr-1 inline h-3 w-3" /> {t('superadmin.halls.actions.admins')}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-xl">
                {hall.archived ? (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onRestore(hall); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] text-neutral-700 hover:bg-neutral-50"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" /> {t('superadmin.halls.actions.restore')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onArchive(hall); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] text-neutral-700 hover:bg-neutral-50"
                  >
                    <Archive className="h-3.5 w-3.5" /> {t('superadmin.halls.actions.archive')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
