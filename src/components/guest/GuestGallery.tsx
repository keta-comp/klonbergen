import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Photo {
  id: string;
  image_url: string;
  title?: string | null;
  caption?: string | null;
}

interface Props {
  photos: Photo[];
  eyebrow?: string;
  title?: string;
}

/**
 * Editorial photo gallery for the Guest experience.
 *
 * - Hero (tall) + supporting (square) tiles per breakpoint.
 * - Single horizontal scroll snap row on mobile, full grid on larger screens.
 * - Lightbox with swipe + counter.
 */
export default function GuestGallery({ photos, eyebrow, title }: Props) {
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const open = (p: Photo, idx: number) => {
    setLightbox(p);
    setLightboxIdx(idx);
  };

  if (!photos || photos.length === 0) return null;

  return (
    <div>
      {(eyebrow || title) && (
        <header className="mb-5 flex items-end justify-between gap-4 px-1">
          <div>
            {eyebrow && (
              <p className="font-sans text-[10px] font-medium uppercase tracking-[0.36em] text-[#5a6240]">
                {eyebrow}
              </p>
            )}
            {title && (
              <h3
                className="mt-2 font-display text-[clamp(1.6rem,5vw,2.15rem)] font-light leading-tight text-[#1a1714]"
                style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif' }}
              >
                {title}
              </h3>
            )}
          </div>
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-[#1a1714]/55">
            {photos.length} foto
          </span>
        </header>
      )}

      {/* Mobile-first horizontal gallery */}
      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:hidden">
        {photos.map((p, i) => (
          <motion.button
            key={p.id}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => open(p, i)}
            className={
              'relative flex-shrink-0 snap-start overflow-hidden rounded-[18px] bg-muted shadow-[0_18px_45px_-28px_rgba(23,21,19,0.45)] ' +
              (i === 0 ? 'aspect-[3/4] w-[68%]' : 'aspect-square w-[44%]')
            }
          >
            <img
              src={p.image_url}
              alt={p.title || `Photo ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
            {p.title && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent p-3">
                <p className="text-left text-[11px] font-medium text-white/95">{p.title}</p>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Tablet/Desktop grid (asymmetric editorial) */}
      <div className="hidden md:grid md:grid-cols-6 md:gap-3">
        {photos.slice(0, 5).map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => open(p, i)}
            className={
              'group relative overflow-hidden rounded-[14px] bg-muted ' +
              (i === 0
                ? 'col-span-3 row-span-2 aspect-[3/4]'
                : i === 1
                  ? 'col-span-3 aspect-[16/9]'
                  : 'col-span-2 aspect-[4/3]')
            }
          >
            <img
              src={p.image_url}
              alt={p.title || `Photo ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
            />
            {p.title && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <p className="text-left text-[12px] font-medium text-white">{p.title}</p>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1714]/95 p-4 backdrop-blur-md"
            onClick={() => setLightbox(null)}
          >
            <button
              aria-label="Close"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(null);
              }}
            >
              <X className="h-4 w-4" />
            </button>

            <button
              aria-label="Previous"
              className="absolute left-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/85 transition-colors hover:bg-white/20 disabled:opacity-30"
              disabled={lightboxIdx === 0}
              onClick={(e) => {
                e.stopPropagation();
                const next = photos[lightboxIdx - 1];
                if (next) {
                  setLightbox(next);
                  setLightboxIdx(lightboxIdx - 1);
                }
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <motion.img
              key={lightbox.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              src={lightbox.image_url}
              alt={lightbox.title || `Photo ${lightboxIdx + 1}`}
              className="max-h-[80vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              aria-label="Next"
              className="absolute right-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/85 transition-colors hover:bg-white/20 disabled:opacity-30"
              disabled={lightboxIdx >= photos.length - 1}
              onClick={(e) => {
                e.stopPropagation();
                const next = photos[lightboxIdx + 1];
                if (next) {
                  setLightbox(next);
                  setLightboxIdx(lightboxIdx + 1);
                }
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white/85 backdrop-blur">
              {lightboxIdx + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
