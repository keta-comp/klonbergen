import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, Loader2, X, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';
import { useUploadMoment, useWeddingMoments } from '@/hooks/useWeddingMoments';

interface Props {
  hallId: string;
  tableNumber?: string | null;
}

/**
 * Premium guest photo album.
 *
 * - Editorial CTA card: name field + large camera upload.
 * - Smooth success animation after upload.
 * - Masonry grid of all photos + lightbox.
 */
export default function GuestMoments({ hallId, tableNumber }: Props) {
  const { t } = useTranslation();
  const { data: moments, isLoading } = useWeddingMoments(hallId);
  const upload = useUploadMoment(hallId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [guestName, setGuestName] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [localMoments, setLocalMoments] = useState<{ id: string; image_url: string; guest_name: string | null; table_number: string | null; created_at: string }[]>([]);

  // Preview mode — no real backend, show a local-only upload
  const isPreview = hallId === 'preview';

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

    // Build a local data URL so the user sees their photo immediately
    const localUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('read-fail'));
      reader.readAsDataURL(file);
    });

    if (isPreview) {
      // In preview mode the database FK is not satisfied, so we keep
      // the photo only in local state and show success.
      setLocalMoments((prev) => [
        {
          id: `local-${Date.now()}`,
          image_url: localUrl,
          guest_name: guestName.trim() || null,
          table_number: tableNumber || null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1800);
      toast.success(t('guest.moments.ok'));
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    try {
      await upload.mutateAsync({ file, guestName, tableNumber });
      toast.success(t('guest.moments.ok'));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1800);
    } catch {
      toast.error(t('guest.moments.fail'));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* === CTA Upload card === */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[24px] border border-[#1a1714]/8 bg-gradient-to-br from-[#fbf6ec] via-[#f5ecd7] to-[#ebe3d3] p-6 shadow-[0_30px_60px_-44px_rgba(23,21,19,0.35)]"
      >
        {/* Subtle decoration */}
        <svg
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-[#5a6240]/15"
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <g>
            <circle cx="120" cy="80" r="40" />
            <circle cx="80" cy="120" r="55" />
            <circle cx="150" cy="140" r="30" />
          </g>
        </svg>

        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-[#5a6240]" strokeWidth={1.8} />
            <span className="font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-[#5a6240]">
              Toy xotıraları
            </span>
          </div>

          <p
            className="font-display max-w-[36ch] text-[clamp(1.05rem,3.6vw,1.2rem)] font-light leading-[1.45] text-[#1a1714]"
            style={{ fontFamily: '"Cormorant Garamond",serif' }}
          >
            Búgingi eng chiroyli lahzalardı biz benen bólısıń — suratingiz darhol albomba qoshadı.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />

          <div className="mt-5 space-y-3">
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ismingiz (ixtiyoriy)"
              className="h-12 w-full rounded-full border border-[#1a1714]/10 bg-white/85 px-5 text-[14px] text-[#1a1714] outline-none transition-colors placeholder:text-[#1a1714]/35 focus:border-[#5a6240]"
            />

            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#5a6240]/12 text-[#5a6240]"
                >
                  <Check className="h-4 w-4" strokeWidth={2.2} />
                  <span className="font-sans text-[13px] font-semibold tracking-wide">
                    Rahmat! Rasmingiz qosıldı
                  </span>
                </motion.div>
              ) : (
                <motion.button
                  key="btn"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={upload.isPending}
                  onClick={() => fileRef.current?.click()}
                  className="group flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#1a1714] text-[#f8f5ef] shadow-[0_18px_38px_-22px_rgba(23,21,19,0.6)] transition-transform disabled:opacity-70"
                >
                  {upload.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.18em]">
                        {t('guest.moments.uploading')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" strokeWidth={2} />
                      <span className="font-sans text-[12.5px] font-semibold uppercase tracking-[0.22em]">
                        Siz hám sur'at qoshing
                      </span>
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* === Photo grid === */}
      {isLoading && (
        <div className="py-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#1a1714]/40" />
        </div>
      )}

      {(() => {
        const allPhotos = [
          ...localMoments,
          ...((moments ?? []).map((m) => ({
            id: m.id,
            image_url: m.image_url,
            guest_name: m.guest_name,
            table_number: m.table_number,
            created_at: m.created_at,
          })) as { id: string; image_url: string; guest_name: string | null; table_number: string | null; created_at: string }[]),
        ];
        if (allPhotos.length === 0) {
          return !isLoading ? (
            <div className="rounded-[18px] border border-dashed border-[#1a1714]/15 px-4 py-10 text-center">
              <Camera className="mx-auto mb-2 h-5 w-5 text-[#1a1714]/30" strokeWidth={1.4} />
              <p className="text-[12.5px] italic text-[#1a1714]/55">
                {t('guest.moments.empty')}
              </p>
            </div>
          ) : null;
        }
        return (
          <div className="grid grid-cols-3 gap-2">
            <AnimatePresence initial={false}>
              {allPhotos.map((m, i) => (
                <motion.button
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 26, delay: i * 0.03 }}
                  onClick={() => setPreview(m.image_url)}
                  className="aspect-square overflow-hidden rounded-[14px] bg-[#1a1714]/[0.05]"
                >
                  <img
                    src={m.image_url}
                    alt={t('guest.moments.photoAlt')}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                  />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        );
      })()}

      {/* === Lightbox === */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setPreview(null)}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1a1714]/92 p-4 backdrop-blur-md"
          >
            <motion.img
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              src={preview}
              alt={t('guest.moments.photoAlt')}
              className="max-h-[80vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              aria-label="Close"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
