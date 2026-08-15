import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useWeddingMoments,
  useDeleteMoment,
  useToggleMomentApproval,
  useRsvps,
} from '@/hooks/useWeddingMoments';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MomentsManager({ hallId }: { hallId: string }) {
  const { data: moments } = useWeddingMoments(hallId);
  const { data: rsvps } = useRsvps(hallId);
  const remove = useDeleteMoment(hallId);
  const toggle = useToggleMomentApproval(hallId);
  const [tab, setTab] = useState('photos');

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="glass mb-4">
        <TabsTrigger value="photos">Súwretler ({moments?.length ?? 0})</TabsTrigger>
        <TabsTrigger value="rsvp">RSVP ({rsvps?.length ?? 0})</TabsTrigger>
      </TabsList>

      <TabsContent value="photos">
        {(!moments || moments.length === 0) && (
          <p className="text-sm text-muted-foreground">Álle házirge shekem mehmanlar súwret júklemegen.</p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {moments?.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="overflow-hidden rounded-2xl border bg-card shadow-sm"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img src={m.image_url} alt={m.caption ?? ''} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="space-y-2 p-2">
                <p className="truncate text-xs font-medium">{m.guest_name || 'Anonim mehman'}</p>
                <p className="text-[10px] text-muted-foreground">
                  {m.table_number ? `Stol № ${m.table_number} · ` : ''}
                  {new Date(m.created_at).toLocaleString('en-GB')}
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={m.approved ? 'secondary' : 'default'}
                    className="h-7 flex-1 text-[11px]"
                    onClick={() => toggle.mutate({ id: m.id, approved: !m.approved })}
                  >
                    {m.approved ? <><X className="mr-1 h-3 w-3" /> Jasırıw</> : <><Check className="mr-1 h-3 w-3" /> Kórsetiw</>}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={async () => {
                      if (!confirm('Óshiriwdi tastıyıqlaysızba?')) return;
                      await remove.mutateAsync(m);
                      toast.success('Súwret óshirildi');
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="rsvp">
        {(!rsvps || rsvps.length === 0) && <p className="text-sm text-muted-foreground">Házirshe juwaplar joq.</p>}
        <div className="space-y-2">
          {rsvps?.map((r) => (
            <div key={r.id} className="flex items-start justify-between rounded-2xl border bg-card p-3">
              <div>
                <p className="text-sm font-semibold">{r.guest_name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.attending ? 'Qatnasadı' : 'Qatnasa almaydı'} · {r.guests_count} mehman
                  {r.phone ? ` · ${r.phone}` : ''}
                  {r.table_number ? ` · Stol № ${r.table_number}` : ''}
                </p>
                {r.message && <p className="mt-1 text-xs italic text-muted-foreground">"{r.message}"</p>}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString('en-GB')}
              </span>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
