import { useRef, useState } from 'react';
import { Music2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadHallAsset, deleteHallAsset, useUpdateHallMusic } from '@/hooks/useHallData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/LanguageContext';

interface Props {
  hallId: string;
}

const MAX_SIZE = 12 * 1024 * 1024; // 12 MB
const ALLOWED_EXT = ['mp3', 'aac', 'ogg', 'm4a', 'wav'];

function isAudioFile(file: File): boolean {
  if (file.type && file.type.startsWith('audio/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED_EXT.includes(ext);
}

export default function MusicManager({ hallId }: Props) {
  const { t } = useTranslation();
  const { data: hall, isLoading } = useQuery({
    queryKey: ['hall', hallId],
    queryFn: async () => {
      const { data, error } = await supabase.from('wedding_halls').select('*').eq('id', hallId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!hallId,
  });

  const updateMusic = useUpdateHallMusic(hallId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');

  const currentUrl: string | null = (hall as any)?.music_url ?? null;
  const currentTitle: string = (hall as any)?.music_title ?? '';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAudioFile(file)) {
      toast.error(t('message.musicType'));
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error(t('message.musicTooLarge'));
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const url = await uploadHallAsset(file, hallId);
      const name = title.trim() || file.name.replace(/\.[^.]+$/, '');
      await updateMusic.mutateAsync({ url, title: name });
      toast.success(t('message.musicSaved'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      toast.error(`${t('message.musicUploadError')}${msg ? `: ${msg}` : ''}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Update just the title of an already-saved track (keeps the url intact).
  const handleTitleBlur = async () => {
    if (!currentUrl) return;
    const next = title.trim() || currentTitle || 'Audio';
    if (next === currentTitle) return;
    try {
      await updateMusic.mutateAsync({ url: currentUrl, title: next });
      toast.success(t('message.musicSaved'));
    } catch {
      toast.error(t('message.musicUploadError'));
    }
  };

  const handleRemove = async () => {
    if (!confirm(t('message.musicDeleteConfirm'))) return;
    try {
      await deleteHallAsset(currentUrl, hallId);
      await updateMusic.mutateAsync({ url: null });
      setTitle('');
      toast.success(t('message.musicDeleted'));
    } catch {
      toast.error(t('message.musicDeleteError'));
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>;
  }

  return (
    <div className="max-w-md space-y-5">
      <div>
        <h3 className="text-xl font-bold font-serif mb-1">{t('message.musicHeading')}</h3>
        <p className="text-sm text-muted-foreground">{t('message.musicDesc')}</p>
      </div>

      {currentUrl ? (
        <div className="rounded-2xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <Music2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <input
                value={title}
                placeholder={currentTitle || 'Audio'}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                className="w-full bg-transparent text-sm font-medium outline-none truncate"
              />
              <p className="text-[11px] text-muted-foreground">{t('message.musicActive')}</p>
            </div>
          </div>

          <audio controls src={currentUrl} className="w-full rounded-xl" style={{ height: '40px' }} />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {uploading ? t('common.loading') : t('message.musicReplace')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={updateMusic.isPending}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-10 cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Music2 className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{t('message.musicUpload')}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">MP3 · AAC · OGG · WAV · maks 12 MB</p>
          </div>
          <input
            value={title}
            placeholder={t('message.musicLabel')}
            onChange={(e) => setTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 h-9 w-56 rounded-md border border-muted-foreground/25 bg-white px-3 text-sm outline-none focus:border-primary/50"
          />
          {uploading && <p className="text-xs text-primary">{t('common.loading')}</p>}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
