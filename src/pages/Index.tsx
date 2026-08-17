import { Fragment, useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import { useNavigate } from "react-router-dom";

import CustomCursor from "@/components/visual/CustomCursor";
import FilmGrain from "@/components/visual/FilmGrain";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation, useLocalePath } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowDown,
  Menu,
  Phone,
  Mail,
  QrCode,
  CalendarDays,
  Utensils,
  Music,
  Images,
  Heart,
  Check,
  Users,
  X,
  Instagram,
  Send,
} from "lucide-react";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/* ============================================================
   Reusable motion helpers
   ============================================================ */
const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   Navigation
   ============================================================ */
const NAV_LINKS = ["nege", "mumkinshilikler", "qalay", "bahalar", "baylanis"] as const;

function LandingNav() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const to = useLocalePath();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`premium-nav fixed inset-x-0 top-0 z-50 ${scrolled ? "scrolled" : ""}`}
    >
      <div className="vow-wrap-wide flex h-16 items-center justify-between md:h-[4.5rem]">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="brand text-[var(--vow-ink)]"
        aria-label="Vowly"
        data-cursor="open"
      >
        <img src="/logo1.png" alt="Vowly" className="logo-mark" />
        <span
          className="font-display text-2xl font-semibold tracking-wide whitespace-nowrap"
          style={{ letterSpacing: "0.02em" }}
        >
          Vowly
        </span>
      </button>
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((id) => (
            <button
              key={id}
              onClick={() => go(id)}
              className="premium-nav-link"
            >
              {t(`home.nav.links.${id}`)}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="desktop" />
          <Button
            size="sm"
            className="vow-btn vow-btn-glass-dark !px-5 !py-2.5 !hidden sm:!inline-flex"
            onClick={() => navigate(to("/login"))}
            data-cursor="open"
          >
            {t("home.nav.demo")}
          </Button>
          <button
            type="button"
            className="premium-burger lg:hidden"
            aria-label={menuOpen ? t("home.nav.menuOpen") : t("home.nav.menuClosed")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="premium-mobile-menu lg:hidden">
          {NAV_LINKS.map((id) => (
            <button key={id} onClick={() => go(id)}>
              {t(`home.nav.links.${id}`)}
            </button>
          ))}
          <LanguageSwitcher variant="mobile" />
          <Button
            className="vow-btn vow-btn-glass-dark premium-mobile-cta"
            onClick={() => {
              setMenuOpen(false);
              navigate(to("/login"));
            }}
            data-cursor="open"
          >
            {t("home.nav.demo")}
          </Button>
        </div>
      )}
    </motion.header>
  );
}

/* ============================================================
   HERO — premium cover (video kept exactly as-is)
   ============================================================ */
function HeroSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const to = useLocalePath();
  const reduced = useReducedMotion();
  const hidden = reduced ? false : { opacity: 0, y: 14 };
  const shown = { opacity: 1, y: 0 };
  const td = (d: number) => ({ duration: 0.9, delay: d, ease: EASE });

  const scrollDown = () =>
    document.getElementById("nege")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="hero">
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        src="/hero.mp4"
      />
      <div className="hero-scrim" />

      <div className="hero-content hero-content-left">
        <motion.p
          initial={hidden}
          animate={shown}
          transition={td(0.15)}
          className="hero-premium-eyebrow"
        >
          {t("home.hero.eyebrow")}
        </motion.p>

        <motion.h1
          initial={hidden}
          animate={shown}
          transition={td(0.3)}
          className="hero-premium-title"
        >
          {t("home.hero.title1")}
          <br />
          <span className="hero-title-accent">{t("home.hero.title2")}</span>
        </motion.h1>

        <motion.p
          initial={hidden}
          animate={shown}
          transition={td(0.5)}
          className="hero-premium-sub"
        >
          {t("home.hero.sub")}
        </motion.p>

        <motion.div
          initial={hidden}
          animate={shown}
          transition={td(0.65)}
          className="hero-premium-cta"
        >
          <Button
            size="lg"
            className="vow-btn vow-btn-glass-gold"
            onClick={() => navigate(to("/taklifnoma/yangi"))}
            data-cursor="open"
          >
            {t("home.hero.ctaPrimary")}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            className="vow-btn vow-btn-glass"
            onClick={() => navigate(to("/login"))}
            data-cursor="open"
          >
            {t("home.hero.ctaDemo")}
          </Button>
        </motion.div>
      </div>

      <div className="hero-premium-bottom">
        <button
          onClick={scrollDown}
          className="hero-premium-bottom-link"
          data-cursor="open"
        >
          <span>{t("home.hero.bottomHow")}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={scrollDown}
          className="hero-premium-bottom-link"
          data-cursor="open"
          aria-label={t("home.hero.bottomDown")}
        >
          <span>{t("home.hero.bottomDown")}</span>
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 2 — QR experience
   ============================================================ */
const QR_FLOW = ["qr", "scan", "open", "experience"] as const;

function QrExperienceSection() {
  const { t } = useTranslation();
  return (
    <section id="nege" className="section-premium bg-[var(--vow-ivory)]">
      <div className="vow-wrap-wide">
        <div className="editorial-grid">
          <div>
            <Reveal>
              <p className="premium-eyebrow">{t("home.qr.eyebrow")}</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="premium-heading max-w-xl">
                {t("home.qr.title1")}
                <br />
                <em>{t("home.qr.title2")}</em>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="premium-sub mt-5">{t("home.qr.sub")}</p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="qr-flow-premium">
                {QR_FLOW.map((f, i) => {
                  const Icon =
                    f === "qr" ? QrCode : f === "scan" ? Phone : f === "open" ? Heart : Images;
                  return (
                    <Fragment key={f}>
                      <div className="qr-step">
                        <div className="qr-step-icon">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <p className="qr-step-text">{t(`home.qr.flow.${f}`)}</p>
                      </div>
                      {i < QR_FLOW.length - 1 && <div className="qr-step-arrow" />}
                    </Fragment>
                  );
                })}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="editorial-media">
              <div className="phone-showcase">
                <div className="phone-showcase-floral" />
                <img
                  src="/5.png"
                  alt="Vowly wedding invitation phone mockup"
                  className="phone-showcase-img"
                  loading="eager"
                  draggable={false}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 3 — Features
   ============================================================ */
const FEATURES = [
  { id: "liveToy", icon: CalendarDays },
  { id: "couple", icon: Users },
  { id: "gallery", icon: Images },
  { id: "shows", icon: Music },
  { id: "menu", icon: Utensils },
  { id: "rsvp", icon: Check },
] as const;

function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <section id="mumkinshilikler" className="section-premium bg-[var(--vow-cream)]">
      <div className="vow-wrap-wide">
        <div className="mb-12 max-w-3xl">
          <Reveal>
            <p className="premium-eyebrow">{t("home.features.eyebrow")}</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="premium-heading">
              {t("home.features.title1")}
              <br />
              <em>{t("home.features.title2")}</em>
            </h2>
          </Reveal>
        </div>
        <div className="premium-feature-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.id} delay={i * 0.05}>
              <div className="premium-feature">
                <div className="premium-feature-icon">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="premium-feature-title">{t(`home.features.items.${f.id}`)}</h3>
                <p className="premium-feature-desc">{t(`home.features.descs.${f.id}`)}</p>
                <div className="premium-feature-arrow">
                  <span>{t("home.features.more")}</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 4 — Wedding day timeline (cinematic storyboard)
   ============================================================ */
// Image URLs are swappable placeholders (wedding-themed). Replace with the
// couple's real photos by editing ONLY this array — all copy lives in i18n.
const TIMELINE: { key: string; img: string }[] = [
  { key: "arrival",    img: "/a.png" },
  { key: "entrance",   img: "/b.png" },
  { key: "congrats",   img: "/c.png" },
  { key: "dinner",     img: "/d.png" },
  { key: "firstDance", img: "/e.png" },
  { key: "games",      img: "/f.png" },
  { key: "waltz",      img: "/g.png" },
  { key: "dancing",    img: "/j.png" },
  { key: "farewell",   img: "/k.png" },
];

function LiveToySection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const to = useLocalePath();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("in-view");
            io.disconnect();
          }
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="qalay" className="section-premium bg-[var(--vow-ivory)]">
      <div className="vow-wrap-wide">
        <div className="grid items-end gap-8 md:grid-cols-2">
          <div>
            <Reveal>
              <p className="premium-eyebrow">{t("home.timeline.eyebrow")}</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="premium-heading">
                {t("home.timeline.title1")}
                <em>{t("home.timeline.title2")}</em>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="premium-sub mt-5">{t("home.timeline.sub")}</p>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <div className="flex md:justify-end">
              <Button
                className="vow-btn vow-btn-glass-dark"
                onClick={() => navigate(to("/login"))}
                data-cursor="open"
              >
                {t("home.timeline.cta")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <div ref={ref} className="premium-timeline">
            <div className="premium-tl-scroll">
              <div className="premium-tl-grid">
                {TIMELINE.map((e, i) => (
                  <article
                    key={e.key}
                    className="premium-tl-step"
                    style={{ transitionDelay: `${i * 0.07}s` }}
                  >
                    <div className="premium-tl-img">
                      <img
                        src={e.img}
                        alt={t(`home.timeline.events.${e.key}.title`)}
                        loading="lazy"
                      />
                    </div>
                    <div className="premium-tl-node">
                      <span className="premium-tl-marker" />
                    </div>
                    <p className="premium-tl-time">{t(`home.timeline.events.${e.key}.time`)}</p>
                    <h3 className="premium-tl-title">{t(`home.timeline.events.${e.key}.title`)}</h3>
                    <p className="premium-tl-desc">{t(`home.timeline.events.${e.key}.desc`)}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 5 — Guest photo gallery
   ============================================================ */
// Curated visual story of one wedding day — local assets, no external hosts.
const SEZIMLERI_GALLERY = [
  { src: "/gallery-1.jpg", cls: "gallery-tile--hero", capKey: "hero", eager: true },
  { src: "/gallery-2.jpg", cls: "gallery-tile--details", capKey: "details" },
  { src: "/gallery-3.jpg", cls: "gallery-tile--ceremony", capKey: "ceremony" },
  { src: "/gallery-4.jpg", cls: "gallery-tile--emotion", capKey: "emotion" },
  { src: "/gallery-5.jpg", cls: "gallery-tile--dance", capKey: "dance" },
];

function GallerySection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const to = useLocalePath();
  return (
    <section className="section-premium bg-[var(--vow-cream)]">
      <div className="vow-wrap-wide">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Reveal>
              <p className="premium-eyebrow">{t("home.gallery.eyebrow")}</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="premium-heading">
                {t("home.gallery.title1")}
                <em>{t("home.gallery.title2")}</em>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="premium-sub mt-5">{t("home.gallery.sub")}</p>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <div className="flex flex-col items-start gap-4 md:items-end">
              <div className="font-display text-3xl font-light text-[var(--vow-ink)]">
                <span className="text-[var(--vow-gold)]">+120</span>{" "}
                <span className="premium-sub !text-[var(--vow-muted)]">
                  {t("home.gallery.photos")}
                </span>
              </div>
              <Button
                className="vow-btn vow-btn-glass-dark"
                onClick={() => navigate(to("/login"))}
                data-cursor="open"
              >
                {t("home.gallery.cta")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.2}>
          <div className="gallery-editorial">
            {SEZIMLERI_GALLERY.map((g) => (
              <figure
                key={g.src}
                className={`gallery-tile ${g.cls}`}
                data-cursor="view"
              >
                <img
                  src={g.src}
                  alt={t(`home.gallery.captions.${g.capKey}`)}
                  loading={g.eager ? "eager" : "lazy"}
                  decoding="async"
                  width={1200}
                  height={g.cls === "gallery-tile--dance" ? 800 : 1800}
                />
                <figcaption className="gallery-tile-cap">
                  {t(`home.gallery.captions.${g.capKey}`)}
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 6 — Wedding management
   ============================================================ */
function WeddingManagementSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const to = useLocalePath();
  return (
    <section className="section-premium bg-[var(--vow-ivory)]">
      <div className="vow-wrap-wide">
        <div className="editorial-grid reverse">
          <div>
            <Reveal>
              <p className="premium-eyebrow">{t("home.management.eyebrow")}</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="premium-heading">
                {t("home.management.title1")}
                <em>{t("home.management.title2")}</em>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="premium-sub mt-5">{t("home.management.sub")}</p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  className="vow-btn vow-btn-glass-dark"
                  onClick={() => navigate(to("/login"))}
                  data-cursor="open"
                >
                  {t("home.management.ctaMore")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  className="vow-btn vow-btn-glass-dark"
                  onClick={() => {
                    document
                      .getElementById("qalay")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  data-cursor="open"
                >
                  {t("home.management.ctaHow")}
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="editorial-media">
              <div className="phone-showcase">
                <div className="phone-showcase-floral" />
                <img
                  src="/6.png"
                  alt="Vowly wedding organizer admin panel"
                  className="phone-showcase-img reverse slow"
                  loading="eager"
                  draggable={false}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 7 — Pricing
   ============================================================ */
const PLANS = [
  { id: "qr", featured: false },
  { id: "venue", featured: false },
  { id: "combo", featured: true },
] as const;

function PricingSection() {
  const navigate = useNavigate();
  const { t, tList } = useTranslation();
  const to = useLocalePath();
  return (
    <section id="bahalar" className="section-premium-lg bg-[var(--vow-cream)]">
      <div className="vow-wrap-wide">
        <div className="mb-10 max-w-2xl">
          <Reveal>
            <p className="premium-eyebrow">{t("home.pricing.eyebrow")}</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="premium-heading">
              {t("home.pricing.title1")}
              <em>{t("home.pricing.title2")}</em>
            </h2>
          </Reveal>
        </div>
        <div className="pricing-premium">
          {PLANS.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.07}>
              <div className={`pricing-card ${p.featured ? "featured" : ""}`}>
                <div className="pricing-card-surface">
                  <p className="pricing-card-name">{t(`home.pricing.plans.${p.id}.name`)}</p>
                  <p className="pricing-card-price">{t(`home.pricing.plans.${p.id}.price`)}</p>
                  <p className="pricing-card-unit">{t(`home.pricing.plans.${p.id}.unit`)}</p>
                  <div className="pricing-divider" />
                  <ul className="pricing-card-features">
                    {tList(`home.pricing.plans.${p.id}.feats`).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <button
                    className="pricing-card-cta"
                    onClick={() => navigate(to("/login"))}
                    data-cursor="open"
                  >
                    {t(`home.pricing.plans.${p.id}.cta`)}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {p.featured && (
                  <span className="pricing-badge">{t("home.pricing.badge")}</span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
const FOOTER_LINKS = ["nege", "mumkinshilikler", "qalay", "bahalar"] as const;

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer id="baylanis" className="premium-footer">
      <div className="vow-wrap-wide">
        <div className="premium-footer-grid">
          <div>
            <p className="font-display text-2xl font-semibold tracking-wide text-[var(--vow-ink)]">
              Vowly
            </p>
            <p
              className="premium-sub mt-3 !max-w-md"
              style={{ fontSize: "0.88rem" }}
            >
              {t("home.footer.tagline")}
            </p>
          </div>
          <div>
            <p className="premium-footer-title">{t("home.footer.menuTitle")}</p>
            {FOOTER_LINKS.map((id) => (
              <button
                key={id}
                className="premium-footer-link"
                onClick={() =>
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {t(`home.footer.links.${id}`)}
              </button>
            ))}
          </div>
          <div>
            <p className="premium-footer-title">{t("home.footer.contactTitle")}</p>
            <a
              href="tel:+998777630216"
              className="premium-footer-link"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Phone className="h-3.5 w-3.5" />
              +998 77 763 02 16
            </a>
            <a
              href="mailto:nursultantv94@gmail.com"
              className="premium-footer-link"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Mail className="h-3.5 w-3.5" />
              info@vowly.uz
            </a>
            <a
              href="https://t.me/vowly"
              target="_blank"
              rel="noopener noreferrer"
              className="premium-footer-link"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Send className="h-3.5 w-3.5" />
              Telegram
            </a>
            <a
              href="https://instagram.com/vowly"
              target="_blank"
              rel="noopener noreferrer"
              className="premium-footer-link"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Instagram className="h-3.5 w-3.5" />
              Instagram
            </a>
          </div>
          <div>
            <p className="premium-footer-title">{t("home.footer.newsletterTitle")}</p>
            <p className="premium-sub mb-3 !text-[0.86rem]">
              {t("home.footer.newsletterSub")}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                placeholder={t("home.footer.emailPlaceholder")}
                className="flex-1 rounded-md border border-[var(--vow-line)] bg-[var(--vow-ivory)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--vow-gold)]"
                aria-label={t("home.footer.emailPlaceholder")}
              />
            <button
              type="submit"
              className="vow-btn vow-btn-glass-dark !rounded-md !px-4"
              aria-label={t("home.footer.send")}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
            </form>
          </div>
        </div>
        <div className="premium-footer-bottom">
          <p>{t("home.footer.copyright", { year })}</p>
          <div className="premium-social">
            <a
              href="https://instagram.com/vowly"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://t.me/vowly"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
            >
              <Send className="h-4 w-4" />
            </a>
            <a href="mailto:nursultantv94@gmail.com" aria-label="Email">
              <Mail className="h-4 w-4" />
            </a>
            <a href="tel:+998777630216" aria-label="Telefon">
              <Phone className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   PAGE
   ============================================================ */
const Index = () => {
  const navigate = useNavigate();
  const { user, loading, isSuperAdmin, isHallAdmin } = useAuth();
  const to = useLocalePath();

  useEffect(() => {
    if (!loading && user) {
      if (isSuperAdmin) navigate(to("/super-admin"), { replace: true });
      else if (isHallAdmin) navigate(to("/admin"), { replace: true });
      else navigate(to("/admin"), { replace: true });
    }
  }, [loading, user, isSuperAdmin, isHallAdmin, navigate, to]);

  if (loading || user) return null;

  return (
    <div className="min-h-screen bg-[var(--vow-ivory)]">
      <FilmGrain />
      <CustomCursor />
      <LandingNav />
      <main>
        <HeroSection />
        <QrExperienceSection />
        <FeaturesSection />
        <LiveToySection />
        <GallerySection />
        <WeddingManagementSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
