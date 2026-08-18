import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSendRsvp } from '@/hooks/useWeddingMoments';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props {
  hallId: string;
  tableNumber?: string | null;
}

const easeOutExpo = [0.22, 1, 0.36, 1] as const;

/**
 * Premium RSVP form — segmented choice buttons, pill counters, refined inputs.
 */
export default function GuestRsvp({ hallId, tableNumber }: Props) {
  const { t } = useTranslation();
  const send = useSendRsvp(hallId);
  const [attending, setAttending] = useState(true);
  const [done, setDone] = useState(false);

  const submit = async () => {
    try {
      await send.mutateAsync({
        guest_name: 'Mehmon',
        guests_count: 1,
        attending,
        table_number: tableNumber,
      });
      setDone(true);
      toast.success(t('guest.rsvp.ok'));
    } catch {
      toast.error(t('guest.rsvp.fail'));
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className="rounded-[24px] border border-[#1a1714]/8 bg-gradient-to-br from-[#fbf6ec] to-[#f0e9d7] p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.05 }}
          className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#5a6240]/15 text-[#5a6240]"
        >
          <Check className="h-6 w-6" strokeWidth={2.2} />
        </motion.div>
        <p
          className="font-display text-[clamp(1.4rem,5vw,1.85rem)] font-light leading-tight text-[#1a1714]"
          style={{ fontFamily: '"Cormorant Garamond",serif' }}
        >
          Raxmet!
        </p>
        <p className="mt-2 text-[13px] text-[#1a1714]/65">{t('guest.rsvp.doneSub')}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3 rounded-[24px] border border-[#1a1714]/8 bg-[#fbf6ec] p-5 shadow-[0_30px_60px_-44px_rgba(23,21,19,0.35)]">
      {/* === Choice segmented === */}
      <div className="grid grid-cols-2 gap-2 rounded-full border border-[#1a1714]/10 bg-white p-1">
        {[
          { v: true, label: t('guest.rsvp.attending') },
          { v: false, label: t('guest.rsvp.notAttending') },
        ].map((o) => (
          <button
            key={String(o.v)}
            onClick={() => setAttending(o.v)}
            className={
              'relative flex items-center justify-center rounded-full px-3 py-3 text-[12.5px] font-medium tracking-[0.04em] transition-colors ' +
              (attending === o.v
                ? 'bg-[#1a1714] text-[#fbf6ec]'
                : 'text-[#1a1714]/65 hover:text-[#1a1714]')
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* === Submit === */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={send.isPending}
        onClick={submit}
        className="group mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#1a1714] text-[#fbf6ec] shadow-[0_18px_38px_-22px_rgba(23,21,19,0.6)] transition-transform disabled:opacity-50"
      >
        {send.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className="h-4 w-4 transition-transform group-hover:scale-110" />
        )}
        <span className="font-sans text-[13px] font-semibold tracking-[0.02em]">
          {t('guest.rsvp.submit')}
        </span>
      </motion.button>
    </div>
  );
}
