import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useBanners,
  useArtists,
  useBrideGroom,
  useFoodItems,
  useTimelineEvents,
} from '@/hooks/useHallData';
import GuestHero from '@/components/guest/GuestHero';
import GuestSection from '@/components/guest/GuestSection';
import DockNav, { type DockSection } from '@/components/guest/DockNav';
import GuestLiveTimeline from '@/components/guest/GuestLiveTimeline';
import GuestGallery from '@/components/guest/GuestGallery';
import GuestPerformers from '@/components/guest/GuestPerformers';
import GuestMenu from '@/components/guest/GuestMenu';
import GuestStory from '@/components/guest/GuestStory';
import GuestInfo from '@/components/guest/GuestInfo';
import GuestMoments from '@/components/guest/GuestMoments';
import GuestRsvp from '@/components/guest/GuestRsvp';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Seo, { breadcrumbLd } from '@/components/seo/Seo';
import { MusicProvider } from '@/components/guest/MusicPlayer';

export default function GuestPage() {
  const { hallId } = useParams<{ hallId: string }>();
  const [searchParams] = useSearchParams();
  const tableNum = searchParams.get('table');

  // Routing — guard against bad hallId (see project comment history)
  const isValidHallId = !!hallId && !hallId.includes(':');
  const safeHallId = isValidHallId ? hallId! : '';

  const { data: hall, isLoading: hallLoading } = useQuery({
    queryKey: ['hall', hallId],
    queryFn: async () => {
      if (hallId === 'preview') {
        return {
          id: 'preview',
          name: 'Zarafshon Ceremony Hall',
          address: 'Berdaq kóshesi 12, Nókis qalasy',
          phone: '+998 90 123 45 67',
        };
      }
      const { data, error } = await supabase
        .from('wedding_halls')
        .select('*')
        .eq('id', safeHallId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isValidHallId,
  });

  const { data: brideGroom } = useBrideGroom(safeHallId === 'preview' ? '__preview__' : safeHallId) as any;
  const { data: foods } = useFoodItems(safeHallId === 'preview' ? '__preview__' : safeHallId) as any;
  const { data: artists } = useArtists(safeHallId === 'preview' ? '__preview__' : safeHallId) as any;
  const { data: banners } = useBanners(safeHallId === 'preview' ? '__preview__' : safeHallId) as any;
  const { data: timeline } = useTimelineEvents(safeHallId === 'preview' ? '__preview__' : safeHallId) as any;

  // === Preview-mode enrichment — fill realistic sample data so the redesign
  // can be inspected without a live backend. ===
  const PREVIEW = hallId === 'preview';
  const realBrideGroom =
    brideGroom || (PREVIEW
      ? {
          bride_name: 'Aygúl',
          groom_name: 'Marat',
          bride_photo: '/gallery-1.jpg',
          groom_photo: '/gallery-2.jpg',
          love_story:
            '2022-jılı birinshi uchrashıwdan 2026-jılǵa shekem — hár bir kúnimiz jańa bir hikoya. Siz benen bóliskenimiz — biz ushın eń bahalı es.',
          wedding_date: '2026-08-03T19:00:00',
        }
      : null);
  const realBanners =
    banners && banners.length > 0
      ? banners
      : PREVIEW
        ? [
            {
              id: 'b1',
              image_url: '/gallery-1.jpg',
              title: 'Kelin ha kuyew',
              sort_order: 1,
            },
            {
              id: 'b2',
              image_url: '/gallery-2.jpg',
              title: 'Toy baǵdarlaması',
              sort_order: 2,
            },
            {
              id: 'b3',
              image_url: '/gallery-3.jpg',
              title: null,
              sort_order: 3,
            },
            {
              id: 'b4',
              image_url: '/gallery-4.jpg',
              title: null,
              sort_order: 4,
            },
            {
              id: 'b5',
              image_url: '/gallery-5.jpg',
              title: 'Tafsilotlar',
              sort_order: 5,
            },
            {
              id: 'b6',
              image_url: '/timeline-guests.jpg',
              title: null,
              sort_order: 6,
            },
          ]
        : banners;
  const realArtists =
    artists && artists.length > 0
      ? artists
      : PREVIEW
        ? [
            { id: 'a1', name: 'Alisher Bayniyazov', description: 'Bayniyazov plejlist', performance_time: '21:00' },
            { id: 'a2', name: 'Gúlshat Ázimbaeva', description: 'Tabrik baǵdarlaması', performance_time: '22:00' },
            { id: 'a3', name: 'Dj Almat', description: 'Muzıkıy dastur', performance_time: '23:00' },
          ]
        : artists;
  const realFoods =
    foods && foods.length > 0
      ? foods
      : PREVIEW
        ? [
            { id: 'f1', name: 'Suyuq taǵam', description: 'Qıymalı sorpa, jaña alınǵan nan', price: 12000, category: 'Ishi', is_today: true },
            { id: 'f2', name: 'Palaw', description: 'Toyxanaqa tán dástúrxan', price: 18000, category: 'Bаш', is_today: true },
            { id: 'f3', name: 'Manta', description: 'Qawınǵa tútqan mantı', price: 14000, category: 'Bаш', is_today: true },
            { id: 'f4', name: 'Somalı sandi', description: 'Sátiwge tayarlanǵan', price: 9000, category: 'Desert', is_today: true },
            { id: 'f5', name: 'Choy hám kofe', description: 'Taza demlenen', price: 6000, category: 'Ishimlik', is_today: true },
          ]
        : foods;
  const realTimeline =
    timeline && timeline.length > 0
      ? timeline
      : PREVIEW
        ? [
            { id: 't1', hall_id: 'preview', title: 'Bet-ashar', description: 'Házir dawam etmoqda', icon: '✨', start_time: '21:00', end_time: '22:00', sort_order: 1 },
            { id: 't2', hall_id: 'preview', title: 'Tabriklar', description: 'Qutlıq sózler hám tilekler', icon: '🌹', start_time: '22:00', end_time: '23:00', sort_order: 2 },
            { id: 't3', hall_id: 'preview', title: 'Muzıkıy dastur', description: 'Konsert hám raqslar', icon: '🎶', start_time: '23:00', end_time: '01:00', sort_order: 3 },
            { id: 't4', hall_id: 'preview', title: 'Kelin-kúyew raqsı', description: 'Birinshi raqs', icon: '💞', start_time: '00:30', end_time: '01:30', sort_order: 4 },
          ]
        : timeline;

  if (hallLoading) return <LoadingSpinner />;
  if (!isValidHallId || !hall)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f5ef]">
        <p className="text-[#1a1714]/55">Toyxana tabılmadı</p>
      </div>
    );

  const todayFoods = realFoods?.filter((f) => f.is_today) ?? [];

  // Build section list — order mirrors the reference image
  const allSections: DockSection[] = [];
  if (realTimeline && realTimeline.length) allSections.push({ id: 'live', label: 'Live', shortLabel: 'Live' });
  if (realArtists && realArtists.length) allSections.push({ id: 'ijodkorlar', label: 'Ijodkorlar', shortLabel: 'Artist' });
  if (todayFoods.length) allSections.push({ id: 'menu', label: 'Meniu', shortLabel: 'Meniu' });
  if (realBanners && realBanners.length) allSections.push({ id: 'gallery', label: 'Galereya', shortLabel: 'Foto' });
  allSections.push({ id: 'information', label: 'Maǵlıwmat', shortLabel: 'Info' });
  allSections.push({ id: 'moments', label: 'Toy sátleri', shortLabel: 'Foto' });
  allSections.push({ id: 'rsvp', label: 'RSVP', shortLabel: 'RSVP' });

  // === Fixed 5-item dock — always in this order regardless of which
  // sections have data. Sections without data simply won't scroll anywhere.
  // User-requested order: Live → Foto → Artist → Meniu → Info ===
  const dockSections: DockSection[] = [
    { id: 'live',        label: 'Live',      shortLabel: 'Live'   },
    { id: 'gallery',     label: 'Galereya',  shortLabel: 'Foto'   },
    { id: 'ijodkorlar',  label: 'Ijodkorlar', shortLabel: 'Artist' },
    { id: 'menu',        label: 'Meniu',     shortLabel: 'Meniu'  },
    { id: 'information', label: 'Maǵlıwmat', shortLabel: 'Info'   },
  ];

  // SEO
  const couple = realBrideGroom
    ? `${realBrideGroom.groom_name} & ${realBrideGroom.bride_name}`
    : null;
  const seoTitle = couple
    ? `${couple} toy taklifnaması — ${hall.name} | Vowly`
    : `${hall.name} — elektron toy taklifnaması | Vowly`;
  const seoDescription = couple
    ? `${couple} toy máresimine QR kod arqalı elektron taklifnama: ${hall.name}${
        realBrideGroom?.wedding_date ? `, ${realBrideGroom.wedding_date}` : ''
      }. Meniu, baǵdarlama, mánzil hám RSVP bir betde.`
    : `${hall.name} ushın raqamli toy sayti: online taklifnama, meniu, baǵdarlama hám RSVP.`;
  const seoImage = realBanners?.[0]?.image_url || realBrideGroom?.groom_photo || undefined;

  const eventLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: couple ? `${couple} toyı` : `${hall.name} toy máresimi`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(realBrideGroom?.wedding_date ? { startDate: realBrideGroom.wedding_date } : {}),
    ...(seoImage ? { image: [seoImage] } : {}),
    description: seoDescription,
    location: {
      '@type': 'Place',
      name: hall.name,
      ...(hall.address
        ? { address: { '@type': 'PostalAddress', streetAddress: hall.address, addressCountry: 'UZ' } }
        : {}),
    },
    organizer: {
      '@type': 'Organization',
      name: hall.name,
      ...(hall.phone ? { telephone: hall.phone } : {}),
    },
  };

  // Fallback gallery images so the gallery never looks empty
  const heroImage = realBanners?.[0]?.image_url || realBrideGroom?.groom_photo || undefined;
  const fallbackImages: string[] = [
    '/gallery-1.jpg',
    '/gallery-2.jpg',
    '/gallery-3.jpg',
    '/gallery-4.jpg',
    '/gallery-5.jpg',
  ];

  const musicUrl: string | null = (hall as any)?.music_url ?? null;

  return (
    <MusicProvider musicUrl={musicUrl}>
    <div className="min-h-screen bg-[#f8f5ef] font-sans text-[#1a1714]">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={`/hall/${hallId}`}
        image={seoImage}
        type="article"
        jsonLd={[
          eventLd,
          breadcrumbLd([
            { name: 'Bas bet', path: '/' },
            { name: hall.name, path: `/hall/${hallId}` },
          ]),
        ]}
      />

      <main className="relative mx-auto w-full max-w-[440px] pb-40">
        {/* === Hero === */}
        <GuestHero
          hallName={hall.name}
          brideGroom={realBrideGroom}
          tableNumber={tableNum}
          heroImage={heroImage}
          fallbackImages={fallbackImages}
          musicUrl={musicUrl}
        />

        {/* === Live wedding timeline === */}
        {realTimeline && realTimeline.length > 0 && (
          <GuestSection
            id="live"
            eyebrow="● Live"
            title="Toy baǵdarlaması"
            subtitle="Kúndik jaǵday haqqında haqıyqıy waqıtta xabar berip turamız."
            variant="ivory"
          >
            <GuestLiveTimeline hallId={hallId!} timelineOverride={realTimeline} />
          </GuestSection>
        )}

        {/* === Gallery / banners === */}
        {realBanners && realBanners.length > 0 && (
          <GuestSection
            id="gallery"
            variant="cream"
            className="!py-12"
          >
            <GuestGallery
              photos={realBanners.map((b, i) => ({
                id: b.id,
                image_url: b.image_url,
                title: b.title || (i === 0 ? 'Kelin ha kuyew' : undefined),
              }))}
              eyebrow="Toy benen"
              title="Galereya"
            />
          </GuestSection>
        )}

        {/* === Performers / artists === */}
        {realArtists && realArtists.length > 0 && (
          <GuestSection
            id="ijodkorlar"
            eyebrow="Baǵdarlama"
            title="Ijodkorlar"
            subtitle="Toy máresiminde shıǵıwshılardıń dizimi."
            variant="ivory"
          >
            <GuestPerformers artists={realArtists} />
          </GuestSection>
        )}

        {/* === Menu === */}
        {todayFoods.length > 0 && (
          <GuestSection
            id="menu"
            eyebrow="Dástúrxan"
            title="Meniu"
            subtitle="Búgingi ústelge arnalǵan taǵamlar."
            variant="cream"
          >
            <GuestMenu
              foods={todayFoods}
              tableLabel={tableNum ? `№ ${tableNum}` : undefined}
            />
          </GuestSection>
        )}

        {/* === Tariximiz (story) === */}
        {realBrideGroom && (
          <GuestSection
            id="story"
            eyebrow="Bizdiń tariyxımız"
            title="Baqıtlı juplıq"
            variant="ivory"
          >
            <GuestStory
              data={{
                bride_name: realBrideGroom.bride_name,
                groom_name: realBrideGroom.groom_name,
                bride_photo: realBrideGroom.bride_photo ?? null,
                groom_photo: realBrideGroom.groom_photo ?? null,
                love_story: realBrideGroom.love_story ?? null,
                wedding_date: realBrideGroom.wedding_date ?? null,
              }}
            />
          </GuestSection>
        )}

        {/* === Information / Venue === */}
        <GuestSection
          id="information"
          eyebrow="Maǵlıwmat"
          title="Toy ornı"
          subtitle="Joldı qáte alıw qıyın bolmasın ushın."
          variant="cream"
        >
          <GuestInfo hall={hall} weddingDate={realBrideGroom?.wedding_date ?? null} />
        </GuestSection>

        {/* === Toy sátleri (guest photo album) === */}
        <GuestSection
          id="moments"
          eyebrow="Toy xotıraları"
          title="Siz hám sur'at qoshing"
          subtitle="Eng chiroyli lahzalardı biz benen bólısıń."
          variant="ivory"
        >
          <GuestMoments hallId={hallId!} tableNumber={tableNum} />
        </GuestSection>

        {/* === RSVP === */}
        <GuestSection
          id="rsvp"
          eyebrow="RSVP"
          title="Juwabıńızdı jiberiń"
          subtitle="Qatnasıwıńızdı aldınnan tastıyıqlań."
          variant="cream"
        >
          <GuestRsvp hallId={hallId!} tableNumber={tableNum} />
        </GuestSection>

        <footer className="px-6 pb-8 pt-4 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.42em] text-[#1a1714]/40">
            Vowly
          </p>
          <p className="mt-1 font-display text-[11px] italic text-[#1a1714]/35" style={{ fontFamily: '"Cormorant Garamond",serif' }}>
            Búgingi kún — bir umıtılmas es
          </p>
        </footer>
      </main>

      {/* === Floating bottom navigation === */}
      <DockNav sections={allSections} topDock={dockSections} />
    </div>
    </MusicProvider>
  );
}
