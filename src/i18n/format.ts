import type { Locale } from "./config";

/**
 * Map our app locales to the closest Intl locale tag for number/date formatting.
 * Qaraqalpaq (kaa) has no dedicated Intl tag, so it reuses Uzbek formatting.
 */
const INTL_TAG: Record<Locale, string> = {
  uz: "uz-UZ",
  kaa: "uz-UZ",
  ru: "ru-RU",
  en: "en-US",
};

export function intlTag(locale: Locale): string {
  return INTL_TAG[locale] ?? "uz-UZ";
}

export function formatNumber(locale: Locale, value: number): string {
  try {
    return new Intl.NumberFormat(intlTag(locale)).format(value);
  } catch {
    return String(value);
  }
}

export function formatDate(locale: Locale, value: string | number | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(intlTag(locale), {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function formatDateTime(locale: Locale, value: string | number | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(intlTag(locale), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}
