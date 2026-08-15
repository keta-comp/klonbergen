import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import {
  LOCALE_LABELS,
  LOCALE_SHORT,
  SUPPORTED_LOCALES,
  type Locale,
  isLocale,
} from "@/i18n/config";
import { useTranslation } from "@/i18n/LanguageContext";

/** Swap the leading /<from> locale segment for /<to>, keeping the rest of the path + query. */
function swapLocaleInPath(pathname: string, from: Locale, to: Locale): string {
  const seg = `/${from}`;
  if (pathname === seg) return `/${to}`;
  if (pathname.startsWith(seg + "/")) return pathname.replace(seg, `/${to}`);
  return `/${to}${pathname}`;
}

export default function LanguageSwitcher({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const { locale, setLocale } = useTranslation();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const change = (next: Locale) => {
    setOpen(false);
    // Derive the *current* locale from the URL itself (not the context closure,
    // which can lag a state update) so the path swap is always correct.
    const urlMatch = pathname.match(/^\/(kaa|uz|ru|en)(?:\/|$)/);
    const from: Locale = urlMatch && isLocale(urlMatch[1]) ? urlMatch[1] : locale;
    if (next === from) return;
    setLocale(next);
    // Client-side navigation only — no full reload, same section/scroll preserved.
    navigate(swapLocaleInPath(pathname, from, next) + search);
  };

  if (variant === "mobile") {
    return (
      <div className="premium-lang-mobile" role="group" aria-label="Til saylaw">
        {SUPPORTED_LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            className="premium-lang-mobile-item"
            aria-current={l === locale ? "true" : undefined}
            onClick={() => change(l)}
          >
            {LOCALE_LABELS[l]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="premium-lang" ref={ref}>
      <button
        type="button"
        className="premium-lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Til: ${LOCALE_LABELS[locale]}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="premium-lang-current">{LOCALE_SHORT[locale]}</span>
        <ChevronDown className="premium-lang-chevron" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="premium-lang-menu"
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {SUPPORTED_LOCALES.map((l) => (
              <li key={l} role="option" aria-selected={l === locale}>
                <button
                  type="button"
                  className="premium-lang-item"
                  aria-current={l === locale ? "true" : undefined}
                  onClick={() => change(l)}
                >
                  <span>{LOCALE_LABELS[l]}</span>
                  {l === locale && <Check className="premium-lang-check" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Tiny helper so other components can derive a locale-aware path if needed. */
export function withLocale(pathname: string, from: Locale, to: Locale): string {
  return isLocale(from) ? swapLocaleInPath(pathname, from, to) : pathname;
}
