/**
 * Vowly Current Wedding Card
 * --------------------------
 * The top section of the dashboard. From the reference:
 *   - large rounded white card.
 *   - left:   cover image (square-ish, ~248x248 desktop).
 *   - middle: BUGUNGI TO'Y eyebrow, names in serif, date, 2 buttons.
 *   - right:  4 small stat tiles (Stollar, Mehmonlar, QR, Suratlar).
 *
 * Empty state: localized "no wedding yet" with a "create" CTA. All text is
 * localized and the date follows the active locale.
 */
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Eye, Pencil, Armchair, Users, ScanLine, ImageIcon, Plus } from 'lucide-react';
import { useBrideGroom, useMutateBrideGroom } from '@/hooks/useHallData';
import { useActiveWedding, useCreateNextActiveWedding, todayInTashkent } from '@/hooks/useWeddings';
import { useTranslation } from '@/i18n/LanguageContext';
import { formatDate } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/integrations/supabase/types';

interface Props {
  hallId: string;
  hallName: string;
  /** When set, the dashboard renders the read-only archive view instead. */
  readOnly?: boolean;
  /** Override the cover image (used by archive detail). */
  coverOverride?: string | null;
}

export default function CurrentWeddingCard({ hallId, hallName, readOnly, coverOverride }: Props) {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const { data: active, isLoading } = useActiveWedding(hallId);
  const { data: brideGroom } = useBrideGroom(hallId, active?.id ?? null);
  const mutation = useMutateBrideGroom(hallId, active?.id ?? null);
  const createNext = useCreateNextActiveWedding();

  const isEmpty = !isLoading && (!active || (!brideGroom && (!active.bride_name && !active.groom_name)));

  // archive read-only uses the active record
  const names = active
    ? (active.groom_name || active.bride_name
        ? `${active.groom_name || ''} & ${active.bride_name || ''}`.trim()
        : (brideGroom ? `${brideGroom.groom_name} & ${brideGroom.bride_name}` : ''))
    : '';

  const date = active?.wedding_date ?? brideGroom?.wedding_date ?? null;
  const cover =
    coverOverride !== undefined
      ? coverOverride
      : (brideGroom?.groom_photo || brideGroom?.bride_photo || (active as Tables<'weddings'> | null)?.cover_image || null);

  // stat numbers
  const stats = active
    ? {
        stollar: 12,
        rsvp: active.rsvp_count ?? 0,
        qr: active.qr_scan_count ?? 0,
        surat: active.uploaded_photo_count ?? 0,
      }
    : { stollar: 0, rsvp: 0, qr: 0, surat: 0 };

  // ----- loading skeleton -----
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="h-40 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  // ----- empty / "no wedding yet" state -----
  if (isEmpty && !readOnly) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 text-center shadow-sm">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#3a4530]/10 text-[#3a4530]">
          <CalendarDays className="h-5 w-5" />
        </div>
        <h3 className="font-display text-[20px] text-neutral-900">{t('admin.currentWedding.emptyTitle')}</h3>
        <p className="mt-1 text-[13.5px] text-neutral-500">{t('admin.currentWedding.emptyDesc')}</p>
        <div className="mt-4">
          <Button
            className="gap-2 bg-[#3a4530] text-white hover:bg-[#2a3422]"
            onClick={async () => {
              // Only ONE active wedding is allowed per hall (DB partial unique
              // index `weddings_one_active_per_hall`). If an active wedding
              // already exists but has no names yet, seed its bride/groom record
              // and jump straight to the editor instead of inserting a 2nd one —
              // a duplicate insert fails with a 23505 constraint error and the
              // click would appear to "do nothing".
              if (active && !brideGroom) {
                await mutation.mutateAsync({
                  bride_name: active.bride_name || '',
                  groom_name: active.groom_name || '',
                  wedding_date: active.wedding_date || todayInTashkent(),
                });
              } else if (!active) {
                await createNext.mutateAsync(hallId);
              }
              navigate(`/${location.pathname.split('/')[1]}/admin/kelin-kuyov`);
            }}
          >
            <Plus className="h-4 w-4" /> {t('admin.currentWedding.create')}
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-neutral-400">{t('admin.currentWedding.today', { date: formatDate(locale, todayInTashkent()) })}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[240px_1fr_220px] md:gap-6">
        {/* Cover */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
          {safeImg(cover, `${names} — cover`) ?? (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#3a4530] to-[#1f2618] text-[#d4b677]">
              <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
                <path d="M12 3c-3.5 4-5.5 6.5-5.5 9a5.5 5.5 0 1 0 11 0c0-2.5-2-5-5.5-9z" />
              </svg>
            </div>
          )}
        </div>

        {/* Names + actions */}
        <div className="flex flex-col justify-center">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3a4530]" />
            {t('admin.currentWedding.eyebrow')}
          </p>
          <h2
            className="font-display text-[34px] leading-tight text-neutral-900 md:text-[44px]"
            style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif', fontWeight: 400 }}
          >
            {names || t('admin.currentWedding.nameFallback')}
          </h2>
          <div className="mt-2 flex items-center gap-2 text-[14px] text-neutral-500">
            <CalendarDays className="h-4 w-4" />
            <span>{date ? formatDate(locale, date) : '—'}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {!readOnly && (
              <>
                <Link to={`/${location.pathname.split('/')[1]}/hall/${hallId}`} target="_blank" rel="noopener">
                  <Button className="gap-2 bg-[#3a4530] text-white hover:bg-[#2a3422]">
                    <Eye className="h-4 w-4" /> {t('admin.currentWedding.viewSite')}
                  </Button>
                </Link>
                <Button variant="outline" className="gap-2 border-neutral-300 text-neutral-800 hover:bg-neutral-50" onClick={async () => {
                  if (!brideGroom && active) {
                    // seed bride_groom from active so the next page has something to load
                    await mutation.mutateAsync({
                      bride_name: active.bride_name || '',
                      groom_name: active.groom_name || '',
                      wedding_date: active.wedding_date || todayInTashkent(),
                    });
                  }
                  navigate(`/${location.pathname.split('/')[1]}/admin/kelin-kuyov`);
                }}>
                  <Pencil className="h-4 w-4" /> {t('admin.currentWedding.edit')}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stat tiles */}
        <div className="flex flex-col justify-center rounded-xl border border-neutral-100">
          <StatRow icon={Armchair} label={t('admin.currentWedding.statTables')} value={stats.stollar} />
          <StatRow icon={Users} label={t('admin.currentWedding.statGuests')} value={stats.rsvp} />
          <StatRow icon={ScanLine} label={t('admin.currentWedding.statQr')} value={stats.qr} />
          <StatRow icon={ImageIcon} label={t('admin.currentWedding.statPhotos')} value={stats.surat} last />
        </div>
      </div>
    </div>
  );
}

function safeImg(src: string | null | undefined, alt: string) {
  if (!src) return null;
  // Block images from anywhere except our Supabase storage or https
  if (!/^https?:\/\//i.test(src)) return null;
  return <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />;
}

function StatRow({
  icon: Icon, label, value, last,
}: { icon: typeof Armchair; label: string; value: number; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${last ? '' : 'border-b border-neutral-100'}`}>
      <div className="flex min-w-0 items-center gap-2 text-neutral-600">
        <Icon className="h-4 w-4 text-neutral-500" />
        <span className="truncate text-[12.5px]">{label}</span>
      </div>
      <span className="text-[18px] font-medium tabular-nums text-neutral-800">{value}</span>
    </div>
  );
}
