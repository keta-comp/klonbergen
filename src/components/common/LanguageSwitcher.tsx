import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n/LanguageContext";
import { LOCALE_SHORT, LOCALE_LABELS, SUPPORTED_LOCALES, isLocale, type Locale } from "@/i18n/config";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * UZ / RU / EN / KA language switcher used in both the Admin and Super Admin
 * headers. Selecting a language rewrites the leading `/:locale` URL segment and
 * re-syncs the i18n context so the whole UI (including open modals/toasts) flips
 * to that language and persists across reloads.
 */
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const change = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    setLocale(next); // updates i18n + persists immediately
    // Rewrite the leading locale segment so the URL stays in sync.
    const segs = location.pathname.split("/");
    if (segs[1] && isLocale(segs[1])) {
      segs[1] = next;
      navigate(segs.join("/") + location.search, { replace: false });
    } else {
      navigate(`/${next}${location.pathname}${location.search}`);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={t("common.language")}
        title={LOCALE_LABELS[locale]}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors hover:border-neutral-300",
          compact ? "h-8 px-2 text-[11px]" : "h-8 px-2 text-[11px] sm:h-9 sm:px-2.5 sm:text-[12px]",
        )}
      >
        <Globe className="h-3.5 w-3.5 text-neutral-500" />
        <span className="font-semibold tracking-wide">{LOCALE_SHORT[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-xl">
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => change(l)}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-neutral-50",
                l === locale ? "font-semibold text-[#3a4530]" : "text-neutral-700",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="grid h-5 w-7 place-items-center rounded bg-neutral-100 text-[10.5px] font-bold text-neutral-600">
                  {LOCALE_SHORT[l]}
                </span>
                {LOCALE_LABELS[l]}
              </span>
              {l === locale && <Check className="h-3.5 w-3.5 text-[#3a4530]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
