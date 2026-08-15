import { useState } from 'react';
import { motion } from 'framer-motion';
import { useArtists, useMutateArtist } from '@/hooks/useHallData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Props { hallId: string; }

export default function ArtistsManager({ hallId }: Props) {
  const { data: items, isLoading } = useArtists(hallId);
  const { create, update, remove } = useMutateArtist(hallId);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', performance_time: '', description: '' });

  const resetForm = () => setForm({ name: '', performance_time: '', description: '' });

  const handleSave = async () => {
    const payload = { name: form.name, performance_time: form.performance_time || undefined, description: form.description || undefined };
    if (editItem) {
      await update.mutateAsync({ id: editItem.id, ...payload });
      toast.success("Artist jańalandı!");
    } else {
      await create.mutateAsync(payload);
      toast.success("Artist qosıldı!");
    }
    resetForm(); setEditItem(null); setOpen(false);
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name, performance_time: item.performance_time ?? '', description: item.description ?? '' });
    setOpen(true);
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const anim = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold font-serif">Artistler</h3>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditItem(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="gold-gradient text-primary-foreground"><Plus className="mr-1 h-4 w-4" /> Qosıw</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">{editItem ? "Artist o'zgertiw" : "Jańa artist qosıw"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Artist atı" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <Input placeholder="Oynaw waqtı (msl: 20:00 - 21:00)" value={form.performance_time} onChange={e => setForm(f => ({ ...f, performance_time: e.target.value }))} />
              <Textarea placeholder="Táriyipleme" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <Button onClick={handleSave} disabled={!form.name} className="w-full gold-gradient text-primary-foreground">Saqlaw</Button>
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
                  <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    {item.performance_time && <p className="flex items-center gap-1 text-sm text-primary"><Clock className="h-3 w-3" />{item.performance_time}</p>}
                    {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)}><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { remove.mutateAsync(item.id); toast.success("Artist oshirildi!"); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
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
