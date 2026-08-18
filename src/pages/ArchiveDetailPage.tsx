/**
 * Vowly Archive Detail Page
 * -------------------------
 * Read-only full view of an archived wedding reached from the archive list's
 * "Arxivni ko'rish" button. Route: /:locale/admin/archive/:weddingId
 *
 * Top: hero strip with names, date, "TO'Y YAKUNLANGAN" status chip, ZIP button.
 * Below, navigable sections:
 *   - Wedding information
 *   - Dastur (programme)
 *   - Taomlar (menu)
 *   - Artistlar
 *   - Kelin & Kuyov
 *   - QR Tables (static snapshot — re-generate live in /admin/qr)
 *   - RSVP responses
 *   - To'y suratlari (gallery) — banners + uploaded moments
 *
 * Every section is data-driven from the live database (read-only).
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, CalendarDays, Image as ImageIcon, UtensilsCrossed, Music2, Heart, QrCode, ClipboardList, Camera,
  Download, Loader2, CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { formatDate } from '@/i18n/format';
import type { Locale } from '@/i18n/config';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  downloadWeddingArchive, todayInTashkent,
} from '@/hooks/useWeddings';

const SECTION_IDS = [
  'info', 'program', 'menu', 'artists', 'couple', 'qr', 'rsvp', 'gallery', 'moments',
] as const;

interface Props { hallId: string; }

function safeImg(src: string | null | undefined, alt: string) {
  if (!src) return null;
  if (!/^https?:\/\//i.test(src)) return null;
  return <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />;
}

export default function ArchiveDetailPage({ hallId }: Props) {
  const { t } = useTranslation();
  const { weddingId, locale: localeParam } = useParams();
  const navigate = useNavigate();
  const locale = (localeParam || location.pathname.split('/')[1] || 'uz') as Locale;
  const [busy, setBusy] = useState(false);

  // load the wedding
  const { data: wedding, isLoading } = useQuery({
    queryKey: ['archive-wedding', weddingId],
    queryFn: async () => {
      if (!weddingId) return null;
      const { data, error } = await supabase.from('weddings').select('*').eq('id', weddingId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!weddingId,
  });

  const { data: brideGroom } = useQuery({
    queryKey: ['archive-bride', weddingId],
    queryFn: async () => {
      if (!weddingId) return null;
      const { data, error } = await supabase.from('bride_groom').select('*').eq('hall_id', hallId).eq('wedding_id', weddingId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!weddingId,
  });

  const { data: timeline } = useQuery({
    queryKey: ['archive-timeline', weddingId],
    queryFn: async () => {
      if (!weddingId) return [];
      const { data, error } = await supabase.from('timeline_events').select('*').eq('hall_id', hallId).eq('wedding_id', weddingId).order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!weddingId,
  });

  const { data: foods } = useQuery({
    queryKey: ['archive-food', weddingId],
    queryFn: async () => {
      if (!weddingId) return [];
      const { data, error } = await supabase.from('food_items').select('*').eq('hall_id', hallId).eq('wedding_id', weddingId).order('created_at');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!weddingId,
  });

  const { data: artists } = useQuery({
    queryKey: ['archive-artists', weddingId],
    queryFn: async () => {
      if (!weddingId) return [];
      const { data, error } = await supabase.from('artists').select('*').eq('hall_id', hallId).eq('wedding_id', weddingId).order('created_at');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!weddingId,
  });

  const { data: banners } = useQuery({
    queryKey: ['archive-banners', weddingId],
    queryFn: async () => {
      if (!weddingId) return [];
      const { data, error } = await supabase.from('banners').select('*').eq('hall_id', hallId).eq('wedding_id', weddingId).order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!weddingId,
  });

  const { data: moments } = useQuery({
    queryKey: ['archive-moments', weddingId],
    queryFn: async () => {
      if (!weddingId) return [];
      const { data, error } = await supabase.from('wedding_moments').select('*').eq('hall_id', hallId).eq('wedding_id', weddingId).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!weddingId,
  });

  const { data: rsvps } = useQuery({
    queryKey: ['archive-rsvps', weddingId],
    queryFn: async () => {
      if (!weddingId) return [];
      const { data, error } = await supabase.from('rsvps').select('*').eq('hall_id', hallId).eq('wedding_id', weddingId).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!weddingId,
  });

  const { data: hall } = useQuery({
    queryKey: ['archive-hall', hallId],
    queryFn: async () => {
      if (!hallId) return null;
      const { data, error } = await supabase.from('wedding_halls').select('name').eq('id', hallId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });

  if (isLoading) {
    return <div className="grid place-items-center py-20 text-[13px] text-neutral-500">{t('admin.archive.loading')}</div>;
  }

  if (!wedding) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
        <h3 className="text-lg font-medium">{t('admin.archive.notFoundTitle')}</h3>
        <p className="mt-1 text-[13px] text-neutral-500">{t('admin.archive.notFoundDesc')}</p>
        <Link to={`/${locale}/admin/archive`} className="mt-4 inline-block text-[13px] text-[#3a4530] underline">
          {t('admin.archive.backToArchive')}
        </Link>
      </div>
    );
  }

  const names = `${wedding.groom_name || ''} & ${wedding.bride_name || ''}`.trim()
    || (brideGroom ? `${brideGroom.groom_name} & ${brideGroom.bride_name}` : t('admin.archive.weddingFallback'));

  const cover = brideGroom?.groom_photo || brideGroom?.bride_photo || wedding.cover_image;

  const handleZip = async () => {
    setBusy(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      await downloadWeddingArchive(wedding.id, url, session?.session?.access_token ?? '');
      toast.success(t('admin.archive.zipReady'));
    } catch (err) {
      toast.error((err as Error).message || t('admin.archive.zipError'));
    } finally {
      setBusy(false);
    }
  };

  const totalGuests = (rsvps ?? []).reduce((acc, r) => acc + ((r as { guests_count?: number }).guests_count ?? 1), 0);

  // QR hint may contain a {link} placeholder that we render as a real router Link.
  const qrHint = t('admin.archive.qrHint');
  const [qrBefore, qrAfter] = qrHint.split('{link}');

  return (
    <div className="mx-auto max-w-[960px] space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(`/${locale}/admin/archive`)}
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-[13px] text-neutral-700 hover:bg-neutral-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t('admin.archive.backToArchive')}
        </button>
        <Button
          onClick={handleZip}
          disabled={busy}
          className="gap-2 bg-[#3a4530] text-white hover:bg-[#2a3422]"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {t('admin.archive.zipBtn')}
        </Button>
      </div>

      {/* Hero strip */}
      <div className="grid grid-cols-1 gap-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-[160px_1fr] md:p-6">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
          {safeImg(cover, names) ?? (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#3a4530] to-[#1f2618] text-[12px] uppercase tracking-wider text-[#d4b677]">{t('admin.archive.coverAlt')}</div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#3a4530]/10 px-2.5 py-1 text-[11px] font-medium text-[#3a4530]" style={{ background: 'rgba(58,69,48,0.10)' }}>
            <CheckCircle2 className="h-3.5 w-3.5" /> {t('admin.archive.completedBadge')}
          </div>
          <h1
            className="font-display text-[34px] leading-tight text-neutral-900 md:text-[42px]"
            style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif', fontWeight: 500 }}
          >
            {names}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-[14px] text-neutral-500">
            <CalendarDays className="h-4 w-4" />
            <span>{formatDate(locale, wedding.wedding_date)}</span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-[13px] text-neutral-600 md:grid-cols-4">
            <Stat label={t('admin.archive.statGuests')} value={`${totalGuests}`} />
            <Stat label={t('admin.archive.statRsvp')} value={`${(rsvps ?? []).length}`} />
            <Stat label={t('admin.archive.statPhotos')} value={`${(moments ?? []).length}`} />
            <Stat label={t('admin.archive.statScans')} value={`${wedding.qr_scan_count ?? 0}`} />
          </dl>
        </div>
      </div>

      {/* Section nav */}
      <nav className="sticky top-[68px] z-10 -mx-4 flex gap-1 overflow-x-auto border-y border-neutral-200/70 bg-[#f9f6ee]/95 px-4 py-2 backdrop-blur md:mx-0 md:rounded-xl md:border md:px-3">
        {SECTION_IDS.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-[12.5px] text-neutral-700 hover:bg-white"
          >
            {t(`admin.archive.sections.${id}`)}
          </a>
        ))}
      </nav>

      <section id="info" className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={Heart}>{t('admin.archive.sections.info')}</SectionTitle>
        <dl className="grid grid-cols-1 gap-3 text-[13.5px] sm:grid-cols-2">
          <Pair label={t('admin.archive.pairBride')} value={brideGroom?.bride_name || wedding.bride_name || '—'} />
          <Pair label={t('admin.archive.pairGroom')} value={brideGroom?.groom_name || wedding.groom_name || '—'} />
          <Pair label={t('admin.archive.pairWeddingDate')} value={formatDate(locale, wedding.wedding_date)} />
          <Pair label={t('admin.archive.pairArchived')} value={formatDate(locale, wedding.archived_at || wedding.updated_at)} />
          <Pair label={t('admin.archive.pairHall')} value={hall?.name || t('admin.sidebar.brand')} />
          <Pair label={t('admin.archive.pairArchiveType')} value={t('admin.archive.completedBadge')} />
        </dl>
        {brideGroom?.love_story && (
          <p className="mt-4 rounded-lg bg-neutral-50 p-4 text-[14px] italic text-neutral-700">
            &ldquo;{brideGroom.love_story}&rdquo;
          </p>
        )}
      </section>

      <section id="program" className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={Camera}>{t('admin.archive.sections.program')}</SectionTitle>
        {(!timeline || timeline.length === 0) && <Empty>{t('admin.archive.empty.program')}</Empty>}
        <ol className="space-y-3">
          {timeline?.map((tm) => (
            <li key={tm.id} className="flex gap-3 rounded-lg border border-neutral-100 bg-white px-3 py-2.5">
              <div className="w-16 shrink-0 text-[12px] font-medium text-[#3a4530]">{tm.start_time ?? ''}</div>
              <div>
                <p className="text-[14px] font-medium text-neutral-900">{tm.title}</p>
                {tm.description && (
                  <p className="mt-0.5 text-[12.5px] text-neutral-500">{tm.description}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="menu" className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={UtensilsCrossed}>{t('admin.archive.sections.menu')}</SectionTitle>
        {(!foods || foods.length === 0) && <Empty>{t('admin.archive.empty.menu')}</Empty>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {foods?.map((f) => (
            <div key={f.id} className="overflow-hidden rounded-lg border border-neutral-100">
              <div className="relative aspect-[4/3] bg-neutral-100">
                {safeImg(f.image_url ?? null, f.name ?? 'food') ?? (
                  <div className="absolute inset-0 grid place-items-center text-neutral-300">
                    <UtensilsCrossed className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="truncate text-[13px] font-medium">{f.name}</p>
                {f.price != null && (
                  <p className="mt-0.5 text-[12px] text-neutral-500">{f.price} som</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="artists" className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={Music2}>{t('admin.archive.sections.artists')}</SectionTitle>
        {(!artists || artists.length === 0) && <Empty>{t('admin.archive.empty.artists')}</Empty>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {artists?.map((a) => (
            <div key={a.id} className="rounded-lg border border-neutral-100 p-3">
              <p className="truncate text-[13.5px] font-medium">{a.name}</p>
              {a.performance_time && (
                <p className="mt-0.5 text-[12px] text-neutral-500">{a.performance_time}</p>
              )}
              {a.description && (
                <p className="mt-2 text-[12.5px] text-neutral-600">{a.description}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="couple" className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={Heart}>{t('admin.archive.sections.couple')}</SectionTitle>
        {brideGroom ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PairTile label={t('admin.archive.pairBride')} name={brideGroom.bride_name} image={brideGroom.bride_photo} />
            <PairTile label={t('admin.archive.pairGroom')} name={brideGroom.groom_name} image={brideGroom.groom_photo} />
          </div>
        ) : (
          <Empty>{t('admin.archive.empty.couple')}</Empty>
        )}
      </section>

      <section id="qr" className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={QrCode}>{t('admin.archive.sections.qr')}</SectionTitle>
        <p className="mb-3 text-[13px] text-neutral-500">
          {qrBefore}<Link to={`/${locale}/admin/qr`} className="text-[#3a4530] underline">{t('admin.archive.qrLinkText')}</Link>{qrAfter}
        </p>
        <div className="rounded-lg bg-neutral-50 px-4 py-3 text-[12.5px] text-neutral-500">
          {t('admin.archive.qrId', { id: wedding.id.slice(0, 8) })}
        </div>
      </section>

      <section id="rsvp" className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={ClipboardList}>{t('admin.archive.sections.rsvp')}</SectionTitle>
        {(!rsvps || rsvps.length === 0) && <Empty>{t('admin.archive.empty.rsvp')}</Empty>}
        <div className="space-y-2">
          {rsvps?.map((r) => (
            <div key={r.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-neutral-100 px-3 py-2.5 text-[13px]">
              <div>
                <p className="font-medium text-neutral-800">{r.guest_name}</p>
                <p className="text-[12px] text-neutral-500">
                  {r.attending ? t('admin.archive.rsvpAttending') : t('admin.archive.rsvpNotAttending')} · {r.guests_count} {t('admin.archive.rsvpGuestUnit')}
                  {r.table_number ? ` · ${t('admin.archive.rsvpTable')}: ${r.table_number}` : ''}
                </p>
              </div>
              <span className="text-[12px] text-neutral-400">{formatDate(locale, r.created_at)}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="gallery" className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={ImageIcon}>{t('admin.archive.sections.gallery')}</SectionTitle>
        {(!banners || banners.length === 0) && <Empty>{t('admin.archive.empty.gallery')}</Empty>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {banners?.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-lg border border-neutral-100">
              <div className="aspect-video bg-neutral-100">
                {safeImg(b.image_url, b.title ?? 'banner') ?? (
                  <div className="grid h-full place-items-center text-neutral-300">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                )}
              </div>
              {b.title && (
                <p className="px-3 py-2 text-[12.5px] font-medium">{b.title}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="moments" className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <SectionTitle icon={Camera}>{t('admin.archive.sections.moments')}</SectionTitle>
        {(!moments || moments.length === 0) && <Empty>{t('admin.archive.empty.moments')}</Empty>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {moments?.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-lg border border-neutral-100">
              <div className="aspect-square bg-neutral-100">
                {safeImg(m.image_url, 'moment') ?? (
                  <div className="grid h-full place-items-center text-neutral-300">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-[12px] font-medium">{m.guest_name || t('admin.archive.anonGuest')}</p>
                <p className="text-[11px] text-neutral-500">
                  {m.table_number ? `${t('admin.archive.rsvpTable')} ${m.table_number} · ` : ''}
                  {formatDate(locale, m.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="text-center text-[11px] text-neutral-400">
        {t('admin.archive.footer')} {formatDate(locale, todayInTashkent())}
      </div>
    </div>
  );
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon: typeof Heart }) {
  return (
    <h3 className="mb-3 inline-flex items-center gap-2 font-display text-[18px] text-neutral-900" style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif', fontWeight: 500 }}>
      <Icon className="h-4 w-4 text-[#3a4530]" />
      {children}
    </h3>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-neutral-50 px-4 py-6 text-center text-[13px] text-neutral-500">{children}</p>;
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] uppercase tracking-[0.16em] text-neutral-400">{label}</dt>
      <dd className="mt-0.5 text-[14px] text-neutral-900">{value}</dd>
    </div>
  );
}

function PairTile({ label, name, image }: { label: string; name: string; image?: string | null }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-100">
      <div className="aspect-[4/3] bg-neutral-100">
        {safeImg(image ?? null, name) ?? (
          <div className="grid h-full place-items-center text-[12px] uppercase tracking-wider text-neutral-300">{label}</div>
        )}
      </div>
      <p className="px-3 py-2 text-[13px] font-medium">{name}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-medium text-neutral-900">{value}</dd>
    </div>
  );
}
