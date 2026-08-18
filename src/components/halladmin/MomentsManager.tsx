import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/LanguageContext';
import { formatDateTime } from '@/i18n/format';
import {
  useWeddingMoments,
  useDeleteMoment,
  useToggleMomentApproval,
  useRsvps,
} from '@/hooks/useWeddingMoments';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MomentsManager({ hallId }: { hallId: string }) {
  const { t, locale } = useTranslation();
  const { data: moments } = useWeddingMoments(hallId);
  const { data: rsvps } = useRsvps(hallId);
  const remove = useDeleteMoment(hallId);
  const toggle = useToggleMomentApproval(hallId);
  const [tab, setTab] = useState('photos');

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="glass mb-4">
        <TabsTrigger value="photos">{t('admin.moments.tabPhotos')} ({moments?.length ?? 0})</TabsTrigger>
        <TabsTrigger value="rsvp">{t('admin.moments.tabRsvp')} ({rsvps?.length ?? 0})</TabsTrigger>
      </TabsList>

      <TabsContent value="photos">
        {(!moments || moments.length === 0) && (
          <p className="text-sm text-muted-foreground">{t('admin.moments.photosEmpty')}</p>
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
                <p className="truncate text-xs font-medium">{m.guest_name || t('admin.moments.anonGuest')}</p>
                <p className="text-[10px] text-muted-foreground">
                  {m.table_number ? `${t('admin.moments.tableNo', { n: m.table_number })} · ` : ''}
                  {formatDateTime(locale, m.created_at)}
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={m.approved ? 'secondary' : 'default'}
                    className="h-7 flex-1 text-[11px]"
                    onClick={() => toggle.mutate({ id: m.id, approved: !m.approved })}
                  >
                    {m.approved ? <><X className="mr-1 h-3 w-3" /> {t('admin.moments.hide')}</> : <><Check className="mr-1 h-3 w-3" /> {t('admin.moments.show')}</>}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={async () => {
                      if (!confirm(t('admin.moments.confirmDelete'))) return;
                      await remove.mutateAsync(m);
                      toast.success(t('admin.moments.deleted'));
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
        {(() => {
          const list = rsvps ?? [];
          const yes = list.filter((r) => r.attending).length;
          const no = list.length - yes;
          const totalGuests = list
            .filter((r) => r.attending)
            .reduce((sum, r) => sum + (r.guests_count ?? 0), 0);
          const tableMap = new Map<string, number>();
          for (const r of list) {
            if (!r.table_number) continue;
            tableMap.set(r.table_number, (tableMap.get(r.table_number) ?? 0) + 1);
          }
          const tableEntries = [...tableMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <SummaryCard label={t('admin.moments.sumAttending')} value={yes} tone="positive" />
                <SummaryCard label={t('admin.moments.sumNotAttending')} value={no} tone="muted" />
                <SummaryCard label={t('admin.moments.sumTotalGuests')} value={totalGuests} tone="primary" />
                <SummaryCard label={t('admin.moments.sumTotalReplies')} value={list.length} tone="muted" />
              </div>

              {tableEntries.length > 0 && (
                <div className="rounded-2xl border bg-card p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.moments.byTables')}</p>
                  <div className="flex flex-wrap gap-2">
                    {tableEntries.map(([table, count]) => (
                      <span key={table} className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs">
                        <span className="font-medium">{t('admin.moments.tableNo', { n: table })}</span>
                        <span className="text-muted-foreground">· {count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('admin.moments.rsvpEmpty')}</p>
              ) : (
                <div className="space-y-2">
                  {list.map((r) => (
                    <div key={r.id} className="rounded-2xl border bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold">{r.guest_name || t('admin.moments.guestFallback')}</p>
                            <span
                              className={
                                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ' +
                                (r.attending
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-muted text-muted-foreground')
                              }
                            >
                              {r.attending ? t('admin.moments.yes') : t('admin.moments.no')}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {r.guests_count ?? 0} {t('admin.moments.guestsUnit')}
                            {r.phone ? ` · ${r.phone}` : ''}
                            {r.table_number ? ` · ${t('admin.moments.tableNo', { n: r.table_number })}` : ''}
                          </p>
                          {r.message && (
                            <p className="mt-1 text-xs italic text-muted-foreground">"{r.message}"</p>
                          )}
                        </div>
                          <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                          {formatDateTime(locale, r.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </TabsContent>
    </Tabs>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'positive' | 'muted' | 'primary' }) {
  const toneClass =
    tone === 'positive'
      ? 'text-emerald-700 dark:text-emerald-300'
      : tone === 'primary'
        ? 'text-primary'
        : 'text-foreground';
  return (
    <div className="rounded-2xl border bg-card p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
