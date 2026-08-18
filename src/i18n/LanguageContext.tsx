import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  type Locale,
  SUPPORTED_LOCALES,
  getInitialLocale,
  isLocale,
  setStoredLocale,
} from "./config";

type Dict = Record<string, unknown>;

// Lazy-loaded per-locale bundles (one chunk per language — only the active
// locale is fetched). Vite code-splits each matched module automatically.
const localeModules = import.meta.glob("./locales/*.json", {
  eager: false,
}) as Record<string, () => Promise<{ default: Dict }>>;

const cache = new Map<Locale, Dict>();

async function loadLocale(locale: Locale): Promise<Dict> {
  if (cache.has(locale)) return cache.get(locale)!;
  const loader = localeModules[`./locales/${locale}.json`];
  if (!loader) {
    if (import.meta.env.DEV) console.warn(`[i18n] Missing locale bundle: ${locale}`);
    const empty: Dict = {};
    cache.set(locale, empty);
    return empty;
  }
  const mod = await loader();
  const dict = (mod.default ?? mod) as Dict;
  cache.set(locale, dict);
  return dict;
}

function lookup(dict: Dict, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Dict)) {
      cur = (cur as Dict)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in params ? String(params[k]) : `{${k}}`
  );
}

export interface I18nContextValue {
  locale: Locale;
  locales: Locale[];
  setLocale: (locale: Locale) => void;
  /** Sync the active locale from a URL segment (used by the locale router). */
  syncLocaleFromUrl: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Returns a translation that is an array of strings (e.g. feature lists). */
  tList: (key: string) => string[];
  loading: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initial locale is resolved synchronously from the URL (or storage/browser)
  // so a hard refresh or deep link never flashes the wrong language.
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());
  const [dict, setDict] = useState<Dict>(() => cache.get(locale) ?? {});
  const [loading, setLoading] = useState(true);

  const applyLocale = useCallback(async (next: Locale, persist: boolean) => {
    const [current, fallback] = await Promise.all([
      loadLocale(next),
      next === DEFAULT_LOCALE ? Promise.resolve({} as Dict) : loadLocale(DEFAULT_LOCALE),
    ]);
    setDict(current);
    setLocaleState(next);
    if (typeof document !== "undefined") document.documentElement.lang = next;
    if (persist) setStoredLocale(next);
  }, []);

  // Initial load (also pre-loads the default-locale fallback bundle).
  useEffect(() => {
    let active = true;
    (async () => {
      await applyLocale(locale, false);
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      if (!isLocale(next) || next === locale) return;
      applyLocale(next, true);
    },
    [applyLocale, locale]
  );

  const syncLocaleFromUrl = useCallback(
    (next: Locale) => {
      if (!isLocale(next) || next === locale) return;
      applyLocale(next, true);
    },
    [applyLocale, locale]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const val = lookup(dict, key);
      if (val !== undefined) return interpolate(val, params);

      // Missing key. In DEV we surface the raw dotted key as a diagnostic so gaps
      // are obvious (never a foreign-language string that looks "fine" but is wrong).
      // In PROD we fall back to the default (source) locale so nothing renders undefined
      // and the UI stays coherent.
      const fb = cache.get(DEFAULT_LOCALE);
      const fv = fb ? lookup(fb, key) : undefined;
      if (import.meta.env.DEV) {
        if (fv !== undefined) {
          console.warn(
            `[i18n] Missing '${key}' in '${locale}' — defined fallback: ${DEFAULT_LOCALE}`
          );
        } else {
          console.warn(`[i18n] Missing translation: ${locale}.${key}`);
        }
        return key;
      }
      if (fv !== undefined) return interpolate(fv, params);
      return key;
    },
    [dict, locale]
  );

  const tList = useCallback((key: string): string[] => {
    const read = (d: Dict): string[] | undefined => {
      const parts = key.split(".");
      let cur: unknown = d;
      for (const p of parts) {
        if (cur && typeof cur === "object" && p in (cur as Dict)) {
          cur = (cur as Dict)[p];
        } else {
          return undefined;
        }
      }
      return Array.isArray(cur) ? cur.map(String) : undefined;
    };
    return read(dict) ?? read(cache.get(DEFAULT_LOCALE) ?? {}) ?? [];
  }, [dict]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      locales: [...SUPPORTED_LOCALES],
      setLocale,
      syncLocaleFromUrl,
      t,
      tList,
      loading,
    }),
    [locale, setLocale, syncLocaleFromUrl, t, tList, loading]
  );

  // Gate the first paint on the bundle so untranslated keys (the raw dotted
  // key) never flash before the locale JSON is loaded.
  if (loading) return null;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within <LanguageProvider>");
  return ctx;
}

export function useLocale(): Locale {
  return useTranslation().locale;
}

/** Returns a helper that prefixes a path with the active locale, e.g. localePath("/taklifnoma/yangi"). */
export function useLocalePath() {
  const { locale } = useTranslation();
  return useCallback(
    (path: string) => {
      if (/^https?:\/\//.test(path)) return path;
      const clean = path.startsWith("/") ? path : `/${path}`;
      return `/${locale}${clean}`;
    },
    [locale]
  );
}
