import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSendRsvp } from '@/hooks/useWeddingMoments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props {
  hallId: string;
  tableNumber?: string | null;
}

export default function RsvpSection({ hallId, tableNumber }: Props) {
  const { t } = useTranslation();
  const send = useSendRsvp(hallId);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [count, setCount] = useState(1);
  const [attending, setAttending] = useState(true);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    try {
      await send.mutateAsync({
        guest_name: name.trim(),
        phone: phone.trim() || undefined,
        guests_count: count,
        attending,
        message: message.trim() || undefined,
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
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-primary/20 bg-card/70 p-8 text-center shadow-sm backdrop-blur-sm"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
          <Check className="h-5 w-5 text-primary" />
        </div>
        <p className="font-serif text-lg text-foreground">{t('guest.rsvp.doneTitle', { name })}</p>
        <p className="mt-1 text-[13px] text-muted-foreground">{t('guest.rsvp.doneSub')}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3 rounded-3xl border border-primary/15 bg-card/70 p-5 shadow-sm backdrop-blur-sm">
      <div className="grid grid-cols-2 gap-2">
        {[
          { v: true, label: t('guest.rsvp.attending') },
          { v: false, label: t('guest.rsvp.notAttending') },
        ].map((o) => (
          <button
            key={String(o.v)}
            onClick={() => setAttending(o.v)}
            className={`rounded-2xl border px-3 py-3 text-[13px] font-medium transition-all ${
              attending === o.v
                ? 'border-primary bg-primary/12 text-primary'
                : 'border-border bg-background/50 text-muted-foreground'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('guest.rsvp.namePh')}
        className="h-11 rounded-2xl border-primary/20 bg-background/60 text-sm"
      />
      <Input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t('guest.rsvp.phonePh')}
        inputMode="tel"
        className="h-11 rounded-2xl border-primary/20 bg-background/60 text-sm"
      />
      <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-background/60 px-4 py-2.5">
        <span className="text-[13px] text-muted-foreground">{t('guest.rsvp.guestsCount')}</span>
        <div className="flex items-center gap-3">
          <button className="h-7 w-7 rounded-full bg-primary/12 text-primary" onClick={() => setCount((c) => Math.max(1, c - 1))}>−</button>
          <span className="w-5 text-center text-sm font-semibold text-foreground">{count}</span>
          <button className="h-7 w-7 rounded-full bg-primary/12 text-primary" onClick={() => setCount((c) => Math.min(20, c + 1))}>+</button>
        </div>
      </div>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t('guest.rsvp.messagePh')}
        rows={3}
        className="rounded-2xl border-primary/20 bg-background/60 text-sm"
      />
      <Button
        onClick={submit}
        disabled={!name.trim() || send.isPending}
        className="h-12 w-full rounded-2xl gold-gradient text-primary-foreground text-[15px] font-semibold shadow-md"
      >
        {send.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" />}
        {t('guest.rsvp.submit')}
      </Button>
    </div>
  );
}
