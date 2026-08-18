// Vowly i18n configuration.
// Qaraqalpaq (kaa) is the default/source language. Other locales fall back to it.

export const SUPPORTED_LOCALES = ["kaa", "uz", "ru", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "kaa";

/** Single persistence key — do NOT create additional language keys. */
export const STORAGE_KEY = "vowly_language";

export const LOCALE_LABELS: Record<Locale, string> = {
  kaa: "Qaraqalpaqsha",
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

/** Compact labels for the desktop switcher. */
export const LOCALE_SHORT: Record<Locale, string> = {
  kaa: "QQ",
  uz: "O'Z",
  ru: "RU",
  en: "EN",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** First visit only: saved -> browser language -> default. */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const langs =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];
  for (const l of langs) {
    const code = l.toLowerCase().split("-")[0];
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

export function getStoredLocale(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isLocale(v) ? v : null;
  } catch {
    return null;
  }
}

export function setStoredLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage unavailable — language simply won't persist */
  }
}

/**
 * Initial locale resolution — priority: locale in the URL path
 * (/kaa, /uz, /ru, /en) -> saved preference -> browser language -> default.
 *
 * The URL segment is authoritative so that opening /ru/super-admin (deep link or
 * hard refresh) never flashes another language, even if a previous session stored
 * a different preference. `LocaleLayout` keeps it in sync on every in-app route
 * change (and re-persists to storage), so navigation + reload stay consistent.
 */
export function getInitialLocale(): Locale {
  if (typeof window !== "undefined") {
    const m = window.location.pathname.match(/^\/(kaa|uz|ru|en)(?:\/|$)/);
    if (m && isLocale(m[1])) return m[1];
  }
  const stored = getStoredLocale();
  if (stored) return stored;
  return detectBrowserLocale();
}
