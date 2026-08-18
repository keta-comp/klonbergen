import { motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';

interface Food {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  category?: string | null;
  image_url?: string | null;
}

interface Props {
  foods: Food[];
  tableLabel?: string | null;
}

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

/**
 * Premium editorial menu listing, grouped by category with an elegant
 * subtotal-free print-newspaper feel.
 */
export default function GuestMenu({ foods, tableLabel }: Props) {
  if (!foods || foods.length === 0) return null;

  // Group by category if multiple categories exist
  const groups: { category: string; items: Food[] }[] = [];
  for (const f of foods) {
    const cat = f.category?.trim() || 'Dástúrxan';
    const grp = groups.find((g) => g.category === cat);
    if (grp) grp.items.push(f);
    else groups.push({ category: cat, items: [f] });
  }

  return (
    <div className="space-y-7">
      {tableLabel && (
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.36em] text-[#5a6240]">
          Sizdiń stol — {tableLabel}
        </p>
      )}

      {groups.map((g, gi) => (
        <div key={g.category + gi}>
          <h4
            className="font-display text-[clamp(1.05rem,3.6vw,1.25rem)] font-light uppercase tracking-[0.18em] text-[#1a1714]"
            style={{ fontFamily: '"Cormorant Garamond",serif' }}
          >
            {g.category}
          </h4>
          <div className="mt-2 h-px bg-[#1a1714]/10" />
          <ul className="mt-3 divide-y divide-[#1a1714]/8">
            {g.items.map((f, i) => (
              <motion.li
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.03, ease: easeOutExpo }}
                className="flex items-center gap-3 py-4"
              >
                {/* Food thumbnail */}
                {f.image_url ? (
                  <img
                    src={f.image_url}
                    alt={f.name}
                    loading="lazy"
                    className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-[#1a1714]/[0.06]">
                    <UtensilsCrossed className="h-5 w-5 text-[#1a1714]/25" />
                  </div>
                )}
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-display text-[clamp(1.05rem,4vw,1.3rem)] font-light leading-snug text-[#1a1714]"
                    style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif' }}
                  >
                    {f.name}
                  </p>
                  {f.description && (
                    <p className="mt-1 text-[12.5px] leading-[1.55] text-[#1a1714]/55">
                      {f.description}
                    </p>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
