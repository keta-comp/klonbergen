import { motion } from 'framer-motion';
import { Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  'QR arqalı foto júklew',
  'Jandı toy galereyası',
  'Toy baǵdarlaması (timeline)',
  'Sheksiz mıyman kirisi',
  'Barlıq fotolardı ZIP penen júklew',
];

export default function PremiumUpsell() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mx-auto mt-10 w-full max-w-2xl rounded-[2rem] border border-gold/25 bg-card/90 p-7 shadow-[0_24px_70px_-40px_hsl(43_72%_52%/0.6)] md:p-10"
    >
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
        <Crown className="h-4 w-4 text-gold" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gold-dark">Vowly Premium</span>
      </div>
      <h2 className="font-serif text-2xl font-bold md:text-3xl">
        Toyıńızdı <span className="text-gold-gradient">bunnan da ayrıqsha</span> etiń
      </h2>
      <p className="mt-2 text-muted-foreground">
        Vowly Premium menen hár bir mıymannıń fotosın sol zamattıń ózinde jıynań.
      </p>

      <ul className="mt-6 space-y-3">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-3 text-sm md:text-base">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15">
              <Check className="h-3 w-3 text-gold-dark" />
            </span>
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-col items-start gap-4 border-t border-gold/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-serif text-3xl font-bold text-gold-gradient">299 000 UZS</div>
          <div className="text-xs text-muted-foreground">bir toy ushın</div>
        </div>
        <Button asChild size="lg" className="gold-gradient text-primary-foreground font-semibold">
          <a href="/#pricing">Premiumǵa ótiw</a>
        </Button>
      </div>
    </motion.section>
  );
}
