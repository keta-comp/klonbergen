import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock, Radio } from 'lucide-react';
import { useTimelineEvents, TimelineEvent } from '@/hooks/useHallData';

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

/** "18:30:00" -> minutes since midnight */
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

export default function LiveTimeline({ hallId }: { hallId: string }) {
  const { data: events } = useTimelineEvents(hallId);
  const [now, setNow] = useState(() => new Date());

  // Tick every 30s so the state flips within a minute of the real change.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const nowMin = now.getHours() * 60 + now.getMinutes();

  const { items, current, next, progress } = useMemo(() => {
    const list = [...(events ?? [])].sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
    const endOf = (e: TimelineEvent, i: number) =>
      e.end_time ? toMinutes(e.end_time) : list[i + 1] ? toMinutes(list[i + 1].start_time) : toMinutes(e.start_time) + 60;

    const withStatus = list.map((e, i) => {
      const start = toMinutes(e.start_time);
      const end = endOf(e, i);
      const status: Status = nowMin >= end ? 'done' : nowMin >= start ? 'live' : 'upcoming';
      return { event: e, start, end, status };
    });

    const cur = withStatus.find((x) => x.status === 'live') ?? null;
    const nxt = withStatus.find((x) => x.status === 'upcoming') ?? null;
    const doneCount = withStatus.filter((x) => x.status === 'done').length;
    const pct = withStatus.length
      ? Math.min(100, ((doneCount + (cur ? (nowMin - cur.start) / Math.max(1, cur.end - cur.start) : 0)) / withStatus.length) * 100)
      : 0;

    return { items: withStatus, current: cur, next: nxt, progress: pct };
  }, [events, nowMin]);

  if (!events || events.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Live card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current?.event.id ?? 'idle'}
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.55, ease: easeOutExpo }}
          className="relative overflow-hidden rounded-[28px] border border-primary/25 bg-card/80 p-6 text-center shadow-lg backdrop-blur-xl"
        >
          {current && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-primary/10 blur-2xl"
              animate={{ opacity: [0.25, 0.6, 0.25] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-primary"
                animate={{ opacity: [1, 0.25, 1], scale: [1, 1.35, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                {current ? 'Live now' : 'Kútip turmız'}
              </span>
            </div>

            {current ? (
              <>
                <p className="font-serif text-[26px] leading-tight text-foreground">
                  {current.event.icon ? `${current.event.icon} ` : ''}
                  {current.event.title}
                </p>
                {current.event.description && (
                  <p className="mt-1.5 text-[13px] text-muted-foreground">{current.event.description}</p>
                )}
                <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.22em] text-primary/80">
                  {fmt(current.event.start_time)}
                  {current.event.end_time ? ` — ${fmt(current.event.end_time)}` : ''}
                </p>
              </>
            ) : (
              <p className="font-serif text-xl text-muted-foreground">
                {items.every((i) => i.status === 'done') ? 'Baǵdarlama juwmaqlandı' : 'Baǵdarlama tez arada baslanadı'}
              </p>
            )}

            {next && (
              <div className="mt-5 rounded-2xl border border-primary/15 bg-background/60 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Keyingi</p>
                <p className="mt-1 text-[15px] font-semibold text-foreground">
                  {next.event.icon ? `${next.event.icon} ` : ''}
                  {next.event.title}
                </p>
                <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-primary">
                  <Clock className="h-3 w-3" /> {humanIn(next.start - nowMin)}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-primary/12">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: easeOutExpo }}
        />
      </div>

      {/* Horizontal timeline (tablet / desktop) */}
      <div className="hidden md:block">
        <div className="relative overflow-x-auto pb-2">
          <div className="relative flex min-w-max items-start gap-8 px-2 pt-6">
            <div className="absolute left-0 right-0 top-[30px] h-px bg-primary/15" />
            {items.map(({ event, status }, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.45, ease: easeOutExpo }}
                className="relative flex w-32 flex-col items-center text-center"
              >
                <Dot status={status} />
                <p className={`mt-3 text-[11px] font-medium uppercase tracking-[0.18em] ${status === 'upcoming' ? 'text-muted-foreground/60' : 'text-primary'}`}>
                  {fmt(event.start_time)}
                </p>
                <p className={`mt-1 text-[13px] ${status === 'upcoming' ? 'text-muted-foreground/70' : 'font-semibold text-foreground'}`}>
                  {event.icon ? `${event.icon} ` : ''}
                  {event.title}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Vertical timeline (mobile) */}
      <ol className="relative ml-1 space-y-3 border-l border-primary/15 pl-5 md:hidden">
        {items.map(({ event, status }, i) => (
          <motion.li
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.45, ease: easeOutExpo }}
            className={`relative rounded-2xl border p-3 transition-colors ${
              status === 'live'
                ? 'border-primary/35 bg-primary/[0.07] shadow-sm'
                : status === 'done'
                  ? 'border-primary/10 bg-card/50'
                  : 'border-border/60 bg-transparent'
            }`}
          >
            <span className="absolute -left-[26px] top-4">
              <Dot status={status} small />
            </span>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-[14px] ${status === 'upcoming' ? 'text-muted-foreground/80' : 'font-semibold text-foreground'}`}>
                {event.icon ? `${event.icon} ` : ''}
                {event.title}
              </p>
              <span className={`flex-shrink-0 text-[12px] font-semibold ${status === 'upcoming' ? 'text-muted-foreground/60' : 'text-primary'}`}>
                {fmt(event.start_time)}
              </span>
            </div>
            {event.description && status !== 'upcoming' && (
              <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>
            )}
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

function Dot({ status, small }: { status: Status; small?: boolean }) {
  const size = small ? 'h-4 w-4' : 'h-5 w-5';
  if (status === 'done')
    return (
      <span className={`${size} flex items-center justify-center rounded-full bg-primary text-primary-foreground`}>
        <Check className={small ? 'h-2.5 w-2.5' : 'h-3 w-3'} strokeWidth={3} />
      </span>
    );
  if (status === 'live')
    return (
      <span className="relative flex items-center justify-center">
        <motion.span
          className={`absolute rounded-full bg-primary/40 ${small ? 'h-4 w-4' : 'h-5 w-5'}`}
          animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
        <span className={`${size} relative flex items-center justify-center rounded-full bg-primary text-primary-foreground`}>
          <Radio className={small ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        </span>
      </span>
    );
  return <span className={`${size} rounded-full border border-border bg-background`} />;
}
