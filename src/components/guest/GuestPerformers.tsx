import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface Artist {
  id: string;
  name: string;
  description?: string | null;
  performance_time?: string | null;
  image_url?: string | null;
}

interface Props {
  artists: Artist[];
}

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

/**
 * Editorial performers section — large names, subtle subtitles,
 * performance time callouts, optional portrait photography.
 */
export default function GuestPerformers({ artists }: Props) {
  if (!artists || artists.length === 0) return null;
  return (
    <div className="divide-y divide-[#1a1714]/10">
      {artists.map((a, i) => (
        <motion.article
          key={a.id}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: i * 0.04, ease: easeOutExpo }}
          className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5"
        >
          {a.image_url ? (
            <img
              src={a.image_url}
              alt={a.name}
              loading="lazy"
              className="h-14 w-14 flex-shrink-0 rounded-full object-cover ring-1 ring-[#1a1714]/10"
            />
          ) : (
            <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-full border border-[#1a1714]/10 bg-[#1a1714]/[0.03] text-[10px] uppercase tracking-wider text-[#1a1714]/40">
              {a.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p
              className="font-display text-[clamp(1.15rem,4.2vw,1.45rem)] font-light leading-tight text-[#1a1714]"
              style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif' }}
            >
              {a.name}
            </p>
            {a.description && (
              <p className="mt-1 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-[#1a1714]/55">
                {a.description}
              </p>
            )}
          </div>
          {a.performance_time && (
            <div className="flex flex-col items-end gap-0.5 text-right">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-[#1a1714]/40">
                <Clock className="h-3 w-3" strokeWidth={1.6} />
                Vaqt
              </span>
              <span
                className="font-display text-[1.25rem] font-light tabular-nums text-[#1a1714]"
                style={{ fontFamily: '"Cormorant Garamond",serif' }}
              >
                {a.performance_time.slice(0, 5)}
              </span>
            </div>
          )}
        </motion.article>
      ))}
    </div>
  );
}
