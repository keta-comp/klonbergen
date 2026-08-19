import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useBanners, useMutateBanner, useBrideGroom, uploadHallAsset } from '@/hooks/useHallData';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Image, Upload, Crop, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';
import { formatDate } from '@/i18n/format';
import ImageCropDialog from '@/components/common/ImageCropDialog';

interface Props { hallId: string; }
type Banner = Tables<'banners'>;

export default function BannersManager({ hallId }: Props) {
  const { data: items, isLoading } = useBanners(hallId);
  const { data: brideGroom } = useBrideGroom(hallId);
  const { create, update, remove } = useMutateBanner(hallId);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: '', image_url: '' });
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { t, locale } = useTranslation();

  const resetForm = () => setForm({ title: '', image_url: '' });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropped = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      const file = new File([blob], `banner_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = await uploadHallAsset(file, hallId);
      setForm(f => ({ ...f, image_url: url }));
      toast.success(t('admin.banners.imgUploaded'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('admin.banners.imgError'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const nextOrder = items?.length ?? 0;
    const payload = { title: form.title || undefined, image_url: form.image_url, sort_order: editItem ? editItem.sort_order : nextOrder };
    if (editItem) {
      await update.mutateAsync({ id: editItem.id, ...payload });
      toast.success(t('admin.banners.updated'));
    } else {
      await create.mutateAsync(payload);
      toast.success(t('admin.banners.added'));
    }
    resetForm(); setEditItem(null); setOpen(false);
  };

  const handleEdit = (item: Banner) => {
    setEditItem(item);
    setForm({ title: item.title ?? '', image_url: item.image_url });
    setOpen(true);
  };

  const coupleName = brideGroom
    ? `${brideGroom.groom_name} & ${brideGroom.bride_name}`
    : null;

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const anim = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-6">
      {/* Couple info banner */}
      {coupleName && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center"
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t('admin.banners.coupleLabel')}</p>
          <h3 className="text-lg font-bold font-serif text-primary sm:text-xl">{coupleName}</h3>
          {brideGroom?.wedding_date && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('admin.banners.weddingDate')}: {formatDate(locale, brideGroom.wedding_date)}
            </p>
          )}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold font-serif sm:text-xl">{t('admin.banners.heading')}</h3>
          <p className="text-sm text-muted-foreground">{t('admin.banners.subtitle')}</p>
        </div>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditItem(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="gold-gradient text-primary-foreground"><Plus className="mr-1 h-4 w-4" /> {t('admin.banners.add')}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">{editItem ? t('admin.banners.editTitle') : t('admin.banners.newTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t('admin.banners.titleLabel')}</label>
                <Input placeholder={t('admin.banners.titlePh')} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t('admin.banners.imageLabel')}</label>
                <div
                  onClick={() => !form.image_url && fileRef.current?.click()}
                  className={`relative flex min-h-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                    form.image_url ? 'border-primary/30' : 'border-muted-foreground/30 hover:border-primary/50'
                  }`}
                >
                  {form.image_url ? (
                    <>
                      <img src={form.image_url} alt="Preview" className="h-full w-full rounded-lg object-cover" style={{ aspectRatio: '9/16' }} />
                      <div className="absolute bottom-2 right-2 flex gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={e => { e.stopPropagation(); setCropSrc(form.image_url); }}
                          className="h-8 shadow-md"
                        >
                          <Crop className="mr-1 h-3.5 w-3.5" /> {t('admin.banners.crop')}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                          className="h-8 shadow-md"
                        >
                          <Upload className="mr-1 h-3.5 w-3.5" /> {t('admin.banners.replace')}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 p-8 text-muted-foreground">
                      <div className="rounded-full bg-muted p-4">
                        <Upload className="h-8 w-8" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{uploading ? t('admin.banners.uploading') : t('admin.banners.upload')}</p>
                        <p className="text-xs mt-1">{t('admin.banners.formatHint')}</p>
                      </div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </div>
              <Button onClick={handleSave} disabled={!form.image_url || uploading} className="w-full gold-gradient text-primary-foreground">
                {editItem ? t('admin.banners.saveEdit') : t('admin.banners.saveNew')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banner grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((item, idx) => (
          <motion.div key={item.id} variants={anim}>
            <Card className="glass overflow-hidden group">
              <div className="relative aspect-video">
                <img src={item.image_url} alt={item.title || 'Banner'} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="icon" className="h-11 w-11 shadow-md sm:h-8 sm:w-8" onClick={() => handleEdit(item)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" className="h-11 w-11 shadow-md sm:h-8 sm:w-8" onClick={() => { remove.mutateAsync(item.id); toast.success(t('admin.banners.deleted')); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {item.title && (
                <CardContent className="p-3">
                  <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty state */}
      {(!items || items.length === 0) && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 p-16 text-center"
        >
          <div className="rounded-full bg-muted p-4 mb-4">
            <Image className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <p className="font-medium text-muted-foreground mb-1">{t('admin.banners.emptyTitle')}</p>
          <p className="text-sm text-muted-foreground/70">{t('admin.banners.emptyDesc')}</p>
        </motion.div>
      )}

      {/* Crop dialog */}
      {cropSrc && (
        <ImageCropDialog
          open
          imageSrc={cropSrc}
          aspect={9 / 16}
          onClose={() => setCropSrc(null)}
          onComplete={handleCropped}
        />
      )}
    </div>
  );
}
