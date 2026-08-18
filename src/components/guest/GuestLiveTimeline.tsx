import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Radio } from 'lucide-react';
import { useTimelineEvents, TimelineEvent } from '@/hooks/useHallData';

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

function toMinutes(t: string) {
  const [h, m] = t.split(':');
  return Number(h) * 60 + Number(m);
}
function fmt(t: string) {
  return t.slice(0, 5);
}
function humanIn(mins: number) {
  if (mins <= 0) return 'házir';
  if (mins < 60) return `${mins} minuttan soń`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} saat ${m} minuttan soń` : `${h} saattan soń`;
}

type Status = 'done' | 'live' | 'upcoming';

interface Props {
  hallId: string;
  timelineOverride?: TimelineEvent[] | null;
}

/**
 * Defaults to fetching from Supabase; accepts an explicit override so preview
 * mode can render without a real backend.
 */
export default function GuestLiveTimeline({ hallId, timelineOverride }: Props) {
  const { data: fetched } = useTimelineEvents(hallId);
  const events = timelineOverride ?? fetched ?? null;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const nowMin = now.getHours() * 60 + now.getMinutes();

  const { items, current, next } = useMemo(() => {
    const list = [...(events ?? [])].sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
    const endOf = (e: TimelineEvent, i: number) =>
      e.end_time
        ? toMinutes(e.end_time)
        : list[i + 1]
          ? toMinutes(list[i + 1].start_time)
          : toMinutes(e.start_time) + 60;

    const withStatus = list.map((e, i) => {
      const start = toMinutes(e.start_time);
      const end = endOf(e, i);
      const status: Status = nowMin >= end ? 'done' : nowMin >= start ? 'live' : 'upcoming';
      return { event: e, start, end, status };
    });

    const cur = withStatus.find((x) => x.status === 'live') ?? null;
    const nxt = withStatus.find((x) => x.status === 'upcoming') ?? null;
    return { items: withStatus, current: cur, next: nxt };
  }, [events, nowMin]);

  if (!events || events.length === 0) return null;

  return (
    <div className="vow-live">
      {/* === Live card === */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current?.event.id ?? 'idle'}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.55, ease: easeOutExpo }}
          className="relative overflow-hidden rounded-[26px] border border-[#ece5d4] bg-[#fbf6ec] px-6 pt-6 pb-5 shadow-[0_30px_60px_-44px_rgba(23,21,19,0.35)]"
        >
          {/* Subtle floral decoration, scaled from reference */}
          <svg
            aria-hidden
            className="pointer-events-none absolute -right-2 -top-2 h-32 w-32 text-[#5a6240]/40"
            viewBox="0 0 200 200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <g opacity="0.6">
              <path d="M70 20 L80 50 L60 60 Z" />
              <path d="M80 50 L100 75 L70 95 Z" />
              <path d="M70 95 L60 130 L40 110 Z" />
              <path d="M60 130 L80 155 L40 160 Z" />
              <path d="M80 155 L100 175 L60 195 Z" />
              <path d="M100 75 L130 80 L120 110 Z" />
              <path d="M120 110 L150 120 L130 145 Z" />
              <path d="M130 145 L160 165 L120 170 Z" />
              <path d="M70 95 L40 110 L70 130 Z" />
            </g>
            <g opacity="0.4">
              <path d="M130 80 C 145 70, 160 70, 170 90" />
              <path d="M150 120 C 170 110, 185 125, 175 150" />
              <path d="M40 110 C 30 95, 18 100, 15 120" />
            </g>
          </svg>

          <div className="relative flex items-start justify-between">
            <div className="inline-flex items-center gap-2">
              <motion.span
                className="h-2 w-2 rounded-full bg-[#5a6240]"
                animate={{ scale: [1, 1.45, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              />
              <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.32em] text-[#5a6240]">
                Live
              </span>
            </div>

            {current ? (
              <span className="rounded-full border border-[#5a6240]/35 px-3 py-1 font-sans text-[9.5px] font-semibold uppercase tracking-[0.24em] text-[#5a6240]">
                Hozir
              </span>
            ) : (
              <span className="rounded-full border border-[#1a1714]/15 px-3 py-1 font-sans text-[9.5px] font-semibold uppercase tracking-[0.24em] text-[#1a1714]/55">
                Tez orada
              </span>
            )}
          </div>

          <motion.h3
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="relative mt-3 font-display text-[clamp(1.55rem,5.6vw,2.05rem)] font-light leading-[1.05] text-[#1a1714]"
            style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif' }}
          >
            {current
              ? (current.event.icon ? `${current.event.icon} ` : '') + current.event.title
              : items.every((i) => i.status === 'done')
                ? 'Baǵdarlama juwmaqlandı'
                : 'Baǵdarlama tez arada baslanadı'}
          </motion.h3>

          {current?.event.description && (
            <p className="relative mt-1.5 text-[12.5px] leading-[1.55] text-[#1a1714]/60">
              {current.event.description}
            </p>
          )}

          {next && (
            <p className="relative mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#5a6240]">
              <Clock className="h-3 w-3" />
              <span>
                {humanIn(next.start - nowMin)} <span className="text-[#1a1714]/40">· keyingi</span>{' '}
                <span className="text-[#1a1714]">{next.event.title}</span>
              </span>
            </p>
          )}

          {current && current.end && (
            <p className="relative mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1a1714]/55">
              <Radio className="h-3 w-3" />
              <span>
                {Math.max(1, current.end - nowMin)} minuttan soń juwmaqlaydı
              </span>
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* === Vertical timeline === */}
      <ol className="relative mt-6 ml-1 space-y-3 border-l border-[#1a1714]/15 pl-5">
        {items.map(({ event, status }, i) => (
          <motion.li
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.5, ease: easeOutExpo }}
            className="relative"
          >
            <span className="absolute -left-[27px] top-2.5 flex items-center justify-center">
              {status === 'live' ? (
                <span className="relative grid h-4 w-4 place-items-center rounded-full bg-[#5a6240]">
                  <motion.span
                    className="absolute h-4 w-4 rounded-full bg-[#5a6240]"
                    animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    aria-hidden
                  />
                  <Radio className="relative h-2.5 w-2.5 text-[#fbf6ec]" strokeWidth={2.5} />
                </span>
              ) : status === 'done' ? (
                <span className="grid h-4 w-4 place-items-center rounded-full border border-[#1a1714]/15 bg-white">
                  <span className="h-1 w-1 rounded-full bg-[#1a1714]/35" />
                </span>
              ) : (
                <span className="grid h-4 w-4 place-items-center rounded-full border border-[#1a1714]/20 bg-white">
                  <span className="h-1 w-1 rounded-full bg-transparent" />
                </span>
              )}
            </span>

            <div
              className={
                'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors ' +
                (status === 'live'
                  ? 'border-[#5a6240]/35 bg-[#5a6240]/[0.05]'
                  : status === 'done'
                    ? 'border-transparent bg-transparent'
                    : 'border-transparent bg-transparent')
              }
            >
              <div className="min-w-0 flex-1">
                <p
                  className={
                    'text-[14px] ' +
                    (status === 'done'
                      ? 'text-[#1a1714]/35 line-through decoration-[#1a1714]/15'
                      : status === 'live'
                        ? 'font-semibold text-[#1a1714]'
                        : 'text-[#1a1714]/75')
                  }
                >
                  {event.icon ? `${event.icon} ` : ''}
                  {event.title}
                </p>
                {event.description && status !== 'done' && (
                  <p className="mt-0.5 text-[11.5px] text-[#1a1714]/45">{event.description}</p>
                )}
              </div>
              <span
                className={
                  'flex-shrink-0 font-sans text-[12px] font-medium tabular-nums tracking-wider ' +
                  (status === 'live'
                    ? 'text-[#5a6240]'
                    : status === 'done'
                      ? 'text-[#1a1714]/30'
                      : 'text-[#1a1714]/55')
                }
              >
                {fmt(event.start_time)}
              </span>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
