/**
 * AddHallModal — create a new hall + subscription + admin in one go.
 * Steps:
 *  1) insert into wedding_halls (super admin RLS)
 *  2) insert into subscriptions (active, 30 days from now, chosen plan)
 *  3) optional: invoke create-hall-admin Edge Function to create auth user
 *  4) log activity
 */
import { useState } from 'react';
import { X, Plus, RefreshCw, Eye, EyeOff, Upload } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { usePlans, useConfirmPayment } from '@/hooks/useAdminData';
import { useMutateHall } from '@/hooks/useHallData';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/subscription';

interface Props {
  onClose: () => void;
}

const genPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('') + '!7';
};

export default function AddHallModal({ onClose }: Props) {
  const { t } = useTranslation();
  const { data: plans = [] } = usePlans();
  const { create } = useMutateHall();
  const confirm = useConfirmPayment();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [planId, setPlanId] = useState<string>('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'credentials'>('form');
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  // Default to first plan when loaded
  if (plans.length && !planId) {
    const venuePlan = plans.find((p) => p.code === 'venue') ?? plans[0];
    setPlanId(venuePlan.id);
  }

  const handleCreate = async () => {
    if (!name.trim() || !planId) {
      toast.error(t('superadmin.halls.add_modal.name') + ' / ' + t('superadmin.halls.add_modal.plan'));
      return;
    }
    setSubmitting(true);
    try {
      // 1) cover image upload
      let coverUrl: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split('.').pop() ?? 'jpg';
        const path = `covers/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('hall-assets').upload(path, coverFile);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('hall-assets').getPublicUrl(path);
        coverUrl = data.publicUrl;
      }

      // 2) create hall
      const hall = await create.mutateAsync({ name: name.trim(), address: address.trim() || null, phone: phone.trim() || null, cover_url: coverUrl });

      // 3) create subscription via RPC (auto-generates activity log)
      await confirm.mutateAsync({
        hallId: (hall as { id: string }).id,
        planId,
        note: t('superadmin.halls.add_modal.payment_note'),
      });

      // log creation (uses a localization key resolved in ActivityPage)
      const { data: u } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert({
        actor_id: u.user?.id ?? null,
        actor_email: u.user?.email ?? null,
        hall_id: (hall as { id: string }).id,
        action: 'hall_created',
        description: `hall_created|${(hall as { name: string }).name}`,
        metadata: { plan_id: planId },
      });

      qc.invalidateQueries({ queryKey: ['admin-halls'] });
      qc.invalidateQueries({ queryKey: ['wedding_halls'] });

      // 4) optional admin
      if (adminEmail.trim() && adminPassword.length >= 6) {
        setStep('credentials');
        const { data, error } = await supabase.functions.invoke('create-hall-admin', {
          body: {
            email: adminEmail.trim(),
            password: adminPassword,
            full_name: adminName.trim() || null,
            hall_id: (hall as { id: string }).id,
          },
        });
        if (!error) {
          setCreatedCreds({ email: adminEmail.trim(), password: adminPassword });
          await supabase.from('activity_logs').insert({
            actor_id: u.user?.id ?? null,
            actor_email: u.user?.email ?? null,
            hall_id: (hall as { id: string }).id,
            action: 'admin_created',
            description: `admin_created|${adminName.trim() || adminEmail.trim()}`,
          });
          qc.invalidateQueries({ queryKey: ['hall_admins'] });
          toast.success(t('superadmin.halls.add_modal.created_with_admin'));
        } else {
          const msg = (data as { error?: string } | null)?.error ?? error.message;
          toast.error(t('superadmin.halls.add_modal.admin_error', { msg }));
        }
      } else {
        toast.success(t('superadmin.halls.add_modal.created'));
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : t('superadmin.errorGeneric'));
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
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:max-w-lg sm:rounded-2xl sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 flex-shrink-0 rounded-full bg-neutral-300 sm:hidden" />
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-neutral-900">{t('superadmin.halls.add_modal.title')}</h2>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {createdCreds ? (
          // Success view — credentials to share with the new admin
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <p className="text-[13px] text-neutral-600">
              {t('superadmin.halls.add_modal.created_intro')}
            </p>
            <div className="rounded-xl bg-neutral-50 p-4 text-[13px]">
              <p>
                <span className="text-neutral-500">Login:</span> <b className="text-neutral-900">{createdCreds.email}</b>
              </p>
              <p className="mt-1">
                <span className="text-neutral-500">Parol:</span> <b className="text-neutral-900">{createdCreds.password}</b>
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`Login: ${createdCreds.email}\nParol: ${createdCreds.password}`);
                  toast.success(t('superadmin.halls.add_modal.copy_success'));
                }}
              >
                {t('superadmin.halls.add_modal.copy')}
              </Button>
              <Button className="bg-[#3a4530] text-white hover:bg-[#2f3827]" onClick={onClose}>
                {t('superadmin.halls.add_modal.close')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <Field label={t('superadmin.halls.add_modal.name')} required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('superadmin.halls.add_modal.name_ph')}
                />
              </Field>
              <Field label={t('superadmin.halls.add_modal.address')}>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('superadmin.halls.add_modal.address_ph')}
                />
              </Field>
              <Field label={t('superadmin.halls.add_modal.phone')}>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('superadmin.halls.add_modal.phone_ph')}
                />
              </Field>
              <Field label={t('superadmin.halls.add_modal.cover')}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2.5 text-[12.5px] text-neutral-600 hover:bg-neutral-100">
                  <Upload className="h-4 w-4" />
                  {coverFile ? coverFile.name : t('superadmin.halls.add_modal.cover_pick')}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </Field>

              <Field label={t('superadmin.halls.add_modal.plan')} required>
                {plans.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-800">
                    <p className="font-medium">{t('superadmin.halls.add_modal.no_plan_title')}</p>
                    <p className="mt-0.5 text-[11.5px] text-amber-700">{t('superadmin.halls.add_modal.no_plan_desc')}</p>
                  </div>
                ) : (
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
                )}
                <p className="mt-1.5 text-[11.5px] text-neutral-500">
                  {t('superadmin.halls.add_modal.trial_hint')}
                </p>
              </Field>

              <div className="rounded-xl bg-neutral-50 p-3">
                <p className="mb-2 text-[12.5px] font-semibold text-neutral-700">
                  {t('superadmin.halls.add_modal.admin')} <span className="text-[10.5px] font-normal text-neutral-500">(ixtiyoriy)</span>
                </p>
                <div className="space-y-2.5">
                  <Input
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder={t('superadmin.halls.add_modal.admin_name')}
                  />
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder={t('superadmin.halls.add_modal.admin_login')}
                  />
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Input
                        type={showPwd ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder={t('superadmin.halls.add_modal.admin_password')}
                      />
                      <button
                        type="button"
                        aria-label={showPwd ? t('superadmin.common.hide_password') : t('superadmin.common.show_password')}
                        onClick={() => setShowPwd((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded text-neutral-500 hover:bg-neutral-200"
                      >
                        {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setAdminPassword(genPassword())} type="button">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-shrink-0 justify-end gap-2 border-t border-neutral-100 px-5 py-4">
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                {t('superadmin.halls.add_modal.cancel')}
              </Button>
              <Button
                className="bg-[#3a4530] text-white hover:bg-[#2f3827]"
                onClick={handleCreate}
                disabled={submitting || !name.trim() || !planId}
                title={!name.trim() ? t('superadmin.halls.add_modal.name_required') : !planId ? t('superadmin.halls.add_modal.plan_required') : undefined}
              >
                <Plus className="mr-1 h-4 w-4" />
                {submitting ? t('superadmin.halls.add_modal.submitting') : t('superadmin.halls.add_modal.submit')}
              </Button>
            </div>
          </>
        )}
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
