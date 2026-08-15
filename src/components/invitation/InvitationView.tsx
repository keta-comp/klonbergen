import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  MapPin,
  Share2,
  Link2,
  Download,
  Send,
  MessageCircle,
  Instagram,
  ImageDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GoldDust from '@/components/visual/GoldDust';
import { CornerFiligree, Divider, Rings } from './Ornaments';
import { getTemplate } from './templates';
import StoryCard from './StoryCard';
import type { Invitation } from '@/hooks/useInvitations';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props {
  invitation: Pick<
    Invitation,
    'bride_name' | 'groom_name' | 'wedding_date' | 'wedding_time' | 'hall_name' | 'address' | 'photos' | 'template' | 'slug'
  >;
  shareUrl: string;
  preview?: boolean;
}

function parts(date: string, months: string[], weekdays: string[]) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { day: date, month: '', year: '', weekday: '' };
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: months[d.getMonth()],
    year: String(d.getFullYear()),
    weekday: weekdays[d.getDay()],
  };
}

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    finished: diff === 0,
  };
}

const reveal = {
  hidden: { opacity: 0, y: 26, filter: 'blur(6px)' },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function InvitationView({ invitation, shareUrl, preview = false }: Props) {
  const { t, tList } = useTranslation();
  const tpl = getTemplate(invitation.template);
  const photos = (invitation.photos || []).filter(Boolean);
  const [opened, setOpened] = useState(preview);
  const cardRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const months = tList('invitation.view.months');
  const weekdays = tList('invitation.view.weekdays');

  const target = useMemo(
    () => new Date(`${invitation.wedding_date}T${(invitation.wedding_time || '00:00').slice(0, 5)}:00`),
    [invitation.wedding_date, invitation.wedding_time],
  );
  const cd = useCountdown(target);
  const d = parts(invitation.wedding_date, months, weekdays);

  // 3D parallax tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], ['6deg', '-6deg']), { stiffness: 110, damping: 20 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], ['-7deg', '7deg']), { stiffness: 110, damping: 20 });
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const initials = `${(invitation.bride_name || '?')[0]} ${(invitation.groom_name || '?')[0]}`.toUpperCase();
  const shareText = t('invitation.view.shareText', { bride: invitation.bride_name, groom: invitation.groom_name });
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${invitation.hall_name} ${invitation.address || ''}`.trim(),
  )}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('invitation.copyOk'));
    } catch {
      toast.error(t('invitation.copyFail'));
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, text: shareText, url: shareUrl });
        return;
      } catch { /* cancelled */ }
    }
    copyLink();
  };

  const downloadQr = () => {
    const canvas = document.getElementById('invitation-qr') as HTMLCanvasElement | null;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, `${invitation.slug || 'miratnama'}-qr.png`);
    });
  };

  const downloadStory = async () => {
    const node = storyRef.current;
    if (!node || busy) return;
    setBusy(true);
    const tload = toast.loading(t('invitation.story.loading'));
    try {
      const dataUrl = await toPng(node, {
        width: 1080,
        height: 1920,
        pixelRatio: 1,
        cacheBust: true,
        skipFonts: false,
      });
      saveAs(dataUrl, `${invitation.slug || 'miratnama'}-story.png`);
      toast.success(t('invitation.story.ok'), { id: tload });
    } catch {
      toast.error(t('invitation.story.fail'), { id: tload });
    } finally {
      setBusy(false);
    }
  };


  const shareLinks = [
    { label: 'Telegram', icon: Send, href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` },
    { label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}` },
    { label: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/' },
  ];

  const countdownItems = [
    { v: cd.days, l: t('invitation.timeline.day') },
    { v: cd.hours, l: t('invitation.timeline.hour') },
    { v: cd.minutes, l: t('invitation.timeline.minute') },
    { v: cd.seconds, l: t('invitation.timeline.second') },
  ];

  return (
    <div
      className={`${tpl.page} grain vignette relative overflow-hidden ${preview ? 'rounded-3xl' : 'min-h-screen'} px-4 py-10 md:py-20`}
    >
      <GoldDust count={preview ? 12 : 28} tone={tpl.tone} />

      {/* ---------- Wax seal opening act ---------- */}
      <AnimatePresence>
        {!opened && (
          <motion.button
            type="button"
            onClick={() => setOpened(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.15, filter: 'blur(12px)', transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
            className={`${tpl.page} fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-8 px-6`}
            aria-label={t('invitation.view.openAria')}
          >
            <GoldDust count={22} tone={tpl.tone} />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className={`text-[0.6rem] font-semibold uppercase tracking-[0.5em] ${tpl.label_cls}`}
            >
              {t('invitation.view.youInvited')}
            </motion.p>

            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -14 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.15, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <span className="absolute inset-0 animate-ring-pulse rounded-full border border-gold/50" />
              <div
                className="relative flex h-32 w-32 items-center justify-center rounded-full shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]"
                style={{
                  background: `radial-gradient(circle at 32% 28%, hsl(45 90% 78%), ${tpl.seal} 55%, hsl(38 60% 30%) 100%)`,
                }}
              >
                <span className="font-monogram text-3xl text-white/95 drop-shadow">{initials}</span>
              </div>
            </motion.div>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ delay: 0.8, duration: 2.4, repeat: Infinity }}
              className={`font-display text-lg italic ${tpl.accent}`}
            >
              {t('invitation.view.tapToOpen')}
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ---------- The invitation ---------- */}
      <div className="scene-3d mx-auto w-full max-w-2xl" onMouseMove={onMove} onMouseLeave={() => { mx.set(0); my.set(0); }}>
        <motion.article
          ref={cardRef}
          initial={{ opacity: 0, y: 48, rotateX: 14, scale: 0.94 }}
          animate={opened ? { opacity: 1, y: 0, rotateX: 0, scale: 1 } : {}}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ rotateX: rotX, rotateY: rotY }}
          className={`preserve-3d relative overflow-hidden rounded-[2.5rem] ${tpl.card} ${tpl.body} px-6 py-12 text-center md:px-12 md:py-16`}
        >
          {/* filigree frame */}
          <div className={`pointer-events-none absolute inset-4 rounded-[2rem] border ${tpl.tone === 'dark' ? 'border-gold/25' : 'border-gold/20'}`} />
          <CornerFiligree className={`pointer-events-none absolute left-3 top-3 h-16 w-16 ${tpl.accent}`} />
          <CornerFiligree className={`pointer-events-none absolute right-3 top-3 h-16 w-16 rotate-90 ${tpl.accent}`} />
          <CornerFiligree className={`pointer-events-none absolute bottom-3 right-3 h-16 w-16 rotate-180 ${tpl.accent}`} />
          <CornerFiligree className={`pointer-events-none absolute bottom-3 left-3 h-16 w-16 -rotate-90 ${tpl.accent}`} />

          <motion.div variants={reveal} initial="hidden" animate={opened ? 'show' : 'hidden'} custom={0} className="relative">
            <Rings className={`mx-auto mb-5 h-7 w-12 ${tpl.accent}`} />
            <p className={`text-[0.6rem] font-semibold uppercase tracking-[0.5em] ${tpl.label_cls}`}>{t('invitation.view.invitationLabel')}</p>
          </motion.div>

          {photos.length > 0 && (
            <div className={`relative mt-9 flex items-end justify-center ${photos.length > 1 ? 'gap-4 md:gap-7' : ''}`}>
              {photos.slice(0, 2).map((src, i) => (
                <motion.div
                  key={src}
                  initial={{ opacity: 0, y: 30, rotate: i === 0 ? -6 : 6 }}
                  animate={opened ? { opacity: 1, y: 0, rotate: 0 } : {}}
                  transition={{ delay: 0.35 + i * 0.14, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                  style={{ transform: 'translateZ(50px)' }}
                >
                  <img
                    src={src}
                    alt={t('invitation.view.photoAlt', { name: i === 0 ? invitation.bride_name : invitation.groom_name })}
                    loading="lazy"
                    className={`h-40 w-28 rounded-t-[7rem] object-cover md:h-56 md:w-40 ${tpl.frame}`}
                  />
                  <span className={`mt-3 block text-[0.6rem] font-semibold uppercase tracking-[0.3em] ${tpl.label_cls}`}>
                    {i === 0 ? t('invitation.view.bride') : t('invitation.view.groom')}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          <motion.h1
            variants={reveal}
            initial="hidden"
            animate={opened ? 'show' : 'hidden'}
            custom={3}
            style={{ transform: 'translateZ(35px)' }}
            className={`font-display mt-9 text-[2.6rem] font-light leading-[1.05] md:text-[4rem] ${tpl.heading}`}
          >
            {invitation.bride_name}
            <span className={`mx-3 font-monogram text-[0.55em] align-middle ${tpl.accent}`}>&</span>
            {invitation.groom_name}
          </motion.h1>

          <motion.div variants={reveal} initial="hidden" animate={opened ? 'show' : 'hidden'} custom={4}>
            <Divider className={`mx-auto my-8 h-4 w-64 ${tpl.accent}`} />
          </motion.div>

          {/* date block */}
          <motion.div
            variants={reveal}
            initial="hidden"
            animate={opened ? 'show' : 'hidden'}
            custom={5}
            className="mx-auto flex max-w-sm items-center justify-center gap-5"
            style={{ transform: 'translateZ(25px)' }}
          >
            <div className="flex-1 text-right">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] opacity-70">{d.weekday}</p>
            </div>
            <div className={`border-x px-5 ${tpl.tone === 'dark' ? 'border-gold/30' : 'border-gold/25'}`}>
              <div className={`font-display text-5xl font-light leading-none ${tpl.accent}`}>{d.day}</div>
              <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.28em] opacity-80">{d.month}</div>
            </div>
            <div className="flex-1 text-left">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.3em] opacity-70">{d.year}</p>
            </div>
          </motion.div>

          <motion.div
            variants={reveal}
            initial="hidden"
            animate={opened ? 'show' : 'hidden'}
            custom={6}
            className="mt-8 space-y-2"
          >
            <p className="flex items-center justify-center gap-2 text-sm tracking-wide">
              <Clock className={`h-3.5 w-3.5 ${tpl.accent}`} />
              {(invitation.wedding_time || '').slice(0, 5)}
            </p>
            <p className="font-display text-2xl font-medium md:text-3xl">{invitation.hall_name}</p>
            {invitation.address && (
              <p className="flex items-center justify-center gap-2 text-sm opacity-75">
                <MapPin className={`h-3.5 w-3.5 ${tpl.accent}`} />
                {invitation.address}
              </p>
            )}
          </motion.div>

          {photos.length > 2 && (
            <div className="mt-10 grid grid-cols-3 gap-3">
              {photos.slice(2, 5).map((src, i) => (
                <motion.img
                  key={src}
                  src={src}
                  alt={t('invitation.view.toyPhotoAlt')}
                  loading="lazy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={opened ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.7 + i * 0.1, duration: 0.8 }}
                  whileHover={{ scale: 1.04 }}
                  className={`aspect-[3/4] w-full rounded-2xl object-cover ${tpl.frame}`}
                />
              ))}
            </div>
          )}

          {/* countdown */}
          <motion.div
            variants={reveal}
            initial="hidden"
            animate={opened ? 'show' : 'hidden'}
            custom={7}
            className="mt-11"
            style={{ transform: 'translateZ(20px)' }}
          >
            <p className={`mb-4 text-[0.58rem] font-semibold uppercase tracking-[0.42em] ${tpl.label_cls}`}>
              {t('invitation.view.countdownTitle')}
            </p>
            <div className="grid grid-cols-4 gap-2 md:gap-3">
              {countdownItems.map((item) => (
                <div key={item.l} className={`rounded-2xl px-1 py-4 ${tpl.panel}`}>
                  <div className={`font-display text-3xl font-light leading-none md:text-4xl ${tpl.accent}`}>
                    {String(item.v).padStart(2, '0')}
                  </div>
                  <div className="mt-2 text-[0.55rem] uppercase tracking-[0.22em] opacity-65">{item.l}</div>
                </div>
              ))}
            </div>
            {cd.finished && <p className={`mt-4 font-display text-lg italic ${tpl.accent}`}>{t('invitation.view.started')}</p>}
          </motion.div>

          {/* actions */}
          <motion.div
            variants={reveal}
            initial="hidden"
            animate={opened ? 'show' : 'hidden'}
            custom={8}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <Button
              asChild
              className="btn-foil h-12 rounded-full px-7 text-xs font-semibold uppercase tracking-[0.16em] text-white"
            >
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin className="mr-2 h-4 w-4" /> {t('invitation.view.mapBtn')}
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={nativeShare}
              className={`h-12 rounded-full border-current/25 bg-transparent px-7 text-xs font-semibold uppercase tracking-[0.16em] ${tpl.accent}`}
            >
              <Share2 className="mr-2 h-4 w-4" /> {t('invitation.view.share')}
            </Button>
          </motion.div>

          <motion.div
            variants={reveal}
            initial="hidden"
            animate={opened ? 'show' : 'hidden'}
            custom={9}
            className="mt-5 flex flex-wrap items-center justify-center gap-2"
          >
            {shareLinks.map((s) => (
              <Button key={s.label} asChild size="sm" variant="ghost" className="rounded-full border border-current/15 text-xs">
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  <s.icon className="mr-2 h-3.5 w-3.5" /> {s.label}
                </a>
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={copyLink} className="rounded-full border border-current/15 text-xs">
              <Link2 className="mr-2 h-3.5 w-3.5" /> {t('invitation.actions.copy')}
            </Button>
          </motion.div>

          {/* QR */}
          <motion.div
            variants={reveal}
            initial="hidden"
            animate={opened ? 'show' : 'hidden'}
            custom={10}
            className="mt-12 flex flex-col items-center gap-4"
          >
            <div className="relative rounded-3xl bg-white p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
              <div className="pointer-events-none absolute inset-1.5 rounded-2xl border border-gold/25" />
              <QRCodeCanvas id="invitation-qr" value={shareUrl} size={132} level="H" includeMargin fgColor="#1a1613" />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={downloadQr}
              className="rounded-full border border-current/15 text-xs uppercase tracking-[0.14em]"
            >
              <Download className="mr-2 h-3.5 w-3.5" /> {t('invitation.view.qrDownload')}
            </Button>
          </motion.div>

          {/* Instagram Story format */}
          <motion.div
            variants={reveal}
            initial="hidden"
            animate={opened ? 'show' : 'hidden'}
            custom={10}
            className="mt-14 flex flex-col items-center gap-5"
          >
            <p className={`text-[0.58rem] font-semibold uppercase tracking-[0.42em] ${tpl.label_cls}`}>
              {t('invitation.view.storyFor')}
            </p>
            <div className="h-[480px] w-[270px] overflow-hidden rounded-[2rem] shadow-[0_40px_90px_-45px_rgba(0,0,0,0.6)] ring-1 ring-gold/25">
              <StoryCard ref={storyRef} invitation={invitation} shareUrl={shareUrl} scale={0.25} />
            </div>
            <Button
              onClick={downloadStory}
              disabled={busy}
              className="btn-foil h-12 rounded-full px-7 text-xs font-semibold uppercase tracking-[0.16em] text-white"
            >
              <ImageDown className="mr-2 h-4 w-4" /> {t('invitation.view.storyDownload')}
            </Button>
            <p className="text-xs opacity-60">{t('invitation.view.storyNote')}</p>
          </motion.div>



          <motion.div
            variants={reveal}
            initial="hidden"
            animate={opened ? 'show' : 'hidden'}
            custom={11}
            className={`mt-12 rounded-3xl p-6 text-left ${tpl.panel}`}
          >
            <p className="font-display text-xl font-medium">{t('invitation.view.collectTitle')}</p>
            <p className="mt-1.5 text-sm opacity-75">{t('invitation.view.collectSub')}</p>
            <Button asChild size="sm" className="btn-foil mt-4 rounded-full px-6 text-xs font-semibold uppercase tracking-[0.14em] text-white">
              <a href="/#pricing">Vowly Premiumǵa ótiw</a>
            </Button>
          </motion.div>

          <a
            href="https://vowly.uz"
            target="_blank"
            rel="noopener noreferrer"
    className={`mt-10 inline-block font-monogram text-[0.7rem] tracking-[0.4em] opacity-60 transition-opacity hover:opacity-100 ${tpl.accent}`}
  >
    {t('invitation.view.madeWith')}
  </a>
        </motion.article>
      </div>
    </div>
  );
}
