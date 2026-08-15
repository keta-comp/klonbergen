import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadMoment, useWeddingMoments } from '@/hooks/useWeddingMoments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props {
  hallId: string;
  tableNumber?: string | null;
}

/** Premium guest album — guests add their own photos, everyone sees them live. */
export default function WeddingMoments({ hallId, tableNumber }: Props) {
  const { t } = useTranslation();
  const { data: moments, isLoading } = useWeddingMoments(hallId);
  const upload = useUploadMoment(hallId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [guestName, setGuestName] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const onPick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('guest.moments.type'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('guest.moments.size'));
      return;
    }
    try {
      await upload.mutateAsync({ file, guestName, tableNumber });
      toast.success(t('guest.moments.ok'));
    } catch {
      toast.error(t('guest.moments.fail'));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-primary/15 bg-card/70 p-5 text-center shadow-sm backdrop-blur-sm">
        <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
          {t('guest.moments.intro')}
        </p>
        <Input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder={t('guest.moments.namePh')}
          className="mb-3 h-11 rounded-2xl border-primary/20 bg-background/60 text-center text-sm"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
          className="h-12 w-full rounded-2xl gold-gradient text-primary-foreground text-[15px] font-semibold shadow-md"
        >
          {upload.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('guest.moments.uploading')}</>
          ) : (
            <><Camera className="mr-2 h-4 w-4" /> {t('guest.moments.uploadBtn')}</>
          )}
        </Button>
      </div>

      {isLoading && <p className="text-center text-xs text-muted-foreground">{t('guest.moments.loading')}</p>}

      {moments && moments.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          <AnimatePresence initial={false}>
            {moments.map((m) => (
              <motion.button
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                onClick={() => setPreview(m.image_url)}
                className="aspect-square overflow-hidden rounded-2xl border border-primary/15 bg-muted shadow-sm"
              >
                <img src={m.image_url} alt={t('guest.moments.photoAlt')} loading="lazy" className="h-full w-full object-cover" />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        !isLoading && (
          <p className="text-center text-[13px] italic text-muted-foreground">
            {t('guest.moments.empty')}
          </p>
        )
      )}

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={preview}
              alt={t('guest.moments.photoAlt')}
              className="max-h-[80vh] w-auto rounded-3xl shadow-2xl"
            />
            <button className="absolute right-5 top-5 rounded-full bg-card p-2 shadow-lg" onClick={() => setPreview(null)}>
              <X className="h-4 w-4 text-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
