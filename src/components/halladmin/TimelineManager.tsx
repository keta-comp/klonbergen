import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTimelineEvents, useMutateTimeline } from '@/hooks/useHallData';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props { hallId: string; }
type TimelineEvent = Tables<'timeline_events'>;

const EMPTY = { title: '', description: '', icon: '', start_time: '', end_time: '' };

const PRESET = [
  { start_time: '18:00', titleKey: 'greet', icon: '🤝' },
  { start_time: '18:30', titleKey: 'coupleEntry', icon: '💍' },
  { start_time: '19:00', titleKey: 'firstDance', icon: '💃' },
  { start_time: '19:30', titleKey: 'dinner', icon: '🍽️' },
  { start_time: '20:30', titleKey: 'cake', icon: '🎂' },
  { start_time: '21:00', titleKey: 'entertainment', icon: '🎶' },
  { start_time: '22:30', titleKey: 'closing', icon: '🌙' },
];

export default function TimelineManager({ hallId }: Props) {
  const { t } = useTranslation();
  const { data: items, isLoading } = useTimelineEvents(hallId);
  const { create, update, remove } = useMutateTimeline(hallId);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partial<TimelineEvent> | null>(null);
  const [form, setForm] = useState(EMPTY);

  const handleSave = async () => {
    if (!form.title || !form.start_time) {
      toast.error(t('admin.timeline.titleTimeRequired'));
      return;
    }
    const payload = {
      title: form.title,
      description: form.description || null,
      icon: form.icon || null,
      start_time: form.start_time,
      end_time: form.end_time || null,
    };
    if (editItem) {
      await update.mutateAsync({ id: editItem.id, ...payload });
      toast.success(t('admin.timeline.updated'));
    } else {
      await create.mutateAsync(payload);
      toast.success(t('admin.timeline.added'));
    }
    setForm(EMPTY); setEditItem(null); setOpen(false);
  };

  const handleEdit = (item: Partial<TimelineEvent>) => {
    setEditItem(item);
    setForm({
      title: item.title,
      description: item.description ?? '',
      icon: item.icon ?? '',
      start_time: item.start_time?.slice(0, 5) ?? '',
      end_time: item.end_time?.slice(0, 5) ?? '',
    });
    setOpen(true);
  };

  const loadPreset = async () => {
    for (const p of PRESET) await create.mutateAsync({ ...p, title: t(`admin.timeline.presets.${p.titleKey}`) });
    toast.success(t('admin.timeline.presetAdded'));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-serif font-semibold sm:text-xl">{t('admin.timeline.heading')}</h3>
        <div className="flex gap-2">
          {!isLoading && (items?.length ?? 0) === 0 && (
            <Button variant="outline" onClick={loadPreset}>{t('admin.timeline.presetBtn')}</Button>
          )}
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditItem(null); setForm(EMPTY); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> {t('admin.timeline.add')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? t('admin.timeline.editTitle') : t('admin.timeline.newTitle')}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder={t('admin.timeline.titlePh')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">{t('admin.timeline.startLabel')}</label>
                    <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">{t('admin.timeline.endLabel')}</label>
                    <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                  </div>
                </div>
                <Input placeholder={t('admin.timeline.emojiPh')} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
                <Textarea placeholder={t('admin.timeline.descPh')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Button className="w-full" onClick={handleSave}>{t('admin.timeline.save')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t('admin.timeline.loading')}</p>
      ) : (items?.length ?? 0) === 0 ? (
        <p className="text-muted-foreground">{t('admin.timeline.empty')}</p>
      ) : (
        <div className="space-y-2">
          {items!.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
                    {item.icon || <Clock className="h-4 w-4 text-primary" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.start_time.slice(0, 5)}{item.end_time ? ` — ${item.end_time.slice(0, 5)}` : ''}
                      {item.description ? ` · ${item.description}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => handleEdit(item)}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-11 w-11 sm:h-9 sm:w-9" onClick={() => remove.mutate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
