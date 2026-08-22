import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, MapPin, Phone, X } from "lucide-react";
import InvitationPreview from "@/components/invitation/builder/InvitationPreview";
import StepIndicator from "@/components/invitation/builder/StepIndicator";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocalePath, useTranslation } from "@/i18n/LanguageContext";
import {
  CoupleForm,
  DateForm,
  VenueForm,
  MessageForm,
} from "@/components/invitation/builder/forms";
import Seo from "@/components/seo/Seo";
import { useCreateInvitation } from "@/hooks/useInvitations";
import { idbGet, idbSet, idbDel } from "@/lib/idb";
import type { BuilderState } from "@/components/invitation/builder/types";

/** Persisted builder draft — `vowly_` namespaced, stored in IndexedDB. */
const DRAFT_KEY = "vowly_builder_draft_v1";

const DEFAULT_STATE: BuilderState = {
  brideName: "",
  groomName: "",
  weddingDate: "",
  weddingTime: "",
  venueName: "",
  address: "",
  phone: "",
  mapsUrl: "",
  welcomeText:
    "Hurmatli mehmonlar, biz sizlarni quvonchli kunimiz — to'yimizga taklif qilamiz.",
  invitationText:
    "Sizlarning ishtirokingiz biz uchun alohida ahamiyatga ega. Quyidagi tafsilotlar orqali marosimga javob berishingiz mumkin.",
  finalText: "Sizni intizorlik bilan kutamiz.",
  music: null,
};

type StepId = "couple" | "date" | "venue" | "message";

const stepEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function InvitationBuilder() {
  const navigate = useNavigate();
  const to = useLocalePath();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Update the wizard step in the URL WITHOUT clobbering other query params
  // (e.g. ?debug=1). A bare `setSearchParams({ step })` replaces the WHOLE
  // search string, which wiped ?debug=1 on mount and made the mobile debug
  // overlay vanish. Merge instead so deep links + debug survive.
  const setStepParam = (id: string, opts?: { replace?: boolean }) => {
    const p = new URLSearchParams(window.location.search);
    p.set("step", id);
    setSearchParams(p, opts);
  };

  const STEPS = [
    { id: "couple", label: t("builder.steps.couple.label"), sub: t("builder.steps.couple.sub") },
    { id: "date", label: t("builder.steps.date.label"), sub: t("builder.steps.date.sub") },
    { id: "venue", label: t("builder.steps.venue.label"), sub: t("builder.steps.venue.sub") },
    { id: "message", label: t("builder.steps.message.label"), sub: t("builder.steps.message.sub") },
  ] as const;

  // The active step is derived from the URL (?step=<id>) — the single source of
  // truth. Deriving it from the search params means a refresh, a deep link, AND
  // the browser Back/Forward buttons all restore the exact wizard step with no
  // extra wiring: React Router updates `searchParams` on a popstate event
  // (client-side, no full reload), so stepIdx simply recomputes.
  const stepParam = searchParams.get("step");
  const stepParamIdx = STEPS.findIndex((x) => x.id === stepParam);
  const stepIdx = stepParamIdx >= 0 ? stepParamIdx : 0;
  const [state, setState] = useState<BuilderState>(DEFAULT_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<number | null>(null);

  // Mirrors of the latest state/step so a flush-on-hide can persist the most
  // recent values even if the debounced save hasn't fired yet (e.g. the user
  // refreshes moments after picking the background music).
  const stateRef = useRef(state);
  stateRef.current = state;
  const stepRef = useRef(stepIdx);
  stepRef.current = stepIdx;

  // Old deep links (?step=gallery / ?step=template) — or any unknown step id
  // left over after the gallery & template steps were removed — must bounce
  // to the last valid step so the wizard never lands on a screen that no
  // longer exists.
  useEffect(() => {
    if (stepParam && stepParamIdx < 0) {
      setStepParam(STEPS[STEPS.length - 1].id, { replace: true });
    }
  }, [stepParam, stepParamIdx, setSearchParams]);

  const create = useCreateInvitation();

  // Restore a previously saved draft (typed fields AND picked media files such
  // as the selected music) from IndexedDB. The wizard step is already derived
  // from the URL, so a direct deep link or a refresh keeps the step for free.
  // When there is NO ?step in the URL, we reflect the saved step into the URL
  // (replace, so we don't inject a stray history entry) — after that the step
  // is URL-driven and the browser Back/Forward buttons walk the wizard.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await idbGet<{ stepIdx: number; state: BuilderState }>(DRAFT_KEY);
        if (saved?.state && active) {
          setState({ ...DEFAULT_STATE, ...saved.state });
          if (stepParamIdx < 0 && typeof saved.stepIdx === "number") {
            const clamped = Math.max(0, Math.min(STEPS.length - 1, saved.stepIdx));
            setStepParam(STEPS[clamped].id, { replace: true });
          }
        }
      } catch {
        /* storage unavailable — start fresh */
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the draft (debounced) whenever it changes — but only after the
  // initial hydration, so we never overwrite saved data with the defaults.
  // The picked background music is saved IMMEDIATELY (no debounce) the moment
  // it changes, so a refresh right after choosing the track still keeps it.
  const prevMusic = useRef<BuilderState["music"] | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    const musicChanged = state.music !== prevMusic.current;
    prevMusic.current = state.music;
    if (musicChanged && state.music) {
      idbSet(DRAFT_KEY, { stepIdx, state }).catch(() => {});
      return;
    }
    saveTimer.current = window.setTimeout(() => {
      idbSet(DRAFT_KEY, { stepIdx, state }).catch(() => {});
    }, 350);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state, stepIdx, hydrated]);

  // Flush the draft immediately when the tab is hidden or the page is unloaded
  // (refresh / close / tab switch). IndexedDB writes are async, but this event
  // fires before unload, so the picked music and other fields survive a refresh
  // even if the debounced save above hasn't run yet.
  useEffect(() => {
    const flush = () =>
      idbSet(DRAFT_KEY, { stepIdx: stepRef.current, state: stateRef.current }).catch(() => {});
    const onVis = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  // Scroll the preview to the top whenever the active step changes so the
  // user always sees the most relevant screen.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".inv-screens");
    el?.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIdx]);

  const update = <K extends keyof BuilderState>(key: K, value: BuilderState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const errors = useMemo(() => validate(state, t), [state, t]);
  const stepErrors = errors[STEPS[stepIdx].id] ?? [];

  const canAdvance = stepErrors.length === 0;
  const isLast = stepIdx === STEPS.length - 1;

  // Move between steps by updating the URL. Because the active step is derived
  // from the URL, this also makes browser Back/Forward walk the wizard with no
  // full-page reload. A new history entry is pushed so Back/Forward works.
  const goToStep = (i: number) => {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, i));
    setStepParam(STEPS[clamped].id, { replace: false });
  };
  const next = () => {
    if (!canAdvance) return;
    goToStep(stepIdx + 1);
  };
  const prev = () => goToStep(stepIdx - 1);

  const handleCreate = async () => {
    if (!canAdvance) return;
    setSubmitting(true);
    try {
      const inv = await create.mutateAsync({
        brideName: state.brideName.trim(),
        groomName: state.groomName.trim(),
        weddingDate: state.weddingDate,
        weddingTime: state.weddingTime,
        venueName: state.venueName.trim(),
        address: state.address.trim(),
        phone: state.phone.trim(),
        mapsUrl: state.mapsUrl.trim(),
        welcomeText: state.welcomeText,
        invitationText: state.invitationText,
        finalText: state.finalText,
        music: state.music,
      });
      setDone(inv.slug);
      // The invitation is now persisted on the server — drop the local draft so
      // the next visit to the builder starts clean.
      idbDel(DRAFT_KEY).catch(() => {});
      setTimeout(() => navigate(to(`/taklifnoma/${inv.slug}`)), 700);
    } catch (e) {
      // Supabase PostgrestError is a plain object, not an Error instance —
      // pull the real message so the user can actually see what went wrong.
      const msg =
        (e as { message?: string })?.message ||
        (e instanceof Error ? e.message : null) ||
        t("builder.errorGeneric");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="inv-shell">
        <Seo
          title={t("builder.success.title")}
          description={t("builder.success.title")}
          path="/taklifnoma/yangi"
          noindex
        />
        <div className="inv-success">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: stepEase }}
            className="inv-success-mark"
          >
            <Check className="h-6 w-6" />
          </motion.div>
          <h1 className="inv-step-title">{t("builder.success.title")}</h1>
          <p className="inv-step-sub">{t("builder.success.sub")}</p>
        </div>
      </div>
    );
  }

  const current = STEPS[stepIdx];

  return (
    <div className="inv-shell">
      <Seo
        title={t("builder.seo.title")}
        description={t("builder.seo.desc")}
        path="/taklifnoma/yangi"
      />

      <header className="inv-header">
        <button onClick={() => navigate(to("/"))} className="inv-header-back">
          <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" /> Vowly
        </button>
        <span className="inv-header-brand">Vowly</span>
        <LanguageSwitcher variant="desktop" />
        <span className="inv-header-back">
          {stepIdx + 1} / {STEPS.length}
        </span>
      </header>

      <main className="inv-main">
        {/* ---------- EDITOR ---------- */}
        <section className="inv-editor">
          <StepIndicator steps={STEPS} activeIdx={stepIdx} onJump={(i) => goToStep(i)} />

          <div className="inv-step-bar">
            <span className="inv-step-bar-num">{String(stepIdx + 1).padStart(2, "0")}</span>
            <span>{current.label}</span>
            <span className="inv-step-bar-divider" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: stepEase }}
            >
              {current.id === "couple" && (
                <CoupleForm state={state} update={update} errors={stepErrors} />
              )}
              {current.id === "date" && (
                <DateForm state={state} update={update} errors={stepErrors} />
              )}
              {current.id === "venue" && (
                <VenueForm state={state} update={update} errors={stepErrors} />
              )}
              {current.id === "message" && (
                <MessageForm state={state} update={update} />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="inv-nav">
            <button className="inv-btn" onClick={prev} disabled={stepIdx === 0}>
              <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" /> {t("builder.nav.back")}
            </button>
            {!isLast ? (
              <button
                className="inv-btn inv-btn-primary"
                onClick={next}
                disabled={!canAdvance}
              >
                {t("builder.nav.next")} <ArrowRight className="ml-1.5 inline h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                className="inv-btn inv-btn-primary"
                onClick={handleCreate}
                disabled={!canAdvance || submitting}
              >
                {submitting ? t("builder.nav.creating") : t("builder.nav.create")}{" "}
                <ArrowRight className="ml-1.5 inline h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* ---------- PREVIEW (sticky on desktop, top on mobile) ---------- */}
        <aside className="inv-preview-col">
          <div className="inv-preview-col-inner">
            <p className="inv-preview-label">{t("builder.preview.label")}</p>
            <InvitationPreview state={state} />
          </div>
        </aside>
      </main>
    </div>
  );
}

function validate(state: BuilderState, t: (k: string) => string): Record<StepId, string[]> {
  const e: Record<StepId, string[]> = {
    couple: [],
    date: [],
    venue: [],
    message: [],
  };
  if (!state.brideName.trim()) e.couple.push(t("builder.couple.errBride"));
  if (!state.groomName.trim()) e.couple.push(t("builder.couple.errGroom"));
  if (!state.weddingDate) e.date.push(t("builder.date.errDate"));
  if (!state.weddingTime) e.date.push(t("builder.date.errTime"));
  if (!state.venueName.trim()) e.venue.push(t("builder.venue.err"));
  return e;
}

// Re-export the form components so other places (preview) can import them if
// needed. These are placeholders to keep the build pipeline small.
export { MapPin, Phone, X };
