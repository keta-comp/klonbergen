import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Calendar } from 'lucide-react';

interface Hall {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}

interface Props {
  hall: Hall;
  weddingDate?: string | null;
}

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

/**
 * Editorial venue info card with map link and contact details.
 */
export default function GuestInfo({ hall, weddingDate }: Props) {
  return (
    <div className="space-y-3">
      <motion.a
        href={
          hall.address
            ? `https://maps.google.com/?q=${encodeURIComponent(hall.address)}`
            : '#'
        }
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: easeOutExpo }}
        className="block rounded-[20px] border border-[#1a1714]/8 bg-[#fbf6ec] p-5 transition-colors hover:bg-[#f0e9d7]"
      >
        <div className="flex items-start gap-4">
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#1a1714]/[0.05] text-[#1a1714]">
            <MapPin className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-[#1a1714]/55">
              Mánzil
            </p>
            <p
              className="mt-1 font-display text-[clamp(1.1rem,3.8vw,1.3rem)] font-light leading-snug text-[#1a1714]"
              style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif' }}
            >
              {hall.name}
            </p>
            {hall.address && (
              <p className="mt-0.5 text-[12.5px] leading-[1.55] text-[#1a1714]/65">
                {hall.address}
              </p>
            )}
          </div>
        </div>
      </motion.a>

      {hall.phone && (
        <motion.a
          href={`tel:${hall.phone}`}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.05, ease: easeOutExpo }}
          className="block rounded-[20px] border border-[#1a1714]/8 bg-[#fbf6ec] p-5 transition-colors hover:bg-[#f0e9d7]"
        >
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#1a1714]/[0.05] text-[#1a1714]">
              <Phone className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-[#1a1714]/55">
                Baylanıs
              </p>
              <p className="mt-1 text-[14px] font-medium text-[#1a1714]">{hall.phone}</p>
            </div>
          </div>
        </motion.a>
      )}

      {weddingDate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1, ease: easeOutExpo }}
          className="rounded-[20px] border border-[#1a1714]/8 bg-[#fbf6ec] p-5"
        >
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#1a1714]/[0.05] text-[#1a1714]">
              <Calendar className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-[#1a1714]/55">
                Toy kúni
              </p>
              <p
                className="mt-1 font-display text-[clamp(1.05rem,3.6vw,1.2rem)] font-light text-[#1a1714]"
                style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif' }}
              >
                {new Date(weddingDate).toLocaleDateString('uz-UZ', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {weddingDate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.15, ease: easeOutExpo }}
          className="rounded-[20px] border border-[#1a1714]/8 bg-[#fbf6ec] p-5"
        >
          <div className="flex items-start gap-4">
            <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#1a1714]/[0.05] text-[#1a1714]">
              <Clock className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-[#1a1714]/55">
                Qabıllaw waqtı
              </p>
              <p className="mt-1 text-[14px] font-medium text-[#1a1714]">
                18:00 — 23:00
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
