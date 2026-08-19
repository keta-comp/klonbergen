import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useFoodItems, useMutateFood, uploadHallAsset } from '@/hooks/useHallData';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';
import { formatNumber } from '@/i18n/format';

interface Props { hallId: string; }
type FoodItem = Tables<'food_items'>;

export default function FoodMenuManager({ hallId }: Props) {
  const { data: items, isLoading } = useFoodItems(hallId);
  const { create, update, remove } = useMutateFood(hallId);
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | null>(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', is_today: true, image_url: '' });
  const [imgUploading, setImgUploading] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  const resetForm = () => setForm({ name: '', price: '', description: '', is_today: true, image_url: '' });

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    try {
      const url = await uploadHallAsset(file, hallId);
      setForm(f => ({ ...f, image_url: url }));
      toast.success(t('admin.menu.imgUploaded'));
    } catch {
      toast.error(t('admin.menu.imgError'));
    } finally {
      setImgUploading(false);
      if (imgRef.current) imgRef.current.value = '';
    }
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      price: form.price ? parseFloat(form.price) : undefined,
      description: form.description || undefined,
      is_today: form.is_today,
      image_url: form.image_url || null,
    };
    if (editItem) {
      await update.mutateAsync({ id: editItem.id, ...payload });
      toast.success(t('admin.menu.updated'));
    } else {
      await create.mutateAsync(payload);
      toast.success(t('admin.menu.added'));
    }
    resetForm();
    setEditItem(null);
    setOpen(false);
  };

  const handleEdit = (item: FoodItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      price: item.price?.toString() ?? '',
      description: item.description ?? '',
      is_today: item.is_today ?? true,
      image_url: (item as any).image_url ?? '',
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await remove.mutateAsync(id);
    toast.success(t('admin.menu.deleted'));
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const anim = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold font-serif sm:text-xl">{t('admin.menu.heading')}</h3>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditItem(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="gold-gradient text-primary-foreground"><Plus className="mr-1 h-4 w-4" /> {t('admin.menu.add')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">{editItem ? t('admin.menu.editTitle') : t('admin.menu.newTitle')}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder={t('admin.menu.namePh')} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <Input placeholder={t('admin.menu.pricePh')} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              <Textarea placeholder={t('admin.menu.descPh')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

              {/* Image upload */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">{t('admin.menu.imgOptional')}</p>
                {form.image_url ? (
                  <div className="relative inline-block">
                    <img src={form.image_url} alt="preview" className="h-20 w-20 rounded-xl object-cover border" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                      className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-destructive text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imgRef.current?.click()}
                    disabled={imgUploading}
                    className="flex items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 px-4 py-3 text-sm text-muted-foreground hover:border-primary/40 transition-colors"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {imgUploading ? t('admin.menu.uploading') : t('admin.menu.imgBtn')}
                  </button>
                )}
                <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImgUpload} />
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={form.is_today} onCheckedChange={v => setForm(f => ({ ...f, is_today: v }))} />
                <span className="text-sm">{t('admin.menu.todayLabel')}</span>
              </div>
              <Button onClick={handleSave} disabled={!form.name || imgUploading} className="w-full gold-gradient text-primary-foreground">{t('admin.menu.save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map(item => (
          <motion.div key={item.id} variants={anim}>
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {(item as any).image_url && (
                    <img src={(item as any).image_url} alt={item.name} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <h4 className="font-semibold truncate">{item.name}</h4>
                        {item.price && <p className="text-sm text-primary font-medium">{formatNumber(locale, Number(item.price))} {t('admin.menu.currency')}</p>}
                        {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${item.is_today ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {item.is_today ? t('admin.menu.today') : t('admin.menu.archived')}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => handleEdit(item)}><Edit2 className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    </div>
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
