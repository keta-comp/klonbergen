/**
 * PaymentConfirmModal — confirm a payment and extend the subscription.
 * Uses the confirm_subscription_payment RPC (atomic: new subscription, payment row, activity log).
 */
import { useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { usePlans, useConfirmPayment, useHallSubscription } from '@/hooks/useAdminData';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDate, formatPrice } from '@/lib/subscription';
import type { Tables } from '@/integrations/supabase/types';

type Hall = Tables<'wedding_halls'>;

interface Props {
  hall: Hall;
  onClose: () => void;
}

export default function PaymentConfirmModal({ hall, onClose }: Props) {
  const { t } = useTranslation();
  const { data: plans = [] } = usePlans();
  const { data: sub } = useHallSubscription(hall.id);
  const confirm = useConfirmPayment();
  const [planId, setPlanId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Default to the hall's current plan, or first plan
  if (!planId) {
    if (sub?.plan_id) setPlanId(sub.plan_id);
    else if (plans[0]) setPlanId(plans[0].id);
  }

  const selectedPlan = plans.find((p) => p.id === planId);
  const today = new Date();

  const handleConfirm = async () => {
    if (!planId) return;
    setSubmitting(true);
    try {
      await confirm.mutateAsync({ hallId: hall.id, planId });
      toast.success("To'lov qabul qilindi");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:max-w-md sm:rounded-2xl sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 flex-shrink-0 rounded-full bg-neutral-300 sm:hidden" />
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900">
            <CreditCard className="h-4 w-4" />
            {t('superadmin.halls.pay_modal.title')}
          </h2>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <Row label={t('superadmin.halls.pay_modal.toyxona')} value={hall.name} />

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-neutral-700">
              {t('superadmin.halls.pay_modal.tarif')}
            </label>
            <div className="space-y-1.5">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanId(p.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    planId === p.id
                      ? 'border-[#3a4530] bg-[#3a4530]/5'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
                        planId === p.id ? 'border-[#3a4530] bg-[#3a4530]' : 'border-neutral-300'
                      }`}
                    >
                      {planId === p.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-[13.5px] font-medium text-neutral-800">{p.name}</span>
                  </span>
                  <span className="text-[12.5px] text-neutral-500">
                    {formatPrice(Number(p.price))} {t('superadmin.plans.per_month')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Row label={t('superadmin.halls.pay_modal.summa')} value={selectedPlan ? `${formatPrice(Number(selectedPlan.price))} so'm` : '—'} />
          <Row label={t('superadmin.halls.pay_modal.sana')} value={formatDate(today)} />
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-neutral-100 px-5 py-4">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t('superadmin.halls.pay_modal.cancel')}
          </Button>
          <Button
            className="bg-[#3a4530] text-white hover:bg-[#2f3827]"
            onClick={handleConfirm}
            disabled={submitting || !planId}
          >
            {submitting ? t('superadmin.halls.pay_modal.confirming') : t('superadmin.halls.pay_modal.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-800">{value}</span>
    </div>
  );
}
