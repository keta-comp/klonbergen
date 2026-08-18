/**
 * Vowly Admin Dashboard
 * ---------------------
 * 1:1 with the design reference. Layout:
 *
 *   ┌──────────────────────┬────────────────────────────────────────────┐
 *   │ AdminSidebar         │ AdminTopbar (greeting + notif + user)      │
 *   │                      ├────────────────────────────────────────────┤
 *   │   Vowly              │ Content (driven by sub-route)               │
 *   │                      │   bosh-sahifa   → CurrentWeddingCard        │
 *   │  BUGUNGI TO'Y       │                 + ArchiveList              │
 *   │   • Bosh sahifa      │   bannerlar     → BannersManager           │
 *   │   • Bannerlar       │   dastur        → TimelineManager          │
 *   │   • …                │   taomlar       → FoodMenuManager          │
 *   │                      │   …             → …                          │
 *   │  ARXIV              │   archive       → ArchiveList                │
 *   │   • To'ylar arxivi  │   archive/:id   → ArchiveDetailPage          │
 *   │                      │                                            │
 *   │  [venue card]        │                                            │
 *   └──────────────────────┴────────────────────────────────────────────┘
 *
 * Mobile: sidebar becomes a left-edge drawer toggled by the topbar.
 *
 * All existing managers are reused unchanged — they take a `hallId` (and now
 * optionally a `weddingId`) and continue to do exactly what they did before.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';
import { Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import CurrentWeddingCard from '@/components/admin/CurrentWeddingCard';
import ArchiveList from '@/components/admin/ArchiveList';
import ArchiveDetailPage from '@/pages/ArchiveDetailPage';

import BannersManager from '@/components/halladmin/BannersManager';
import TimelineManager from '@/components/halladmin/TimelineManager';
import FoodMenuManager from '@/components/halladmin/FoodMenuManager';
import ArtistsManager from '@/components/halladmin/ArtistsManager';
import BrideGroomEditor from '@/components/halladmin/BrideGroomEditor';
import QRCodeGenerator from '@/components/halladmin/QRCodeGenerator';
import MomentsManager from '@/components/halladmin/MomentsManager';
import MusicManager from '@/components/halladmin/MusicManager';
import RsvpManager from '@/components/admin/RsvpManager';

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useActiveWedding,
  useArchiveOnMount,
} from '@/hooks/useWeddings';
import { cn } from '@/lib/utils';

export default function HallAdminDashboard() {
  const { user, signOut, hallId } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useArchiveOnMount(hallId);

  // touch the active wedding so its stats stay fresh
  useActiveWedding(hallId);

  // Auto-close the drawer on any navigation (mobile UX)
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  if (!hallId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f6ee]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-medium">{t('admin.account.noAccess')}</h2>
          <p className="mt-2 max-w-sm text-[13.5px] text-neutral-500">
            {t('admin.account.notLinked')}
          </p>
          <button onClick={signOut} className="mt-4 text-[13px] text-[#3a4530] underline">
            {t('admin.topbar.logout')}
          </button>
        </div>
      </div>
    );
  }

  // Pull venue info to put in the sidebar footer
  const { data: hall } = useQuery({
    queryKey: ['hall', hallId],
    queryFn: async () => {
      const { data, error } = await supabase.from('wedding_halls').select('*').eq('id', hallId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });

  // Pull admin profile (avatar etc.)
  const { data: profile } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('hall_admins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url ?? null;

  return (
    <div className="min-h-screen bg-[#f9f6ee] text-neutral-800">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        {/* Desktop sidebar */}
        <aside className="hidden w-[260px] flex-shrink-0 border-r border-neutral-200/70 bg-[#f5f1e8] md:block">
          <AdminSidebar
            hallName={hall?.name ?? t('admin.sidebar.brand')}
            hallLogo={hall?.logo_url}
          />
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
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.22 }}
                className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[#f5f1e8] shadow-xl md:hidden"
              >
                <button
                  type="button"
                  aria-label={t('common.close')}
                  onClick={() => setDrawerOpen(false)}
                  className="absolute right-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-white text-neutral-700 shadow"
                >
                  <X className="h-4 w-4" />
                </button>
                <AdminSidebar
                  hallName={hall?.name ?? t('admin.sidebar.brand')}
                  hallLogo={hall?.logo_url}
                  onNavigate={() => setDrawerOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main column */}
        <div className="min-w-0 flex-1">
          <AdminTopbar
            hallId={hallId}
            userName={userName}
            userEmail={user?.email ?? null}
            avatarUrl={avatarUrl}
            onOpenSidebar={() => setDrawerOpen(true)}
            onSignOut={() => {
              signOut().then(() => {
                window.location.href = '/';
              });
            }}
          />

          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            className={cn('px-4 py-6 md:px-8 md:py-8')}
          >
            <Routes>
              <Route index element={<AdminHome hallId={hallId} />} />
              <Route path="bosh-sahifa" element={<AdminHome hallId={hallId} />} />
              <Route path="bannerlar" element={<BannersManager hallId={hallId} />} />
              <Route path="dastur" element={<TimelineManager hallId={hallId} />} />
              <Route path="taomlar" element={<FoodMenuManager hallId={hallId} />} />
              <Route path="artistlar" element={<ArtistsManager hallId={hallId} />} />
              <Route path="kelin-kuyov" element={<BrideGroomEditor hallId={hallId} />} />
              <Route path="qr" element={<QRCodeGenerator hallId={hallId} />} />
              <Route path="suratlari" element={<MomentsManager hallId={hallId} />} />
              <Route path="rsvp" element={<RsvpManager hallId={hallId} />} />
              <Route path="musiqa" element={<MusicManager hallId={hallId} />} />
              <Route path="archive" element={<ArchiveSection hallId={hallId} />} />
              <Route path="archive/:weddingId" element={<ArchiveDetailPage hallId={hallId} />} />
              <Route path="*" element={<AdminHome hallId={hallId} />} />
            </Routes>
          </motion.main>
        </div>
      </div>
    </div>
  );
}

/** Home — current wedding + archive list (the exact reference design). */
function AdminHome({ hallId }: { hallId: string }) {
  return (
    <div className="mx-auto max-w-[860px] space-y-6">
      <CurrentWeddingCard hallId={hallId} hallName={t('admin.sidebar.brand')} />
      <ArchiveList hallId={hallId} />
    </div>
  );
}

/** /admin/archive — full-bleed archive list (no current wedding card). */
function ArchiveSection({ hallId }: { hallId: string }) {
  return (
    <div className="mx-auto max-w-[860px]">
      <ArchiveList hallId={hallId} />
    </div>
  );
}
