import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTimelineEvents, useMutateTimeline } from '@/hooks/useHallData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Props { hallId: string; }

const EMPTY = { title: '', description: '', icon: '', start_time: '', end_time: '' };

const PRESET = [
  { start_time: '18:00', title: 'Mıymanlardı kútip alıw', icon: '🤝' },
  { start_time: '18:30', title: 'Kelin-kúyew kirisi', icon: '💍' },
  { start_time: '19:00', title: 'Birinshi biy', icon: '💃' },
  { start_time: '19:30', title: 'Kesheki as', icon: '🍽️' },
  { start_time: '20:30', title: 'Tort máresimi', icon: '🎂' },
  { start_time: '21:00', title: 'Kóńil ashar', icon: '🎶' },
  { start_time: '22:30', title: 'Juwmaqlanıw', icon: '🌙' },
];

export default function TimelineManager({ hallId }: Props) {
  const { data: items, isLoading } = useTimelineEvents(hallId);
  const { create, update, remove } = useMutateTimeline(hallId);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);

  const handleSave = async () => {
    if (!form.title || !form.start_time) {
      toast.error('Atı hám waqtı kerek');
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
      toast.success('Jańalandı!');
    } else {
      await create.mutateAsync(payload);
      toast.success('Qosıldı!');
    }
    setForm(EMPTY); setEditItem(null); setOpen(false);
  };

  const handleEdit = (item: any) => {
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
    for (const p of PRESET) await create.mutateAsync(p);
    toast.success('Úlgi baǵdarlama qosıldı!');
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-serif font-semibold">Toy baǵdarlaması</h3>
        <div className="flex gap-2">
          {!isLoading && (items?.length ?? 0) === 0 && (
            <Button variant="outline" onClick={loadPreset}>Úlgi baǵdarlama</Button>
          )}
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditItem(null); setForm(EMPTY); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> Qosıw</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? 'Ózgertiw' : 'Jańa ilaj'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Ilaj atı" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Baslanıwı</label>
                    <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Juwmaǵı (erkin)</label>
                    <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                  </div>
                </div>
                <Input placeholder="Emoji (mısalı 🍽️)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
                <Textarea placeholder="Qosımsha maǵlıwmat" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Button className="w-full" onClick={handleSave}>Saqlaw</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Júklenbekte...</p>
      ) : (items?.length ?? 0) === 0 ? (
        <p className="text-muted-foreground">Hesh qanday ilaj qosılmaǵan.</p>
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
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Edit2 className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
