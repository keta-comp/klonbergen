import { useMemo } from 'react';

interface Props {
  count?: number;
  className?: string;
  /** dark backgrounds get brighter particles */
  tone?: 'light' | 'dark';
}

/** Ambient floating gold dust — pure CSS, GPU friendly, no emoji. */
export default function GoldDust({ count = 26, className = '', tone = 'light' }: Props) {
  const dust = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 18,
        duration: 16 + Math.random() * 18,
        dx: `${(Math.random() - 0.5) * 160}px`,
        opacity: 0.25 + Math.random() * 0.5,
      })),
    [count],
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {dust.map((d) => (
        <span
          key={d.id}
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            opacity: d.opacity,
            background:
              tone === 'dark'
                ? 'radial-gradient(circle, hsl(48 100% 92%), hsl(43 80% 60% / 0))'
                : 'radial-gradient(circle, hsl(43 85% 60%), hsl(43 80% 55% / 0))',
            boxShadow: tone === 'dark' ? '0 0 10px hsl(45 90% 70% / 0.8)' : '0 0 8px hsl(43 80% 55% / 0.5)',
            animation: `drift-up ${d.duration}s linear ${d.delay}s infinite`,
            // @ts-expect-error custom property
            '--dx': d.dx,
          }}
        />
      ))}
    </div>
  );
}
