import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFoodItems, useMutateFood } from '@/hooks/useHallData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props { hallId: string; }

export default function FoodMenuManager({ hallId }: Props) {
  const { data: items, isLoading } = useFoodItems(hallId);
  const { create, update, remove } = useMutateFood(hallId);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', is_today: true });

  const resetForm = () => setForm({ name: '', price: '', description: '', is_today: true });

  const handleSave = async () => {
    const payload = { name: form.name, price: form.price ? parseFloat(form.price) : undefined, description: form.description || undefined, is_today: form.is_today };
    if (editItem) {
      await update.mutateAsync({ id: editItem.id, ...payload });
      toast.success("Ta'm jańalandı!");
    } else {
      await create.mutateAsync(payload);
      toast.success("Ta'm qosıldı!");
    }
    resetForm();
    setEditItem(null);
    setOpen(false);
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name, price: item.price?.toString() ?? '', description: item.description ?? '', is_today: item.is_today ?? true });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await remove.mutateAsync(id);
    toast.success("Ta'm oshirildi!");
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const anim = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold font-serif">Búgingi ta'mlar</h3>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditItem(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="gold-gradient text-primary-foreground"><Plus className="mr-1 h-4 w-4" /> Qosıw</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-serif">{editItem ? "Ta'm o'zgertiw" : "Jańa ta'm qosıw"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Ta'm atı" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <Input placeholder="Bahası" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              <Textarea placeholder="Táriyipleme" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <div className="flex items-center gap-2">
                <Switch checked={form.is_today} onCheckedChange={v => setForm(f => ({ ...f, is_today: v }))} />
                <span className="text-sm">Búgingi ta'm</span>
              </div>
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
                    {item.price && <p className="text-sm text-primary font-medium">{Number(item.price).toLocaleString()} so'm</p>}
                    {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${item.is_today ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {item.is_today ? 'Búgingi' : 'Arxiv'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)}><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
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
