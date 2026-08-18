/**
 * AddHallModal — create a new hall (no admin in this flow).
 * Admin creation has been moved to the Adminlar page → AddAdminModal.
 *
 * Steps:
 *  1) upload cover image (optional)
 *  2) insert into wedding_halls (super admin RLS)
 *  3) log activity
 *
 * NOTE: no subscription/plan is created here by design. Plans/subscriptions
 * are managed separately via the PaymentConfirmModal on the halls list.
 */
import { useState } from 'react';
import { X, Plus, Upload } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { useMutateHall } from '@/hooks/useHallData';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
}

export default function AddHallModal({ onClose }: Props) {
  const { t } = useTranslation();
  const { create } = useMutateHall();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error(t('superadmin.halls.add_modal.name'));
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

      // 2) create hall — no subscription/plan is created here by design.
      const hall = await create.mutateAsync({
        name: name.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        cover_url: coverUrl,
      });

      // log creation (uses a localization key resolved in ActivityPage)
      const { data: u } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert({
        actor_id: u.user?.id ?? null,
        actor_email: u.user?.email ?? null,
        hall_id: (hall as { id: string }).id,
        action: 'hall_created',
        description: `hall_created|${(hall as { name: string }).name}`,
      });

      qc.invalidateQueries({ queryKey: ['admin-halls'] });
      qc.invalidateQueries({ queryKey: ['wedding_halls'] });

      toast.success(t('superadmin.halls.add_modal.created'));
      onClose();
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
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-neutral-100 px-5 py-4">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t('superadmin.halls.add_modal.cancel')}
          </Button>
          <Button
            className="bg-[#3a4530] text-white hover:bg-[#2f3827]"
            onClick={handleCreate}
            disabled={submitting || !name.trim()}
          >
            <Plus className="mr-1 h-4 w-4" />
            {submitting ? t('superadmin.halls.add_modal.submitting') : t('superadmin.halls.add_modal.submit')}
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