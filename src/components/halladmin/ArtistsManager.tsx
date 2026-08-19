import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useArtists, useMutateArtist, uploadHallAsset, deleteHallAsset } from '@/hooks/useHallData';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Clock, Upload, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props { hallId: string; }
type Artist = Tables<'artists'>;

// Artist photos: keep the ORIGINAL aspect ratio — never force 1:1 or 16:9 crop.
// We store the raw File bytes (no canvas re-encode) so EXIF orientation is
// preserved by the browser and portrait photos never get rotated.
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

function isAcceptedFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (ACCEPTED_TYPES.includes(type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext ? ACCEPTED_EXT.includes(ext) : false;
}

export default function ArtistsManager({ hallId }: Props) {
  const { data: items, isLoading } = useArtists(hallId);
  const { create, update, remove } = useMutateArtist(hallId);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Artist | null>(null);
  const [form, setForm] = useState({ name: '', performance_time: '', description: '', image_url: '' });
  const [uploading, setUploading] = useState(false);

  // Object URL for a freshly selected local file (instant preview before upload).
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  // Centralised setter that revokes the previous object URL to avoid leaks.
  const setPreview = (url: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreviewUrl(url);
  };

  // Revoke any lingering object URL on unmount.
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  const resetForm = () => {
    setForm({ name: '', performance_time: '', description: '', image_url: '' });
    setPreview(null);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditItem(null);
    resetForm();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    if (!isAcceptedFile(file)) {
      toast.error(t('admin.artists.unsupportedFormat'));
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error(t('admin.artists.fileTooLarge'));
      return;
    }

    // Show the original image immediately (natural aspect ratio, no crop).
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadHallAsset(file, hallId);
      setForm(f => ({ ...f, image_url: url }));
    } catch (err: unknown) {
      // On upload failure: keep the previous image (edit) or none (new) so the
      // artist record is never left in a broken state.
      setPreview(null);
      setForm(f => ({ ...f, image_url: editItem?.image_url ?? '' }));
      toast.error(err instanceof Error ? err.message : t('admin.artists.imgError'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setForm(f => ({ ...f, image_url: '' })); // '' => null on save (image removed)
  };

  const handleSave = async () => {
    const newImageUrl = form.image_url || null;
    const payload = {
      name: form.name,
      performance_time: form.performance_time || undefined,
      description: form.description || undefined,
      image_url: newImageUrl,
    };
    try {
      if (editItem) {
        await update.mutateAsync({ id: editItem.id, ...payload });
        // Best-effort cleanup of the previously stored image when it changed/removed.
        if (editItem.image_url && editItem.image_url !== newImageUrl) {
          await deleteHallAsset(editItem.image_url, hallId);
        }
        toast.success(t('admin.artists.updated'));
      } else {
        await create.mutateAsync(payload);
        toast.success(t('admin.artists.added'));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('admin.artists.saveError'));
      return;
    }
    closeDialog();
  };

  const handleEdit = (item: Artist) => {
    setEditItem(item);
    setForm({
      name: item.name,
      performance_time: item.performance_time ?? '',
      description: item.description ?? '',
      image_url: item.image_url ?? '',
    });
    setPreview(null);
    setOpen(true);
  };

  // Preview shows the freshly selected local file, otherwise the stored URL.
  const displaySrc = previewUrl ?? (form.image_url || null);

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const anim = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold font-serif sm:text-xl">{t('admin.artists.heading')}</h3>
        <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gold-gradient text-primary-foreground"><Plus className="mr-1 h-4 w-4" /> {t('admin.artists.add')}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="font-serif">{editItem ? t('admin.artists.editTitle') : t('admin.artists.newTitle')}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder={t('admin.artists.namePh')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <Input placeholder={t('admin.artists.timePh')} value={form.performance_time} onChange={e => setForm(f => ({ ...f, performance_time: e.target.value }))} />
              <Textarea placeholder={t('admin.artists.descPh')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

              {/* Artist image upload */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t('admin.artists.imageLabel')}</label>
                {displaySrc ? (
                  <div className="space-y-2">
                    <div className="relative flex max-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-muted/30 p-2">
                      <img
                        src={displaySrc}
                        alt="Artist preview"
                        className="max-h-[300px] w-auto max-w-full rounded-lg object-contain"
                      />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-sm font-medium text-white">
                          {t('admin.artists.uploading')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 flex-1 sm:h-9"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                      >
                        <RefreshCw className="mr-1.5 h-4 w-4" /> {t('admin.artists.replaceImage')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 flex-1 text-destructive sm:h-9"
                        onClick={handleRemove}
                        disabled={uploading}
                      >
                        <X className="mr-1.5 h-4 w-4" /> {t('admin.artists.removeImage')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 p-6 text-muted-foreground transition-colors hover:border-primary/50"
                  >
                    <div className="rounded-full bg-muted p-3"><Upload className="h-6 w-6" /></div>
                    <span className="text-sm font-medium">{uploading ? t('admin.artists.uploading') : t('admin.artists.selectImage')}</span>
                    <span className="text-xs">{t('admin.artists.formatHint')}</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <Button onClick={handleSave} disabled={!form.name || uploading} className="w-full gold-gradient text-primary-foreground">
                {t('admin.artists.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map(item => (
          <motion.div key={item.id} variants={anim}>
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="truncate font-semibold">{item.name}</h4>
                    {item.performance_time && <p className="flex items-center gap-1 text-sm text-primary"><Clock className="h-3 w-3" />{item.performance_time}</p>}
                    {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => handleEdit(item)}><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => { remove.mutateAsync(item.id); toast.success(t('admin.artists.deleted')); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
