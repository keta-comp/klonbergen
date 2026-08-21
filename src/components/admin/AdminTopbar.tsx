/**
 * Vowly Admin Topbar
 * ------------------
 * Header shown above the right-pane content. From the reference:
 *   - Greeting left: "Xush kelibsiz, <name>!" + subtitle.
 *   - Greeting right: notification bell with dropdown + avatar block with name/role.
 *   - Mobile: hamburger on the left opens the sidebar drawer.
 * Every string is localized; a UZ/RU/EN/KA language switcher is included.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, Menu, ChevronDown, LogOut, Settings, Image as ImageIcon, UserCheck, X, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveWedding } from '@/hooks/useWeddings';
import { useRsvps, useWeddingMoments } from '@/hooks/useWeddingMoments';
import { useMutateHall } from '@/hooks/useHallData';
import { useTranslation } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { toast } from 'sonner';

interface Props {
  hallId?: string | null;
  userName: string;
  userEmail?: string | null;
  avatarUrl?: string | null;
  onOpenSidebar: () => void;
  onSignOut: () => void;
}

type NotifItem = {
  key: string;
  icon: 'rsvp' | 'moment';
  title: string;
  sub: string;
  time: string;
};

function timeAgo(
  iso: string | undefined,
  t: (k: string, p?: Record<string, string | number>) => string,
): string {
  if (!iso) return '';
  const ms = new Date(iso).getTime();
  if (isNaN(ms)) return '';
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('admin.notif.justNow');
  if (m < 60) return t('admin.notif.minutesAgo', { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('admin.notif.hoursAgo', { n: h });
  const d = Math.floor(h / 24);
  return t('admin.notif.daysAgo', { n: d });
}

export default function AdminTopbar({ hallId, userName, userEmail, avatarUrl, onOpenSidebar, onSignOut }: Props) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Live data for the notifications dropdown
  const { data: active } = useActiveWedding(hallId ?? null);
  const { data: rsvps } = useRsvps(hallId ?? undefined, active?.id ?? null);
  const { data: moments } = useWeddingMoments(hallId ?? undefined);

  const notifications = useMemo<NotifItem[]>(() => {
    const items: NotifItem[] = [];
    (rsvps ?? []).slice(0, 4).forEach((r: { id: string; guest_name?: string | null; guests_count?: number | null; attending?: boolean | null; created_at?: string }) => {
      items.push({
        key: `rsvp-${r.id}`,
        icon: 'rsvp',
        title: t('admin.notif.rsvpTitle', { name: r.guest_name || t('admin.notif.guest') }),
        sub: `${r.guests_count ?? 1} · ${r.attending ? t('admin.notif.attending') : t('admin.notif.notAttending')}`,
        time: r.created_at ?? '',
      });
    });
    (moments ?? []).slice(0, 4).forEach((m: { id: string; guest_name?: string | null; created_at?: string }) => {
      items.push({
        key: `mom-${m.id}`,
        icon: 'moment',
        title: t('admin.notif.newPhoto'),
        sub: m.guest_name || t('admin.notif.guest'),
        time: m.created_at ?? '',
      });
    });
    return items
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
  }, [rsvps, moments, t]);

  const unread = notifications.length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
      if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // for the welcome line — take everything before the first space as the first name
  const firstName = userName?.includes(' ') ? userName.split(' ')[0] : userName || 'Admin';

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-neutral-200/60 bg-[#f9f6ee]/90 px-3 py-2.5 backdrop-blur sm:gap-3 sm:px-5 sm:py-3 md:px-8 md:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label={t('admin.topbar.menuOpen')}
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-700 transition-colors hover:border-neutral-300 md:hidden"
            onClick={onOpenSidebar}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="line-clamp-2 break-words font-display text-[16px] leading-tight text-neutral-900 sm:text-[20px] md:text-[26px]" style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif', fontWeight: 500 }}>
              {t('admin.topbar.welcome', { name: firstName })}
            </h1>
            <p className="mt-0.5 hidden text-[12px] text-neutral-500 sm:block md:text-[13px]">
              {t('admin.topbar.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {/* notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-label={t('admin.topbar.notifications')}
              className="relative grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors hover:border-neutral-300 sm:h-9 sm:w-9"
              onClick={() => setNotifOpen((o) => !o)}
            >
              <Bell className="h-[16px] w-[16px]" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#3a4530] px-1 text-[10px] font-semibold leading-none text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 max-h-[75vh] w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                  <p className="text-[13px] font-semibold text-neutral-800">{t('admin.topbar.notifications')}</p>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                    {t('admin.topbar.unread', { count: unread })}
                  </span>
                </div>

                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[12.5px] text-neutral-400">
                    {t('admin.topbar.empty')}
                  </p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <li key={n.key}>
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                          onClick={() => {
                            setNotifOpen(false);
                            if (n.icon === 'rsvp') navigate(`/${location.pathname.split('/')[1]}/admin/rsvp${location.search}`);
                            else navigate(`/${location.pathname.split('/')[1]}/admin/suratlari${location.search}`);
                          }}
                        >
                          <span className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-[#3a4530]/10 text-[#3a4530]">
                            {n.icon === 'rsvp' ? <UserCheck className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-neutral-800">{n.title}</span>
                            <span className="block truncate text-[11.5px] text-neutral-500">{n.sub}</span>
                          </span>
                          <span className="flex items-center gap-1 text-[10.5px] text-neutral-400">
                            <Clock className="h-3 w-3" />
                            {timeAgo(n.time, t)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* user block */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="flex h-10 flex-shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-white py-1 pl-1.5 pr-2.5 transition-colors hover:border-neutral-300 sm:h-9"
              onClick={() => setMenuOpen((o) => !o)}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="h-8 w-8 rounded-full object-cover sm:h-7 sm:w-7" />
              ) : (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-200 text-[11px] font-semibold uppercase text-neutral-700 sm:h-7 sm:w-7">
                  {(userName || 'AD').slice(0, 2)}
                </span>
              )}
              <div className="hidden text-left leading-tight md:block">
                <p className="text-[12.5px] font-medium">{userName || 'Admin'}</p>
                <p className="text-[10.5px] text-neutral-500">Admin</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-xl">
                <div className="border-b border-neutral-100 px-3 py-2 text-[11px] text-neutral-500">
                  <p className="truncate font-medium text-neutral-800">{userName || 'Admin'}</p>
                  <p className="truncate">{userEmail}</p>
                </div>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
                  onClick={() => {
                    setMenuOpen(false);
                    setSettingsOpen(true);
                  }}
                >
                  <Settings className="h-4 w-4" /> {t('admin.settings.title')}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
                  onClick={() => {
                    setMenuOpen(false);
                    // jump to admin home (locale-aware)
                    const segs = location.pathname.split('/').filter(Boolean);
                    navigate(`/${segs[0]}/admin/bosh-sahifa${location.search}`);
                  }}
                >
                  {t('admin.topbar.home')}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                >
                  <LogOut className="h-4 w-4" /> {t('admin.topbar.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {settingsOpen && hallId && (
        <SettingsModal hallId={hallId} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}

function SettingsModal({ hallId, onClose }: { hallId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: hall } = useQuery({
    queryKey: ['hall', hallId],
    queryFn: async () => {
      const { data, error } = await supabase.from('wedding_halls').select('*').eq('id', hallId).single();
      if (error) throw error;
      return data as { name?: string; address?: string | null; phone?: string | null };
    },
    enabled: !!hallId,
  });

  const { update } = useMutateHall();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hall) {
      setName(hall.name ?? '');
      setAddress(hall.address ?? '');
      setPhone(hall.phone ?? '');
    }
  }, [hall]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('admin.settings.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      await update.mutateAsync({ id: hallId, name: name.trim(), address: address.trim() || null, phone: phone.trim() || null });
      toast.success(t('admin.settings.saved'));
      onClose();
    } catch {
      toast.error(t('admin.settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:max-w-md sm:rounded-2xl sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 flex-shrink-0 rounded-full bg-neutral-300 sm:hidden" />
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-neutral-900">{t('admin.settings.title')}</h2>
          <button
            type="button"
            aria-label={t('admin.settings.close')}
            className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label className="mb-1 block text-[12.5px] font-medium text-neutral-700">{t('admin.settings.hallName')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-[13.5px] outline-none focus:border-[#3a4530]"
              placeholder={t('admin.settings.hallNamePh')}
            />
          </div>
          <div>
            <label className="mb-1 block text-[12.5px] font-medium text-neutral-700">{t('admin.settings.address')}</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-[13.5px] outline-none focus:border-[#3a4530]"
              placeholder={t('admin.settings.addressPh')}
            />
          </div>
          <div>
            <label className="mb-1 block text-[12.5px] font-medium text-neutral-700">{t('admin.settings.phone')}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-[13.5px] outline-none focus:border-[#3a4530]"
              placeholder={t('admin.settings.phonePh')}
            />
          </div>
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-neutral-100 px-5 py-4">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100"
            onClick={onClose}
          >
            {t('admin.settings.cancel')}
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#3a4530] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#2f3827] disabled:opacity-60"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t('admin.settings.saving') : t('admin.settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
