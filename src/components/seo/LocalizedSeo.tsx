import Seo, { SITE_URL } from "./Seo";
import { useTranslation } from "@/i18n/LanguageContext";
import { SUPPORTED_LOCALES } from "@/i18n/config";

/**
 * Renders localized <title>/<meta description> + hreflang alternates for a page.
 * `page` selects the seo.<page>.title/description key; falls back to home copy
 * if a locale is missing that key (never renders undefined).
 */
export default function LocalizedSeo({
  page,
  path,
  noindex,
}: {
  page: string;
  path?: string;
  noindex?: boolean;
}) {
  const { t, locale } = useTranslation();

  const resolve = (key: string, fb: string) => {
    const v = t(key);
    return v === key ? t(fb) : v;
  };

  const title = resolve(`seo.${page}.title`, "seo.home.title");
  const description = resolve(`seo.${page}.description`, "seo.home.description");

  // Strip the active locale prefix to get the language-neutral base path, then
  // build an alternate URL per supported locale.
  const basePath = path ? path.replace(`/${locale}`, "") || "/" : "/";
  const hreflangs = SUPPORTED_LOCALES.map((l) => ({
    lang: l,
    href: `${SITE_URL}/${l}${basePath === "/" ? "" : basePath}`,
  }));

  return (
    <Seo
      title={title}
      description={description}
      path={path ?? `/${locale}`}
      noindex={noindex}
      hreflangs={hreflangs}
    />
  );
}
