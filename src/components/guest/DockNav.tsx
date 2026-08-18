import { useEffect, useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import {
  Radio,
  Music2,
  UtensilsCrossed,
  Images,
  MapPin,
  Heart,
  Camera,
  ListChecks,
} from 'lucide-react';

export interface DockSection {
  id: string;
  label: string;
  shortLabel?: string;
  /** Dock-level visibility — controls what shows in the bottom bar. */
  dock?: boolean;
}

interface Props {
  sections: DockSection[];
  /** Top-level icon-only dock shown at all times. */
  topDock?: DockSection[];
}

/**
 * Premium mobile dock navigation.
 *
 * Renders as a floating pill at the bottom of the viewport. Active section
 * tracks scroll position via IntersectionObserver, with a smooth pill
 * indicator that animates between the items.
 */
export default function DockNav({ sections, topDock }: Props) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // The reference uses 5 main sections in the bottom dock
  const mainDock =
    topDock && topDock.length
      ? topDock
      : sections
          .filter((s) => s.dock !== false)
          .slice(0, 5);

  return (
    <motion.nav
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4"
      aria-label="Main navigation"
    >
      <div
        className="pointer-events-auto mx-auto flex w-full max-w-[460px] items-stretch justify-between overflow-hidden rounded-full border border-black/5 bg-white/85 px-1 py-1 shadow-[0_18px_50px_-22px_rgba(23,21,19,0.45)] backdrop-blur-xl"
        style={{ WebkitBackdropFilter: 'blur(14px) saturate(1.2)' }}
      >
        <LayoutGroup id="dock-pill">
          {mainDock.map((s, i) => {
            const Icon = iconFor(s.id, i);
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => go(s.id)}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-2 transition-colors"
              >
                {isActive && (
                  <motion.span
                    layoutId="dock-active-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0.5 rounded-full bg-[#1a1714]"
                  />
                )}
                <Icon
                  className={
                    'relative z-[1] h-[18px] w-[18px] transition-colors ' +
                    (isActive ? 'text-[#f8f5ef]' : 'text-[#1a1714]/75')
                  }
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                <span
                  className={
                    'relative z-[1] truncate text-[9.5px] font-medium uppercase tracking-[0.06em] transition-colors ' +
                    (isActive ? 'text-[#f8f5ef]' : 'text-[#1a1714]/65')
                  }
                >
                  {s.shortLabel || s.label}
                </span>
              </button>
            );
          })}
        </LayoutGroup>
      </div>
    </motion.nav>
  );
}

function iconFor(id: string, idx: number) {
  switch (id) {
    case 'live':
      return Radio;
    case 'ijodkorlar':
      return Music2;
    case 'menu':
      return UtensilsCrossed;
    case 'gallery':
      return Images;
    case 'information':
      return MapPin;
    case 'story':
      return Heart;
    case 'moments':
      return Camera;
    case 'rsvp':
      return ListChecks;
    default:
      return Radio;
  }
}
