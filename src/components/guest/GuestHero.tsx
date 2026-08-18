import { motion } from 'framer-motion';
import { Heart, Music, Pause } from 'lucide-react';
import { useMusicPlayer } from './MusicPlayer';
import { useTranslation } from '@/i18n/LanguageContext';

interface BrideGroom {
  bride_name: string;
  groom_name: string;
  wedding_date?: string | null;
  bride_photo?: string | null;
  groom_photo?: string | null;
}

interface Props {
  hallName: string;
  brideGroom?: BrideGroom | null | undefined;
  tableNumber?: string | null;
  heroImage?: string | null;
  fallbackImages?: string[];
  welcomeMessage?: string;
  musicUrl?: string | null;
}

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

function fmtDate(d?: string | null) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  const day = dt.getDate().toString().padStart(2, '0');
  const month = dt.toLocaleDateString('en-GB', { month: 'long' }).toUpperCase();
  const year = dt.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Premium cinematic hero — full-bleed wedding image, layered typography,
 * subtle tabular number badge, gentle entrance animation.
 */
export default function GuestHero({
  hallName,
  brideGroom,
  tableNumber,
  heroImage,
  fallbackImages = [],
  welcomeMessage = "Biz bilan birga eng baxtli kunimizni nishonlayotganingiz uchun minnatdormiz.",
  musicUrl,
}: Props) {
  const { isPlaying, toggle } = useMusicPlayer();
  const { t } = useTranslation();
  // Hero image priority: hall-defined banner → first gallery fallback → first couple photo
  const imageSrc =
    heroImage ||
    fallbackImages[0] ||
    brideGroom?.groom_photo ||
    brideGroom?.bride_photo ||
    '';

  const groom = brideGroom?.groom_name?.trim();
  const bride = brideGroom?.bride_name?.trim();
  const names = [groom, bride].filter(Boolean) as string[];
  const joinedNames = names.join('  &  ');
  const dateText = fmtDate(brideGroom?.wedding_date);

  return (
    <section
      id="home"
      className="relative isolate overflow-hidden"
      style={{
        minHeight: 'min(820px, 100svh)',
        backgroundColor: '#1a1714',
      }}
    >
      {/* === Background image === */}
      {imageSrc ? (
        <div className="absolute inset-0 z-0">
          <motion.img
            src={imageSrc}
            alt={hallName || 'Wedding'}
            initial={{ scale: 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.6, ease: easeOutExpo }}
            loading="eager"
            fetchPriority="high"
            className="h-full w-full object-cover"
            style={{ objectPosition: 'center 38%' }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#2a221c] via-[#1a1714] to-[#0a0907]" />
      )}

      {/* === Cinematic scrim (kept consistent with reference) === */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,8,7,0.55) 0%, rgba(10,8,7,0.18) 22%, rgba(10,8,7,0.10) 50%, rgba(10,8,7,0.55) 88%, rgba(10,8,7,0.78) 100%), radial-gradient(120% 70% at 50% 42%, transparent 40%, rgba(10,8,7,0.28) 100%)',
        }}
      />

      {/* === Top utility: music button only (hamburger removed) === */}
      <div className="absolute right-0 top-0 z-20 flex items-start justify-end px-5 pt-5 sm:px-6 sm:pt-6">
        {musicUrl && (
          <motion.button
            aria-label={isPlaying ? t('message.musicPause') : t('message.musicPlay')}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: easeOutExpo }}
            onClick={() => toggle()}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[#1a1714] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] backdrop-blur-md transition-transform active:scale-95"
          >
            {isPlaying ? (
              <motion.span
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="grid place-items-center"
              >
                <Pause className="h-4 w-4" strokeWidth={2.2} />
              </motion.span>
            ) : (
              <Music className="h-4 w-4" strokeWidth={2.2} />
            )}
          </motion.button>
        )}
      </div>

      {/* === Couple silhouette band on lower third (subtle) === */}
      <div
        className="absolute inset-x-0 z-[2] pointer-events-none"
        style={{
          bottom: '32%',
          height: '36%',
          background:
            'radial-gradient(60% 80% at 50% 100%, rgba(10,8,7,0.65) 0%, rgba(10,8,7,0.30) 40%, transparent 80%)',
        }}
      />

      {/* === Hero content === */}
      <div className="relative z-10 flex min-h-[inherit] flex-col justify-between px-6 pb-10 pt-24 text-center text-[#f8f5ef] sm:px-8 sm:pt-28">
        {/* Top content - eyebrow + names + date */}
        <div className="mx-auto w-full max-w-[440px]">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: easeOutExpo }}
            className="font-sans text-[10px] font-medium uppercase tracking-[0.5em] text-[#f8f5ef]/85"
          >
            Assalawma aleykum
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.05, ease: easeOutExpo }}
            className="mt-5 font-serif text-[clamp(2.4rem,9vw,3.6rem)] font-light leading-[1.02] tracking-tight"
            style={{
              fontFamily: '"Cormorant Garamond","Playfair Display",serif',
              textWrap: 'balance',
            }}
          >
            {joinedNames ? (
              <>
                {joinedNames.split('&').map((part, idx, arr) => (
                  <span key={idx}>
                    {idx > 0 ? (
                      <span
                        className="mx-1 italic text-[#d8bb82]"
                        style={{ fontFamily: '"Cormorant Garamond",serif' }}
                      >
                        &amp;
                      </span>
                    ) : null}
                    {part}
                  </span>
                ))}
              </>
            ) : (
              hallName
            )}
          </motion.h1>

          {dateText && (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.18, ease: easeOutExpo }}
              className="mt-4 font-sans text-[10px] font-medium uppercase tracking-[0.42em] text-[#f8f5ef]/85"
            >
              {dateText}
            </motion.p>
          )}

          {/* Tiny diamond divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.32, ease: easeOutExpo }}
            className="mx-auto mt-7 flex items-center justify-center gap-3"
            aria-hidden
          >
            <span className="h-px w-12 bg-[#f8f5ef]/35" />
            <svg width="9" height="9" viewBox="0 0 9 9" className="text-[#d8bb82]">
              <path d="M4.5 0 L9 4.5 L4.5 9 L0 4.5 Z" fill="currentColor" />
            </svg>
            <span className="h-px w-12 bg-[#f8f5ef]/35" />
          </motion.div>
        </div>

        {/* Bottom content - table badge + welcome */}
        <div className="mx-auto mt-10 w-full max-w-[440px]">
          {tableNumber ? (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.36, ease: easeOutExpo }}
              className="mx-auto mb-6 inline-flex flex-col items-center"
            >
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.42em] text-[#f8f5ef]/85">
                Sizdiń stolıńız
              </p>
              <p
                className="mt-2 font-serif text-[clamp(2.6rem,12vw,4rem)] font-light leading-none text-[#f8f5ef]"
                style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif' }}
              >
                <span className="mr-1 italic text-[#d8bb82]">№</span>
                {tableNumber}
              </p>
            </motion.div>
          ) : null}

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.46, ease: easeOutExpo }}
            className="font-serif text-[clamp(1.05rem,3.6vw,1.25rem)] italic leading-snug text-[#f8f5ef]"
            style={{ fontFamily: '"Cormorant Garamond",serif' }}
          >
            Toyımyzǵa xush kelibsiz!{' '}
            <Heart className="inline h-3.5 w-3.5 -translate-y-0.5 fill-current align-baseline text-[#d8bb82]" />
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.58, ease: easeOutExpo }}
            className="mx-auto mt-3 max-w-[340px] font-sans text-[12.5px] leading-[1.65] text-[#f8f5ef]/85"
          >
            {welcomeMessage}
          </motion.p>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0, ease: easeOutExpo }}
            className="mt-7 flex items-center justify-center"
            aria-hidden
          >
            <motion.svg
              animate={{ y: [0, 6, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#f8f5ef]/75"
            >
              <polyline points="6 9 12 15 18 9" />
            </motion.svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
