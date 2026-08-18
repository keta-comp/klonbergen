import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  id: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  /** Drops in an editorial image strip header above title. */
  headerImage?: string;
  variant?: 'ivory' | 'cream' | 'dark';
}

/**
 * Consistent premium section shell used across the guest experience.
 *
 * Variants:
 *  - ivory  → default warm ivory background
 *  - cream  → slightly tinted cream for alternating rhythm
 *  - dark   → moody dark backdrop for editorial moments
 */
export default function GuestSection({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
  headerImage,
  variant = 'ivory',
}: Props) {
  const bg =
    variant === 'dark'
      ? 'bg-[#1a1714] text-[#f8f5ef]'
      : variant === 'cream'
        ? 'bg-[#fbf6ec]'
        : 'bg-[#f8f5ef]';

  const eyebrowColor = variant === 'dark' ? 'text-[#d8bb82]' : 'text-[#5a6240]';
  const titleColor = variant === 'dark' ? 'text-[#f8f5ef]' : 'text-[#1a1714]';
  const subColor = variant === 'dark' ? 'text-[#f8f5ef]/70' : 'text-[#1a1714]/60';

  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`scroll-mt-20 px-5 py-12 sm:px-6 sm:py-14 ${bg} ${className ?? ''}`}
    >
      {headerImage && (
        <div className="mb-6 overflow-hidden rounded-[24px]">
          <img
            src={headerImage}
            alt=""
            loading="lazy"
            className="aspect-[16/8] w-full object-cover"
          />
        </div>
      )}

      {(eyebrow || title || subtitle) && (
        <header className="mb-7 text-center">
          {eyebrow && (
            <p
              className={`font-sans text-[10px] font-medium uppercase tracking-[0.42em] ${eyebrowColor}`}
            >
              {eyebrow}
            </p>
          )}
          {title && (
            <h2
              className={`mt-3 font-display text-[clamp(1.85rem,6.2vw,2.6rem)] font-light leading-[1.05] tracking-tight ${titleColor}`}
              style={{
                fontFamily: '"Cormorant Garamond","Playfair Display",serif',
                textWrap: 'balance',
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p className={`mx-auto mt-3 max-w-[40ch] text-[13px] leading-[1.6] ${subColor}`}>
              {subtitle}
            </p>
          )}
        </header>
      )}

      {children}
    </motion.section>
  );
}
