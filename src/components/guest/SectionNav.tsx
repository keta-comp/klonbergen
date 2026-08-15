import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface NavSection {
  id: string;
  label: string;
}

interface Props {
  sections: NavSection[];
}

/** Sticky iOS-style segmented navigation with scroll-spy. */
export default function SectionNav({ sections }: Props) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
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

  return (
    <nav className="sticky top-2 z-40 px-4 py-2">
      <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full border border-primary/15 bg-card/75 p-1 shadow-sm backdrop-blur-xl">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => go(s.id)}
            className="relative flex-shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-medium tracking-wide"
          >
            {active === s.id && (
              <motion.span
                layoutId="nav-pill"
                transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                className="absolute inset-0 rounded-full bg-primary/15"
              />
            )}
            <span className={active === s.id ? 'relative text-primary' : 'relative text-muted-foreground'}>
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
