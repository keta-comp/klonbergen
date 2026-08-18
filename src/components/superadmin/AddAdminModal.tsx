/**
 * AddAdminModal — create a new hall admin and link it to an existing venue.
 *
 * Flow (uses the `create-hall-admin` Edge Function, which runs as service_role):
 *  1) collect full_name + email + password + hall_id
 *  2) invoke Edge Function (creates auth user if needed, upserts profile, links hall_admins)
 *  3) log activity_logs entry
 *  4) invalidate hall_admins/profiles queries so the AdminlarPage list refreshes
 *  5) show success view with credentials + copy-to-clipboard
 */
import { useState } from 'react';
import { X, Plus, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Hall = Tables<'wedding_halls'>;

interface Props {
  halls: Hall[];
  onClose: () => void;
}

const genPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('') + '!7';
};

export default function AddAdminModal({ halls, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [hallId, setHallId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string; hallName: string } | null>(null);

  const selectedHall = halls.find((h) => h.id === hallId) ?? null;
  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 6 &&
    hallId.length > 0 &&
    !submitting;

  const handleCreate = async () => {
    if (!email.trim()) {
      toast.error(t('superadmin.admins.add_modal.email'));
      return;
    }
    if (password.length < 6) {
      toast.error(t('superadmin.admins.add_modal.password'));
      return;
    }
    if (!hallId) {
      toast.error(t('superadmin.admins.add_modal.hall'));
      return;
    }
    const hall = halls.find((h) => h.id === hallId);
    if (!hall) {
      toast.error(t('superadmin.admins.add_modal.error', { message: 'hall not found' }));
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-hall-admin', {
        body: {
          email: email.trim(),
          password,
          full_name: fullName.trim() || null,
          hall_id: hallId,
        },
      });
      if (error) {
        const msg = (data as { error?: string } | null)?.error ?? error.message;
        throw new Error(msg);
      }

      // log activity
      const { data: u } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert({
        actor_id: u.user?.id ?? null,
        actor_email: u.user?.email ?? null,
        hall_id: hallId,
        action: 'admin_created',
        description: `admin_created|${fullName.trim() || email.trim()}`,
      });

      qc.invalidateQueries({ queryKey: ['hall_admins'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['activity-logs'] });

      setCreatedCreds({ email: email.trim(), password, hallName: hall.name });
      toast.success(t('superadmin.admins.add_modal.success_with', { name: hall.name }));
    } catch (err) {
      console.error(err);
      toast.error(t('superadmin.admins.add_modal.error', { message: (err as Error).message }));
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
          <h2 className="text-[15px] font-semibold text-neutral-900">
            {t('superadmin.admins.add_modal.title')}
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

        {createdCreds ? (
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <p className="text-[13px] text-neutral-600">
              {t('superadmin.admins.add_modal.success_with', { name: createdCreds.hallName })}
            </p>
            <div className="rounded-xl bg-neutral-50 p-4 text-[13px]">
              <p>
                <span className="text-neutral-500">Login:</span>{' '}
                <b className="text-neutral-900">{createdCreds.email}</b>
              </p>
              <p className="mt-1">
                <span className="text-neutral-500">Parol:</span>{' '}
                <b className="text-neutral-900">{createdCreds.password}</b>
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Login: ${createdCreds.email}\nParol: ${createdCreds.password}`,
                  );
                  toast.success(t('superadmin.admins.add_modal.copy_success'));
                }}
              >
                {t('superadmin.admins.add_modal.copy')}
              </Button>
              <Button className="bg-[#3a4530] text-white hover:bg-[#2f3827]" onClick={onClose}>
                {t('superadmin.admins.add_modal.close')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <Field label={t('superadmin.admins.add_modal.name')}>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('superadmin.admins.add_modal.name_ph')}
                />
              </Field>
              <Field label={t('superadmin.admins.add_modal.email')} required>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('superadmin.admins.add_modal.email_ph')}
                />
              </Field>
              <Field label={t('superadmin.admins.add_modal.password')} required>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('superadmin.admins.add_modal.password_ph')}
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPassword(genPassword())}
                    type="button"
                    aria-label={t('superadmin.admins.add_modal.generate')}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </Field>
              <Field label={t('superadmin.admins.add_modal.hall')} required>
                {halls.length === 0 ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
                    {t('superadmin.admins.no_halls')}
                  </p>
                ) : (
                  <Select value={hallId} onValueChange={setHallId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('superadmin.admins.add_modal.hall_ph')} />
                    </SelectTrigger>
                    <SelectContent>
                      {halls.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                          {h.archived ? ' (arxiv)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedHall && (
                  <p className="mt-1 text-[10.5px] text-neutral-500">{selectedHall.address ?? '—'}</p>
                )}
              </Field>
            </div>

            <div className="flex flex-shrink-0 justify-end gap-2 border-t border-neutral-100 px-5 py-4">
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                {t('superadmin.admins.add_modal.cancel')}
              </Button>
              <Button
                className="bg-[#3a4530] text-white hover:bg-[#2f3827]"
                onClick={handleCreate}
                disabled={!canSubmit}
              >
                <Plus className="mr-1 h-4 w-4" />
                {submitting ? t('superadmin.admins.add_modal.submitting') : t('superadmin.admins.add_modal.submit')}
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