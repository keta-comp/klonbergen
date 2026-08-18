/**
 * PlanFormModal — create / edit a subscription plan (Super Admin only).
 * Fields: code (unique), name, price (UZS), period_days, description, is_active, display_order.
 */
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { useUpsertPlan, type Plan } from '@/hooks/useAdminData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Props {
  plan?: Plan | null;
  onClose: () => void;
}

export default function PlanFormModal({ plan, onClose }: Props) {
  const { t } = useTranslation();
  const upsert = useUpsertPlan();
  const isEdit = !!plan;
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [periodDays, setPeriodDays] = useState('30');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('0');

  useEffect(() => {
    if (plan) {
      setCode(plan.code);
      setName(plan.name);
      setPrice(String(Number(plan.price)));
      setPeriodDays(String(plan.period_days));
      setDescription(plan.description ?? '');
      setIsActive(plan.is_active);
      setDisplayOrder(String(plan.display_order ?? 0));
    }
  }, [plan]);

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error(t('superadmin.plans.code_required'));
      return;
    }
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error(t('superadmin.plans.price_invalid'));
      return;
    }
    setSaving(true);
    try {
      await upsert.mutateAsync({
        id: plan?.id,
        code: code.trim(),
        name: name.trim(),
        price: priceNum,
        period_days: Number(periodDays) || 30,
        description: description.trim() || null,
        is_active: isActive,
        display_order: Number(displayOrder) || 0,
      });
      toast.success(isEdit ? t('superadmin.plans.saved_edit') : t('superadmin.plans.saved_create'));
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('superadmin.errorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:max-w-lg sm:rounded-2xl sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 flex-shrink-0 rounded-full bg-neutral-300 sm:hidden" />
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-neutral-900">
            {isEdit ? t('superadmin.plans.edit_title') : t('superadmin.plans.create_title')}
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
          <Field label={t('superadmin.plans.f_code')} required>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('superadmin.plans.code_ph')}
              disabled={isEdit}
            />
            {isEdit && <p className="mt-1 text-[11px] text-neutral-400">{t('superadmin.plans.code_locked')}</p>}
          </Field>

          <Field label={t('superadmin.plans.f_name')} required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('superadmin.plans.name_ph')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('superadmin.plans.f_price')} required>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="99000" />
            </Field>
            <Field label={t('superadmin.plans.f_period')}>
              <Input type="number" value={periodDays} onChange={(e) => setPeriodDays(e.target.value)} placeholder="30" />
            </Field>
          </div>

          <Field label={t('superadmin.plans.f_description')}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-[13.5px] outline-none focus:border-[#3a4530]"
              placeholder="..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('superadmin.plans.f_order')}>
              <Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} placeholder="0" />
            </Field>
            <div className="flex items-end pb-1">
              <label className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5">
                <span className="text-[12.5px] font-medium text-neutral-700">{t('superadmin.plans.f_active')}</span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-[#3a4530]"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-neutral-100 px-5 py-4">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t('superadmin.plans.cancel')}
          </Button>
          <Button
            className="bg-[#3a4530] text-white hover:bg-[#2f3827]"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t('superadmin.plans.saving') : t('superadmin.plans.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-neutral-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
