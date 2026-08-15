import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  id: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}

/** Consistent premium section shell used across the guest experience. */
export default function GuestSection({ id, eyebrow, title, children }: Props) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="scroll-mt-20 px-5 py-8"
    >
      <header className="mb-5 text-center">
        {eyebrow && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-primary/70">{eyebrow}</p>
        )}
        <h2 className="font-serif text-2xl font-semibold text-foreground">{title}</h2>
        <div className="mx-auto mt-3 h-px w-12 bg-primary/40" />
      </header>
      {children}
    </motion.section>
  );
}
