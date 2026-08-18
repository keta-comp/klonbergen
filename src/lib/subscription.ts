/**
 * Subscription display helpers — all date math is done in Asia/Tashkent.
 */

const TZ = 'Asia/Tashkent';

/** Days remaining in a subscription, computed against the Tashkent calendar day. */
export function daysRemaining(expiresAt: string | Date): number {
  const exp = new Date(expiresAt);
  // Get YYYY-MM-DD in Tashkent
  const tashkentToday = new Date(
    new Date().toLocaleString('en-US', { timeZone: TZ }),
  );
  const tashkentExp = new Date(exp.toLocaleString('en-US', { timeZone: TZ }));
  // Strip to midnight
  tashkentToday.setHours(0, 0, 0, 0);
  tashkentExp.setHours(0, 0, 0, 0);
  const diffMs = tashkentExp.getTime() - tashkentToday.getTime();
  return Math.round(diffMs / 86400000);
}

/** Total days in the current period (approx from start to expiry). */
export function totalDays(startedAt: string | Date, expiresAt: string | Date): number {
  const start = new Date(startedAt);
  const end = new Date(expiresAt);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
}

/** Subscription status: 'active' | 'trial' | 'expired' | 'blocked' | 'archived' */
export type SubStatus = 'active' | 'trial' | 'expired' | 'blocked' | 'archived';

export function statusKey(status: SubStatus, days: number): 'faol' | 'sinov' | 'muddati_tugagan' | 'bloklangan' | 'archived' {
  if (status === 'trial') return 'sinov';
  if (status === 'archived') return 'archived';
  if (status === 'blocked') return 'bloklangan';
  if (status === 'expired' || days < 0) return 'muddati_tugagan';
  return 'faol';
}

export function formatDate(d: string | Date): string {
  const date = new Date(d);
  return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatPrice(n: number): string {
  return new Intl.NumberFormat('uz-UZ').format(n);
}
