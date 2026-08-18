import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface BrideGroom {
  bride_name: string;
  groom_name: string;
  bride_photo?: string | null;
  groom_photo?: string | null;
  love_story?: string | null;
  wedding_date?: string | null;
}

interface Props {
  data: BrideGroom;
}

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

/**
 * Cinematic couple story — magazine-style two-portrait with large love quote.
 */
export default function GuestStory({ data }: Props) {
  const portraits = [
    { src: data.groom_photo || undefined, name: data.groom_name, role: 'Kúyew' },
    { src: data.bride_photo || undefined, name: data.bride_name, role: 'Kelin' },
  ].filter((p) => p.src);

  return (
    <div className="space-y-6">
      {portraits.length > 0 && (
        <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-[20px]">
          {portraits.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, scale: 1.04 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: easeOutExpo }}
              className="relative aspect-[3/4] overflow-hidden bg-[#1a1714]/[0.04]"
            >
              <img
                src={p.src}
                alt={p.name}
                loading="lazy"
                className="h-full w-full object-cover"
                style={{ objectPosition: 'center 30%' }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent px-3 pb-3 pt-10">
                <p className="font-sans text-[10px] font-medium uppercase tracking-[0.24em] text-white/70">
                  {p.role}
                </p>
                <p
                  className="mt-0.5 font-display text-[1.15rem] font-light text-white"
                  style={{ fontFamily: '"Cormorant Garamond",serif' }}
                >
                  {p.name}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {data.love_story && (
        <motion.figure
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
          className="relative rounded-[20px] border border-[#1a1714]/8 bg-[#fbf6ec] px-6 py-7 text-center"
        >
          <Heart
            className="mx-auto mb-3 h-4 w-4 text-[#5a6240]/70"
            strokeWidth={1.4}
          />
          <blockquote
            className="font-display text-[clamp(1.15rem,4.4vw,1.45rem)] font-light italic leading-[1.45] text-[#1a1714]"
            style={{ fontFamily: '"Cormorant Garamond",serif' }}
          >
            “{data.love_story}”
          </blockquote>
        </motion.figure>
      )}

      {data.wedding_date && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15, ease: easeOutExpo }}
          className="flex items-center justify-center gap-3"
        >
          <span className="h-px w-10 bg-[#1a1714]/25" />
          <span
            className="font-display text-[clamp(1rem,3.6vw,1.15rem)] font-light uppercase tracking-[0.36em] text-[#1a1714]"
            style={{ fontFamily: '"Cormorant Garamond",serif' }}
          >
            {new Date(data.wedding_date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <span className="h-px w-10 bg-[#1a1714]/25" />
        </motion.div>
      )}
    </div>
  );
}
