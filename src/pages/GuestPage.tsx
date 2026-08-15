import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Clock, Heart, MapPin, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFoodItems, useArtists, useBrideGroom, useBanners, useTimelineEvents } from '@/hooks/useHallData';
import BannerCarousel from '@/components/guest/BannerCarousel';
import GuestSection from '@/components/guest/GuestSection';
import SectionNav, { NavSection } from '@/components/guest/SectionNav';
import WeddingMoments from '@/components/guest/WeddingMoments';
import RsvpSection from '@/components/guest/RsvpSection';
import LiveTimeline from '@/components/guest/LiveTimeline';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Seo, { breadcrumbLd } from '@/components/seo/Seo';

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

export default function GuestPage() {
  const { hallId } = useParams<{ hallId: string }>();
  const [searchParams] = useSearchParams();
  const tableNum = searchParams.get('table');

  const { data: hall, isLoading: hallLoading } = useQuery({
    queryKey: ['hall', hallId],
    queryFn: async () => {
      const { data, error } = await supabase.from('wedding_halls').select('*').eq('id', hallId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });

  const { data: brideGroom } = useBrideGroom(hallId!);
  const { data: foods } = useFoodItems(hallId!);
  const { data: artists } = useArtists(hallId!);
  const { data: banners } = useBanners(hallId!);
  const { data: timeline } = useTimelineEvents(hallId!);

  if (hallLoading) return <LoadingSpinner />;
  if (!hall)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Toyxana tabılmadı</p>
      </div>
    );

  const todayFoods = foods?.filter((f) => f.is_today) ?? [];

  const sections: NavSection[] = [
    { id: 'home', label: 'Bas bet' },
    ...(timeline && timeline.length ? [{ id: 'timeline', label: 'Live' }] : []),
    ...(artists && artists.length ? [{ id: 'events', label: 'Ilajlar' }] : []),
    ...(todayFoods.length ? [{ id: 'menu', label: 'Meniu' }] : []),
    ...(banners && banners.length ? [{ id: 'gallery', label: 'Galereya' }] : []),
    ...(brideGroom ? [{ id: 'story', label: 'Tariyxımız' }] : []),
    { id: 'information', label: 'Maǵlıwmat' },
    { id: 'rsvp', label: 'RSVP' },
    { id: 'moments', label: 'Toy sátleri' },
  ];

  const couple = brideGroom ? `${brideGroom.bride_name} & ${brideGroom.groom_name}` : null;
  const seoTitle = couple
    ? `${couple} toy taklifnaması — ${hall.name} | Vowly`
    : `${hall.name} — elektron toy taklifnaması | Vowly`;
  const seoDescription = couple
    ? `${couple} toy máresimine QR kod arqalı elektron taklifnama: ${hall.name}${
        brideGroom?.wedding_date ? `, ${brideGroom.wedding_date}` : ''
      }. Meniu, baǵdarlama, mánzil hám RSVP bir betde.`
    : `${hall.name} ushın raqamli toy sayti: online taklifnama, meniu, baǵdarlama hám RSVP.`;
  const seoImage = banners?.[0]?.image_url || brideGroom?.bride_photo || undefined;

  const eventLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: couple ? `${couple} toyı` : `${hall.name} toy máresimi`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(brideGroom?.wedding_date ? { startDate: brideGroom.wedding_date } : {}),
    ...(seoImage ? { image: [seoImage] } : {}),
    description: seoDescription,
    location: {
      '@type': 'Place',
      name: hall.name,
      ...(hall.address ? { address: { '@type': 'PostalAddress', streetAddress: hall.address, addressCountry: 'UZ' } } : {}),
    },
    organizer: { '@type': 'Organization', name: hall.name, ...(hall.phone ? { telephone: hall.phone } : {}) },
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
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
      <main className="mx-auto w-full max-w-[440px] pb-16">

        {/* Hero */}
        <motion.header
          id="home"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOutExpo }}
          className="relative overflow-hidden px-6 pb-6 pt-14 text-center"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.36em] text-primary/70">
            Assalawma alaykum
          </p>
          <h1 className="font-serif text-[40px] font-semibold leading-[1.05] text-gold-gradient">{hall.name}</h1>
          {brideGroom && (
            <p className="mt-3 font-serif text-lg italic text-muted-foreground">
              {brideGroom.bride_name} <Heart className="mx-1 inline h-3.5 w-3.5 fill-primary text-primary" />{' '}
              {brideGroom.groom_name}
            </p>
          )}
          {brideGroom?.wedding_date && (
            <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.24em] text-primary/80">
              {new Date(brideGroom.wedding_date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
          {tableNum && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 220, damping: 18 }}
              className="mx-auto mt-6 inline-flex flex-col items-center rounded-3xl border border-primary/25 bg-card/70 px-7 py-2.5 shadow-sm backdrop-blur-xl"
            >
              <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Sizdiń stolıńız
              </span>
              <span className="font-serif text-xl font-semibold text-primary">№ {tableNum}</span>
            </motion.div>
          )}
        </motion.header>

        <SectionNav sections={sections} />

        {/* Live wedding timeline */}
        {timeline && timeline.length > 0 && (
          <GuestSection id="timeline" eyebrow="Live" title="Toy baǵdarlaması">
            <LiveTimeline hallId={hallId!} />
          </GuestSection>
        )}

        {/* Gallery / banners hero card */}
        {banners && banners.length > 0 && (
          <GuestSection id="gallery" eyebrow="Galereya" title="Súwretler">
            <div className="overflow-hidden rounded-[28px] border border-primary/15 shadow-lg">
              <BannerCarousel banners={banners} />
            </div>
          </GuestSection>
        )}

        {/* Events / performers */}
        {artists && artists.length > 0 && (
          <GuestSection id="events" eyebrow="Baǵdarlama" title="Ilajlar">
            <div className="space-y-2">
              {artists.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease: easeOutExpo }}
                  className="flex items-center gap-3 rounded-3xl border border-primary/15 bg-card/70 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/12">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-foreground">{a.name}</p>
                    {a.description && <p className="truncate text-xs text-muted-foreground">{a.description}</p>}
                  </div>
                  {a.performance_time && (
                    <span className="flex-shrink-0 rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      {a.performance_time}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </GuestSection>
        )}

        {/* Menu */}
        {todayFoods.length > 0 && (
          <GuestSection id="menu" eyebrow="Dástúrxan" title="Meniu">
            <div className="rounded-[28px] border border-primary/15 bg-card/70 p-5 shadow-sm backdrop-blur-sm">
              {todayFoods.map((food, i) => (
                <motion.div
                  key={food.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.45, ease: easeOutExpo }}
                  className={`flex items-start justify-between gap-3 ${i !== 0 ? 'mt-4 border-t border-primary/10 pt-4' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-foreground">{food.name}</p>
                    {food.description && <p className="mt-0.5 text-xs text-muted-foreground">{food.description}</p>}
                  </div>
                  {food.price && (
                    <span className="flex-shrink-0 text-[13px] font-semibold text-primary">
                      {Number(food.price).toLocaleString()} som
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </GuestSection>
        )}

        {/* Our story */}
        {brideGroom && (
          <GuestSection id="story" eyebrow="Bizin' tariyxımız" title="Baxıtlı juplıq">
            <div className="overflow-hidden rounded-[28px] border border-primary/15 bg-card/70 shadow-sm backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-px bg-primary/10">
                {[
                  { src: brideGroom.bride_photo, name: brideGroom.bride_name },
                  { src: brideGroom.groom_photo, name: brideGroom.groom_name },
                ].map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 1.04 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.7, ease: easeOutExpo }}
                    className="relative aspect-[3/4] bg-muted"
                  >
                    {p.src ? (
                      <img src={p.src} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Heart className="h-6 w-6 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-3">
                      <p className="font-serif text-sm text-background">{p.name}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              {brideGroom.love_story && (
                <p className="p-5 text-center text-[13px] italic leading-relaxed text-muted-foreground">
                  "{brideGroom.love_story}"
                </p>
              )}
            </div>
          </GuestSection>
        )}

        {/* Information */}
        <GuestSection id="information" eyebrow="Maǵlıwmat" title="Paydalı maǵlıwmat">
          <div className="space-y-2">
            {hall.address && (
              <div className="flex items-center gap-3 rounded-3xl border border-primary/15 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Mánzil</p>
                  <p className="text-sm font-medium text-foreground">{hall.address}</p>
                </div>
              </div>
            )}
            {hall.phone && (
              <a
                href={`tel:${hall.phone}`}
                className="flex items-center gap-3 rounded-3xl border border-primary/15 bg-card/70 p-4 shadow-sm backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Baylanıs</p>
                  <p className="text-sm font-medium text-foreground">{hall.phone}</p>
                </div>
              </a>
            )}
          </div>
        </GuestSection>

        {/* RSVP */}
        <GuestSection id="rsvp" eyebrow="RSVP" title="Juwabıńızdı jiberiń">
          <RsvpSection hallId={hallId!} tableNumber={tableNum} />
        </GuestSection>

        {/* Wedding moments */}
        <GuestSection id="moments" eyebrow="Wedding Moments" title="Toy sátleri">
          <WeddingMoments hallId={hallId!} tableNumber={tableNum} />
        </GuestSection>

        <footer className="px-6 pb-6 pt-2 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">Vowly</p>
        </footer>
      </main>
    </div>
  );
}
