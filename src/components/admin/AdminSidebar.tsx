/**
 * Vowly Admin Sidebar
 * -------------------
 * 1:1 with the reference. Two grouped nav blocks:
 *   BUGUNGI TO'Y — the active wedding's management screens.
 *   ARXIV        — the archived weddings list.
 *
 * Mobile: collapses into a drawer toggled from the topbar. State is local;
 * the dashboard owns `open` and passes it + onClose through.
 */
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Image, Clock, UtensilsCrossed, Music2, Heart, QrCode, Camera, ClipboardList, Music, ChevronDown, Archive, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';

interface NavItem {
  to: string;
  icon: typeof Home;
}

const CURRENT_ITEMS: NavItem[] = [
  { to: 'bosh-sahifa', icon: Home },
  { to: 'bannerlar', icon: Image },
  { to: 'dastur', icon: Clock },
  { to: 'taomlar', icon: UtensilsCrossed },
  { to: 'artistlar', icon: Music2 },
  { to: 'kelin-kuyov', icon: Heart },
  { to: 'qr', icon: QrCode },
  { to: 'suratlari', icon: Camera },
  { to: 'rsvp', icon: ClipboardList },
  { to: 'musiqa', icon: Music },
];

const ARCHIVE_ITEMS: NavItem[] = [
  { to: 'archive', icon: Archive },
];

interface Props {
  hallName: string;
  hallLogo?: string | null;
  onNavigate?: () => void;
}

function buildPath(base: string, suffix: string) {
  // base already includes the locale prefix (e.g. /uz/admin)
  if (!suffix || suffix === 'bosh-sahifa') return base;
  return `${base}/${suffix}`;
}

export default function AdminSidebar({ hallName, hallLogo, onNavigate }: Props) {
  const { t } = useTranslation();
  const location = useLocation();

  // figure out which suffix (after /<locale>/admin) is active, default `bosh-sahifa`
  const pathParts = location.pathname.split('/').filter(Boolean);
  const suffix = pathParts[2] ?? 'bosh-sahifa';
  const adminBase = `/${pathParts[0]}/admin`;

  const renderItem = (it: NavItem) => {
    const target = buildPath(adminBase, it.to);
    const active = suffix === it.to;
    const Icon = it.icon;
    return (
      <Link
        key={it.to}
        to={target}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] transition',
          active
            ? 'bg-[#3a4530] text-white shadow-sm'
            : 'text-neutral-700 hover:bg-neutral-100',
        )}
      >
        <Icon className={cn('h-[18px] w-[18px]', active ? 'text-white' : 'text-neutral-500')} />
        <span className="truncate">{t(`admin.nav.${it.to}`)}</span>
      </Link>
    );
  };

  return (
    <aside className="flex h-full w-full flex-col bg-[#f5f1e8] text-neutral-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-7 pb-8">
        <img src="/logo.png" alt="Vowly" className="h-9 w-9 rounded-full object-contain" />
        <span className="font-display text-[26px] tracking-tight text-neutral-900" style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif', fontWeight: 500 }}>
          Vowly
        </span>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div>
          <h3 className="px-2 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            {t('admin.nav.current')}
          </h3>
          <nav className="flex flex-col gap-0.5">{CURRENT_ITEMS.map(renderItem)}</nav>
        </div>

        <div className="mt-6">
          <h3 className="px-2 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            {t('admin.nav.archiveTitle')}
          </h3>
          <nav className="flex flex-col gap-0.5">{ARCHIVE_ITEMS.map(renderItem)}</nav>
        </div>
      </div>

      {/* Bottom: support contact + venue card */}
      <div className="space-y-2 border-t border-neutral-200/70 p-3">
        <a
          href="tel:+998777630216"
          className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-sm transition hover:shadow"
        >
          <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#3a4530]/10 text-[#3a4530]">
            <Phone className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[10.5px] font-medium uppercase tracking-wider text-neutral-500">{t('admin.sidebar.help')}</p>
            <p className="text-[13px] font-semibold text-neutral-800">{t('admin.sidebar.phone')}</p>
          </div>
        </a>
        <Link
          to={`${adminBase}/bosh-sahifa`}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm transition hover:shadow"
        >
          {hallLogo ? (
            <img src={hallLogo} alt={hallName} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#3a4530] text-[12px] font-semibold uppercase text-[#e6c98a]">
              {(hallName || t('admin.sidebar.brand')).slice(0, 2)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-tight">{hallName || t('admin.sidebar.brand')}</p>
            <p className="truncate text-[11px] text-neutral-500">{t('admin.sidebar.brand')}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </Link>
      </div>
    </aside>
  );
}
