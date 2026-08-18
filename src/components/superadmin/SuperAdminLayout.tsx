/**
 * Super Admin — full layout (sidebar + header + content + right column)
 * -----------------------------------------------------------------------
 * Premium SaaS layout matching the reference. All text is localized.
 * On desktop: fixed left sidebar, main area with header, content, and a
 * persistent right column for notifications + recent activity.
 * On mobile: sidebar collapses to a left drawer toggled by the header.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { useTranslation } from '@/i18n/LanguageContext';
import {
  Home,
  Building2,
  Users,
  Heart,
  Receipt,
  BarChart3,
  Settings as SettingsIcon,
  Bell,
  Activity,
  Menu,
  X,
  LogOut,
  Search,
  Check,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminNotifications, useUnreadNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useActivityLogs, useSyncSubscriptionNotifications } from '@/hooks/useAdminData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { formatDate } from '@/i18n/format';

export type SectionId =
  | 'bosh_sahifa'
  | 'toyxonalar'
  | 'adminlar'
  | 'toylar'
  | 'tolovlar'
  | 'hisobotlar'
  | 'sozlamalar'
  | 'bildirishnomalar'
  | 'activity';

interface LayoutProps {
  active: SectionId;
  onChange: (id: SectionId) => void;
  children: React.ReactNode;
}

const NAV: { section: string; items: { id: SectionId; icon: React.ElementType; labelKey: string }[] }[] = [
  {
    section: 'platform',
    items: [
      { id: 'bosh_sahifa', icon: Home, labelKey: 'superadmin.nav.bosh_sahifa' },
      { id: 'toyxonalar', icon: Building2, labelKey: 'superadmin.nav.toyxonalar' },
      { id: 'adminlar', icon: Users, labelKey: 'superadmin.nav.adminlar' },
      { id: 'toylar', icon: Heart, labelKey: 'superadmin.nav.toylar' },
    ],
  },
  {
    section: 'billing',
    items: [
      { id: 'tolovlar', icon: Receipt, labelKey: 'superadmin.nav.tolovlar' },
    ],
  },
  {
    section: 'system',
    items: [
      { id: 'hisobotlar', icon: BarChart3, labelKey: 'superadmin.nav.hisobotlar' },
      { id: 'sozlamalar', icon: SettingsIcon, labelKey: 'superadmin.nav.sozlamalar' },
      { id: 'bildirishnomalar', icon: Bell, labelKey: 'superadmin.nav.bildirishnomalar' },
      { id: 'activity', icon: Activity, labelKey: 'superadmin.nav.activity' },
    ],
  },
];

const VOWLY_LOGO = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f490.svg';

export default function SuperAdminLayout({ active, onChange, children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Sync auto-notifications on mount (idempotent RPC).
  const syncNotifs = useSyncSubscriptionNotifications();
  useEffect(() => {
    syncNotifs.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: notifications } = useAdminNotifications(10);
  const { data: unread = 0 } = useUnreadNotifications();
  const { data: activities } = useActivityLogs(8);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const userName = useMemo(() => {
    return (
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'Admin'
    );
  }, [user]);

  const firstName = userName.includes(' ') ? userName.split(' ')[0] : userName;

  // close popovers on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // auto-close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [active]);

  const renderSidebar = (onItemClick?: () => void) => (
    <div className="flex h-full flex-col">
      {/* Logo block */}
      <div className="flex items-center gap-3 border-b border-neutral-200/60 px-5 py-5">
        <img
          src="/logo.png"
          alt="Vowly"
          className="h-10 w-10 flex-shrink-0 rounded-xl object-contain"
        />
        <div className="leading-tight">
          <p className="font-display text-[20px] font-semibold text-neutral-900" style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif', fontWeight: 500 }}>
            Vowly
          </p>
          <p className="text-[10.5px] uppercase tracking-wider text-[#9a7b3f]">Super Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.section} className="mb-5">
            <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400">
              {t(`superadmin.nav.${group.section}`)}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((it) => {
                const isActive = it.id === active;
                const Icon = it.icon;
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(it.id);
                        onItemClick?.();
                      }}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors',
                        isActive
                          ? 'bg-[#3a4530] text-white shadow-sm'
                          : 'text-neutral-700 hover:bg-neutral-100/80',
                      )}
                    >
                      <Icon className={cn('h-[17px] w-[17px]', isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-700')} />
                      <span className="font-medium">{t(it.labelKey)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9f6ee] text-neutral-800">
      <div className="mx-auto flex min-h-screen max-w-[1480px]">
        {/* Desktop sidebar */}
        <aside className="hidden w-[252px] flex-shrink-0 border-r border-neutral-200/60 bg-white md:block">
          {renderSidebar()}
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-40 bg-black md:hidden"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.22 }}
                className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-xl md:hidden"
              >
                <button
                  type="button"
                  aria-label={t('common.close')}
                  onClick={() => setDrawerOpen(false)}
                  className="absolute right-3 top-3.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-700"
                >
                  <X className="h-4 w-4" />
                </button>
                {renderSidebar(() => setDrawerOpen(false))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-neutral-200/60 bg-[#f9f6ee]/90 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label={t('common.openMenu')}
                onClick={() => setDrawerOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-md border border-neutral-200 bg-white text-neutral-700 md:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <h1
                  className="font-display text-[22px] leading-tight text-neutral-900 md:text-[26px]"
                  style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif', fontWeight: 500 }}
                >
                  {t('superadmin.welcomeHand', { name: firstName })}
                </h1>
                <p className="mt-0.5 text-[12.5px] text-neutral-500 md:text-[13px]">
                  {t('superadmin.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-3">
              <LanguageSwitcher />
              {/* Notifications bell */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  aria-label={t('superadmin.notifications.title')}
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative grid h-9 w-9 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                >
                  <Bell className="h-[16px] w-[16px]" />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#3a4530] px-1 text-[10px] font-semibold leading-none text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full z-40 mt-2 max-h-[75vh] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-xl">
                    <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                      <p className="text-[13px] font-semibold text-neutral-800">
                        {t('superadmin.notifications.title')}
                      </p>
                      {unread > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllRead.mutate()}
                          className="text-[11.5px] text-[#3a4530] hover:underline"
                        >
                          <Check className="mr-1 inline h-3 w-3" />
                          {t('superadmin.markAll')}
                        </button>
                      )}
                    </div>
                    {(notifications ?? []).length === 0 ? (
                      <p className="px-4 py-6 text-center text-[12.5px] text-neutral-400">
                        {t('superadmin.notifications.empty')}
                      </p>
                    ) : (
                      <ul className="max-h-80 overflow-y-auto">
                        {(notifications ?? []).map((n) => (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => {
                                if (!n.read_at) markRead.mutate(n.id);
                                if (n.link) onChange('toyxonalar');
                                setNotifOpen(false);
                              }}
                              className={cn(
                                'flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-neutral-50',
                                !n.read_at && 'bg-[#3a4530]/5',
                              )}
                            >
                              <span className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', n.read_at ? 'bg-neutral-300' : 'bg-[#3a4530]')} />
                              <span className="min-w-0 flex-1">
                                <span className="block text-[12.5px] font-semibold text-neutral-800">
                                  {n.title}
                                </span>
                                <span className="block text-[11.5px] text-neutral-500">{n.message}</span>
                                <span className="mt-0.5 block text-[10.5px] text-neutral-400">
                                  {formatDate(locale, n.created_at)}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1.5 pl-1.5 pr-3 hover:border-neutral-300"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#3a4530] text-[11px] font-semibold uppercase text-white">
                    {(userName || 'AD').slice(0, 2)}
                  </span>
                  <div className="hidden text-left leading-tight md:block">
                    <p className="text-[12.5px] font-medium">{userName}</p>
                    <p className="text-[10.5px] text-neutral-500">Super Admin</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-xl">
                    <div className="border-b border-neutral-100 px-3 py-2 text-[11px] text-neutral-500">
                      <p className="truncate font-medium text-neutral-800">{userName}</p>
                      <p className="truncate">{user?.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setUserOpen(false);
                        await signOut();
                        window.location.href = '/';
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-neutral-700 hover:bg-neutral-50"
                    >
                      <LogOut className="h-4 w-4" /> {t('superadmin.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Body grid: main + right column */}
          <div className="flex min-h-0 flex-1 flex-col gap-5 px-4 py-5 md:px-8 md:py-6 lg:flex-row">
            <main className="min-w-0 flex-1">{children}</main>

            {/* Right column — ~30% on desktop, full width (stacked below) on mobile */}
            <aside className="w-full flex-shrink-0 space-y-4 lg:w-[30%] lg:max-w-[360px]">
              {/* Notifications card */}
              <div className="rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[14px] font-semibold text-neutral-900">
                    {t('superadmin.notifications.title')}
                    {unread > 0 && (
                      <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#3a4530]/10 px-1.5 text-[10.5px] font-semibold text-[#3a4530]">
                        {unread}
                      </span>
                    )}
                  </h3>
                </div>
                {(notifications ?? []).length === 0 ? (
                  <p className="py-3 text-[12.5px] text-neutral-400">{t('superadmin.notifications.empty')}</p>
                ) : (
                  <ul className="space-y-3">
                    {(notifications ?? []).slice(0, 5).map((n) => (
                      <li key={n.id} className="flex items-start gap-3">
                        <span className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', n.read_at ? 'bg-neutral-300' : 'bg-[#3a4530]')} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] font-semibold text-neutral-800">{n.title}</p>
                          <p className="text-[11.5px] text-neutral-500">{n.message}</p>
                          <p className="mt-0.5 text-[10.5px] text-neutral-400">
                            {formatDate(locale, n.created_at)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => onChange('bildirishnomalar')}
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[#3a4530] hover:underline"
                >
                  {t('superadmin.notifications.view_all')} →
                </button>
              </div>

              {/* Activity card */}
              <div className="rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">
                  {t('superadmin.activity.title')}
                </h3>
                {(activities ?? []).length === 0 ? (
                  <p className="py-3 text-[12.5px] text-neutral-400">{t('superadmin.activity.empty')}</p>
                ) : (
                  <ul className="space-y-2.5">
                    {(activities ?? []).slice(0, 6).map((a) => (
                      <li key={a.id} className="flex items-start gap-2.5 text-[12px] leading-snug text-neutral-600">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-neutral-400" />
                        <span className="min-w-0 flex-1">
                          <span className="text-neutral-700">{a.description}</span>
                          <span className="ml-1 text-[10.5px] text-neutral-400">
                            {formatDate(locale, a.created_at)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => onChange('activity')}
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-[#3a4530] hover:underline"
                >
                  {t('superadmin.activity.view_all')} →
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
