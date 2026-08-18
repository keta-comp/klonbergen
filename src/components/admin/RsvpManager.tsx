/**
 * Vowly RSVP Manager
 * ------------------
 * Lists the RSVP responses collected for the CURRENT (active) wedding and lets
 * the admin delete individual replies. Scoped to the active wedding via
 * `wedding_id` so it always reflects today's wedding, not historical ones.
 *
 * Design: same ivory/white/charcoal/olive language as the rest of the panel.
 */
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Trash2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveWedding } from "@/hooks/useWeddings";
import { useRsvps } from "@/hooks/useWeddingMoments";
import { toast } from "sonner";
import { useTranslation } from '@/i18n/LanguageContext';

interface Props {
  hallId: string;
}

export default function RsvpManager({ hallId }: Props) {
  const qc = useQueryClient();
  const { data: active } = useActiveWedding(hallId);
  const { t } = useTranslation();
  const { data: rsvps, isLoading } = useRsvps(hallId, active?.id ?? null);

  const remove = async (id: string) => {
    const { error } = await supabase.from("rsvps").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('admin.rsvp.deleted'));
    qc.invalidateQueries({ queryKey: ["rsvps", hallId] });
  };

  const totalGuests = (rsvps ?? []).reduce((acc, r) => acc + ((r as { guests_count?: number }).guests_count ?? 1), 0);
  const coming = (rsvps ?? []).filter((r) => (r as { attending?: boolean }).attending).length;

  return (
    <div className="mx-auto max-w-[860px] space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            className="font-display text-[26px] text-neutral-900"
            style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif', fontWeight: 500 }}
          >
            {t('admin.rsvp.title')}
          </h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">{t('admin.rsvp.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-right shadow-sm">
            <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">{t('admin.notif.attending')}</div>
            <div className="text-[18px] font-medium text-neutral-900">{coming}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-right shadow-sm">
            <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">{t('admin.rsvp.totalGuests')}</div>
            <div className="text-[18px] font-medium text-neutral-900">{totalGuests}</div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-[13px] text-neutral-500">{t('admin.rsvp.loading')}</div>
        ) : !rsvps || rsvps.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-neutral-500">{t('admin.rsvp.empty')}</div>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] uppercase tracking-[0.14em] text-neutral-400">
              <tr>
                <th className="px-4 py-3">{t('admin.rsvp.colGuest')}</th>
                <th className="px-4 py-3">{t('admin.rsvp.colStatus')}</th>
                <th className="px-4 py-3 text-right">{t('admin.rsvp.colCount')}</th>
                <th className="px-4 py-3">{t('admin.rsvp.colTable')}</th>
                <th className="px-4 py-3">{t('admin.rsvp.colMessage')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rsvps.map((r) => {
                const row = r as {
                  id: string;
                  guest_name: string;
                  attending?: boolean;
                  guests_count?: number;
                  table_number?: string | null;
                  message?: string | null;
                };
                return (
                  <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-neutral-900">{row.guest_name}</td>
                    <td className="px-4 py-3">
                      {row.attending ? (
                        <span className="inline-flex items-center gap-1 text-[12.5px] text-[#3a4530]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {t('admin.notif.attending')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12.5px] text-neutral-500">
                          <XCircle className="h-3.5 w-3.5" /> {t('admin.notif.notAttending')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.guests_count ?? 1}</td>
                    <td className="px-4 py-3 text-neutral-600">{row.table_number || "—"}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-neutral-500">{row.message || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => remove(row.id)}
                        aria-label="O'chirish"
                        className="grid h-8 w-8 place-items-center rounded-md border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
