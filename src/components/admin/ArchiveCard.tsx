/**
 * Vowly ArchiveCard
 * -----------------
 * One row in the archive list. From the reference:
 *   - cover image on the left (~128x128)
 *   - middle: names + green "Arxivlangan" pill + date + stats row
 *   - right: "Arxivni ko'rish" + dark "ZIP yuklab olish" buttons + "..." menu
 */
import { useState } from 'react';
import { CalendarDays, Eye, Download, MoreVertical, Users, Image as ImgIcon, ScanLine, Loader2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';
import { formatDate } from '@/i18n/format';
import { supabase } from '@/integrations/supabase/client';
import { downloadWeddingArchive } from '@/hooks/useWeddings';
import type { Wedding } from '@/hooks/useWeddings';
import type { Locale } from '@/i18n/config';

interface Props { wedding: Wedding; }

function safeImg(src: string | null | undefined, alt: string) {
  if (!src) return null;
  if (!/^https?:\/\//i.test(src)) return null;
  return <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />;
}

export default function ArchiveCard({ wedding }: Props) {
  const { t } = useTranslation();
  const { locale: rawLocale } = useParams();
  const locale = (rawLocale ?? 'uz') as Locale;
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const names = `${wedding.groom_name || ''} & ${wedding.bride_name || ''}`.trim() || t('admin.archive.weddingFallback');

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

  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md md:grid-cols-[140px_1fr_auto] md:items-center md:gap-5 md:p-5">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
        {safeImg(wedding.cover_image, names) ?? (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#3a4530] to-[#1f2618] text-[12px] uppercase tracking-wider text-[#d4b677]">{t('admin.archive.coverAlt')}</div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className="font-display text-[20px] leading-tight text-neutral-900 md:text-[22px]"
            style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif', fontWeight: 500 }}
          >
            {names}
          </h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3a4530]/8 px-2.5 py-1 text-[11px] font-medium text-[#3a4530]" style={{ background: 'rgba(58,69,48,0.10)' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#3a4530]" />
            {t('admin.archive.status')}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-neutral-500">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{formatDate(locale, wedding.wedding_date)}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-neutral-600">
          <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-neutral-400" />{wedding.rsvp_count} {t('admin.archive.guestUnit')}</span>
          <span className="inline-flex items-center gap-1.5"><ImgIcon className="h-3.5 w-3.5 text-neutral-400" />{wedding.uploaded_photo_count} {t('admin.archive.photoUnit')}</span>
          <span className="inline-flex items-center gap-1.5"><ScanLine className="h-3.5 w-3.5 text-neutral-400" />{wedding.qr_scan_count} {t('admin.archive.scanUnit')}</span>
        </div>
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-1 md:justify-end md:flex-nowrap">
        <Link to={`/${locale}/admin/archive/${wedding.id}`}>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3.5 py-2 text-[13px] text-neutral-800 transition hover:bg-neutral-50"
          >
            <Eye className="h-4 w-4" /> {t('admin.archive.viewBtn')}
          </button>
        </Link>
        <button
          type="button"
          onClick={handleZip}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-[#3a4530] px-3.5 py-2 text-[13px] text-white transition hover:bg-[#2a3422] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {t('admin.archive.zipBtn')}
        </button>
        <div className="relative">
          <button
            type="button"
            aria-label={t('admin.archive.more')}
            onClick={() => setMenuOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/${locale}/admin/archive/${wedding.id}`);
                }}
              >
                {t('admin.archive.openDetails')}
              </button>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
                onClick={() => {
                  setMenuOpen(false);
                  handleZip();
                }}
              >
                {t('admin.archive.rezip')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
