interface OrnamentProps {
  className?: string;
}

/** Hand-drawn style filigree corner — used to frame the invitation card. */
export function CornerFiligree({ className = '' }: OrnamentProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <path
        d="M2 118V44C2 21.9 19.9 4 42 4h76"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M10 118V48c0-19.9 16.1-36 36-36h72"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M18 66c14 2 24-6 26-20 1-8-4-14-10-13-7 1-9 9-4 14 7 7 20 5 28-3 6-6 8-14 6-22"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="44" cy="18" r="1.6" fill="currentColor" opacity="0.6" />
      <circle cx="18" cy="66" r="1.2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/** Slim botanical divider with a centred diamond. */
export function Divider({ className = '' }: OrnamentProps) {
  return (
    <svg viewBox="0 0 260 20" fill="none" className={className} aria-hidden>
      <path d="M4 10h86" stroke="currentColor" strokeWidth="0.8" opacity="0.45" strokeLinecap="round" />
      <path d="M170 10h86" stroke="currentColor" strokeWidth="0.8" opacity="0.45" strokeLinecap="round" />
      <path d="M104 10c8-6 14-6 22 0-8 6-14 6-22 0z" stroke="currentColor" strokeWidth="0.9" opacity="0.75" />
      <path d="M134 10c8-6 14-6 22 0-8 6-14 6-22 0z" stroke="currentColor" strokeWidth="0.9" opacity="0.75" />
      <path d="M130 3.5l3.2 6.5-3.2 6.5-3.2-6.5z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

/** Two interlocking rings — used as a quiet section marker. */
export function Rings({ className = '' }: OrnamentProps) {
  return (
    <svg viewBox="0 0 48 28" fill="none" className={className} aria-hidden>
      <circle cx="18" cy="15" r="10" stroke="currentColor" strokeWidth="1" opacity="0.75" />
      <circle cx="30" cy="15" r="10" stroke="currentColor" strokeWidth="1" opacity="0.75" />
      <path d="M24 2l1.8 3.2L29 7l-3.2 1.8L24 12l-1.8-3.2L19 7l3.2-1.8z" fill="currentColor" opacity="0.8" />
    </svg>
  );
}
