import { motion } from 'framer-motion';
import { Heart, Calendar } from 'lucide-react';

interface BrideGroom {
  bride_name: string;
  groom_name: string;
  bride_photo?: string | null;
  groom_photo?: string | null;
  love_story?: string | null;
  wedding_date?: string | null;
}

export default function BrideGroomSection({ data }: { data: BrideGroom }) {
  const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}
      className="container py-12"
    >
      <motion.div variants={fadeUp} className="mb-8 text-center">
        <Heart className="mx-auto mb-2 h-8 w-8 text-primary" />
        <h2 className="text-3xl font-bold font-serif text-gold-gradient">Kelin ha'm Kúyew</h2>
      </motion.div>

      <div className="mx-auto grid max-w-3xl items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
        <motion.div variants={fadeUp} className="glass rounded-2xl p-6 text-center">
          {data.bride_photo && (
            <img
              src={data.bride_photo}
              alt={data.bride_name}
              className="mx-auto mb-3 h-32 w-32 rounded-full object-cover ring-4 ring-primary/30"
            />
          )}
          <h3 className="font-serif text-2xl font-bold">{data.bride_name}</h3>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Kelin</p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="hidden sm:block"
        >
          <Heart className="h-10 w-10 fill-primary text-primary" />
        </motion.div>

        <motion.div variants={fadeUp} className="glass rounded-2xl p-6 text-center">
          {data.groom_photo && (
            <img
              src={data.groom_photo}
              alt={data.groom_name}
              className="mx-auto mb-3 h-32 w-32 rounded-full object-cover ring-4 ring-primary/30"
            />
          )}
          <h3 className="font-serif text-2xl font-bold">{data.groom_name}</h3>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Kúyew</p>
        </motion.div>
      </div>

      {data.wedding_date && (
        <motion.p variants={fadeUp} className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          {new Date(data.wedding_date).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
        </motion.p>
      )}

      {data.love_story && (
        <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-center italic text-muted-foreground">
          "{data.love_story}"
        </motion.p>
      )}
    </motion.section>
  );
}
