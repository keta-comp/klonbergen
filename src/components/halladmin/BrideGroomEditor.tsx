import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useBrideGroom, useMutateBrideGroom, uploadHallAsset } from '@/hooks/useHallData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import ImageCropDialog from '@/components/common/ImageCropDialog';

interface Props { hallId: string; }

function PhotoUpload({ label, currentUrl, onUpload, hallId }: { label: string; currentUrl: string; onUpload: (url: string) => void; hallId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = await uploadHallAsset(file, hallId);
      onUpload(url);
      toast.success("Suwret júklendi!");
    } catch {
      toast.error("Suwret júklenwde qátelik!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-primary/30 bg-muted/30 transition-colors hover:border-primary/60"
      >
        {currentUrl ? (
          <>
            <img src={currentUrl} alt={label} className="h-full w-full object-cover" />
            <button
              onClick={e => { e.stopPropagation(); onUpload(''); }}
              className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <span className="text-sm">{uploading ? 'Júkleniwde...' : 'Suwret júklew'}</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {cropSrc && (
        <ImageCropDialog
          open
          imageSrc={cropSrc}
          aspect={1}
          onClose={() => setCropSrc(null)}
          onComplete={handleCropped}
        />
      )}
    </div>
  );
}

export default function BrideGroomEditor({ hallId }: Props) {
  const { data } = useBrideGroom(hallId);
  const mutation = useMutateBrideGroom(hallId);
  const [form, setForm] = useState({ bride_name: '', groom_name: '', bride_photo: '', groom_photo: '', love_story: '', wedding_date: '' });

  useEffect(() => {
    if (data) {
      setForm({
        bride_name: data.bride_name,
        groom_name: data.groom_name,
        bride_photo: data.bride_photo ?? '',
        groom_photo: data.groom_photo ?? '',
        love_story: data.love_story ?? '',
        wedding_date: data.wedding_date ?? '',
      });
    }
  }, [data]);

  const handleSave = async () => {
    await mutation.mutateAsync({ ...form, id: data?.id });
    toast.success("Kelin-kuyew mag'lıwmatları saqlandı!");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif"><Heart className="h-5 w-5 text-primary" /> Kelin ha'm kuyew</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Kelin atı</label>
              <Input value={form.bride_name} onChange={e => setForm(f => ({ ...f, bride_name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kuyew atı</label>
              <Input value={form.groom_name} onChange={e => setForm(f => ({ ...f, groom_name: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PhotoUpload label="Kelin suwreti" currentUrl={form.bride_photo} hallId={hallId} onUpload={url => setForm(f => ({ ...f, bride_photo: url }))} />
            <PhotoUpload label="Kuyew suwreti" currentUrl={form.groom_photo} hallId={hallId} onUpload={url => setForm(f => ({ ...f, groom_photo: url }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Toy kúni</label>
            <Input type="date" value={form.wedding_date} onChange={e => setForm(f => ({ ...f, wedding_date: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Gáp-hikáyat</label>
            <Textarea rows={4} value={form.love_story} onChange={e => setForm(f => ({ ...f, love_story: e.target.value }))} placeholder="Sizdiń muhabbat hikáyańız..." />
          </div>
          <Button onClick={handleSave} disabled={!form.bride_name || !form.groom_name || mutation.isPending} className="gold-gradient text-primary-foreground">
            {mutation.isPending ? 'Saqlanıwda...' : 'Saqlaw'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
