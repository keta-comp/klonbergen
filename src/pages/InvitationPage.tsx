import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Seo, { SITE_URL } from "@/components/seo/Seo";
import { useInvitation } from "@/hooks/useInvitations";
import { idbGet } from "@/lib/idb";
import FlowerDecor from "@/components/invitation/builder/FlowerDecor";
import { useTranslation } from "@/i18n/LanguageContext";

const WEEKDAYS = ["Yak", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
const MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

function fmtDate(iso: string) {
  if (!iso) return { day: "01", month: "oktabr", year: "2026", weekday: "Du" };
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { day: "01", month: "oktabr", year: "2026", weekday: "Du" };
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: MONTHS[d.getMonth()],
    year: String(d.getFullYear()),
    weekday: WEEKDAYS[(d.getDay() + 6) % 7],
  };
}

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function InvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading } = useInvitation(slug);

  // Hooks must run unconditionally — call before any early return.
  // When data is missing or still loading, target a far-future date so the
  // countdown is benign (always showing the max remaining).
  // Postgres `time` may come back as "HH:MM:SS" — strip to "HH:MM" before
  // composing the ISO string, otherwise we get "T18:00:00:00" → Invalid.
  const rawTime = (data?.wedding_time ?? "00:00").slice(0, 5);
  const safeDate =
    data?.wedding_date
      ? new Date(`${data.wedding_date}T${rawTime}:00`)
      : new Date("2099-12-31T00:00:00");
  const cd = useCountdown(safeDate);

  // Intro video gate: shows /mobile.mp4 on entry, dismissed on tap. Once
  // dismissed we reveal the invitation and (if present) start the music.
  const [showVideo, setShowVideo] = useState(true);
  const [videoStarted, setVideoStarted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Stop any background music when leaving the invitation.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Recover the picked music file from IndexedDB (persisted at create time). This
  // is the reliable source of the background track — the Supabase storage upload
  // can be blocked by missing RLS, so `music_url` is often empty. Reading the
  // local File back lets the music survive a refresh of the published page.
  const [localMusicUrl, setLocalMusicUrl] = useState<string | null>(null);
  const localMusicRef = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    if (data?.slug) {
      idbGet<File | Blob>(`vowly_invitation_music_${data.slug}`)
        .then((file) => {
          if (!active || !file) return;
          const url = URL.createObjectURL(file as Blob);
          localMusicRef.current = url;
          setLocalMusicUrl(url);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
      if (localMusicRef.current) {
        URL.revokeObjectURL(localMusicRef.current);
        localMusicRef.current = null;
      }
    };
  }, [data?.slug]);

  if (isLoading) return <LoadingSpinner />;

  if (!data) {
    return (
      <div className="inv-shell">
        <Seo title={`${t("invitation.notFound.title")} — Vowly`} description={t("invitation.notFound.desc")} path="/taklifnoma" noindex />
        <div className="inv-success">
          <h1 className="inv-step-title">{t("invitation.notFound.title")}</h1>
          <p className="inv-step-sub">{t("invitation.notFound.sub")}</p>
          <Button
            onClick={() => navigate("/taklifnoma/yangi")}
            className="inv-btn inv-btn-primary"
          >
            {t("invitation.notFound.cta")}
          </Button>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/taklifnoma/${data.slug}`;
  const d = fmtDate(data.wedding_date);
  const dateLabel = `${d.day}.${String(new Date(data.wedding_date).getMonth() + 1).padStart(2, "0")}.${d.year}`;
  const mapsUrl = data.maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${data.hall_name} ${data.address || ""}`.trim()
    )}`;

  const welcomeText = data.welcome_text || t("invitation.defaults.welcome");
  const invitationText = data.invitation_text || t("invitation.defaults.invitation");
  const finalText = data.final_text || t("invitation.defaults.final");
  const musicUrl = (data as { music_url?: string | null }).music_url || null;
  // Prefer the server URL, but fall back to the locally-stored file so music
  // keeps working (and keeps playing) even without a working storage backend.
  const effectiveMusicUrl = musicUrl || localMusicUrl;

  const dismissVideo = () => {
    if (!showVideo) return;
    setShowVideo(false);
    // Start the background music once the invitation is revealed. Browsers
    // require a user gesture for audio, and the tap that dismisses the gate
    // satisfies that, so playback should succeed.
    if (effectiveMusicUrl && audioRef.current) {
      audioRef.current.src = effectiveMusicUrl;
      audioRef.current.loop = true;
      audioRef.current.volume = 0.7;
      audioRef.current.play().catch(() => {
        /* autoplay blocked — user can still tap elsewhere; harmless */
      });
    }
  };

  // Intro video gate — the envelope video does NOT autoplay. The bottom
  // "BOSING" button is the only trigger: tapping it starts muted autoplay,
  // the button hides, and the video's `onEnded` reveals the invitation with a
  // short fade/scale. If the video can't load/play we surface a fallback CTA.
  const startVideo = () => {
    if (!showVideo || videoStarted) return;
    setVideoStarted(true);
    const v = videoRef.current;
    if (!v) { setVideoError(true); return; }
    const p = v.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => setVideoError(true));
    }
  };
  const handleVideoError = () => setVideoError(true);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("invitation.copyOk"));
    } catch {
      toast.error(t("invitation.copyFail"));
    }
  };

  return (
    <div className="inv-final">
      <Seo
        title={`${data.bride_name} & ${data.groom_name} — ${t("invitation.seo.titleSuffix")}`}
        description={t("invitation.seo.desc", { bride: data.bride_name, groom: data.groom_name, hall: data.hall_name })}
        path={`/taklifnoma/${data.slug}`}
        image={data.photos?.[0] || `${SITE_URL}/1.png`}
      />

      {/* Intro video gate — envelope /mobile.mp4. No autoplay, no center play
          icon. The bottom "BOSING" button starts the video; on end the gate
          fades + scales out to reveal the invitation. */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            className="inv-video-gate"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <video
              ref={videoRef}
              className="inv-video-el"
              src="/mobile.mp4"
              muted
              playsInline
              preload="auto"
              onEnded={dismissVideo}
              onError={handleVideoError}
            />
            {!videoStarted && !videoError && (
              <button
                type="button"
                className="inv-video-cta"
                onClick={startVideo}
              >
                {t("invitation.video.start")}
              </button>
            )}
            {videoError && (
              <button
                type="button"
                className="inv-video-cta inv-video-cta--fallback"
                onClick={dismissVideo}
              >
                {t("invitation.video.fallback")}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="inv-final-stack">
        {/* SCREEN 01 — cover */}
        <Screen bg="/1.png">
          <FlowerDecor variant="cover" />
          <div className="inv-screen-overlay inv-screen-overlay--cover">
            <p className="inv-overlay-eyebrow">{t("invitation.cover.eyebrow")}</p>
            <h3 className="inv-overlay-names inv-cover-names">
              {data.bride_name}
              <span className="inv-overlay-amp">&</span>
              {data.groom_name}
            </h3>
            <p className="inv-overlay-date inv-cover-date">{dateLabel}</p>
            <p className="inv-overlay-meta" style={{ marginTop: "0.5rem" }}>
              {data.wedding_time.slice(0, 5)} · {data.hall_name}
            </p>
          </div>
        </Screen>

        <Divider />

        {/* SCREEN 02 — venue info centered in the open middle, maps button
            anchored to the bottom */}
        <Screen bg="/2.png">
          <FlowerDecor variant="venue" />
          <div className="inv-screen-overlay inv-screen-overlay--venue">
            <div className="inv-venue-body">
              <p className="inv-overlay-eyebrow">{t("invitation.venue.eyebrow")}</p>
              <h3 className="inv-venue-name">{data.hall_name}</h3>
              <p className="inv-overlay-meta" style={{ marginTop: "0.6rem" }}>
                {data.wedding_time.slice(0, 5)}
              </p>
              {data.address && <p className="inv-overlay-text">{data.address}</p>}
              {data.phone && (
                <p className="inv-overlay-meta" style={{ marginTop: "0.5rem" }}>
                  {data.phone}
                </p>
              )}
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inv-btn inv-btn-primary inv-venue-maps"
            >
              <MapPin className="mr-1.5 inline h-3.5 w-3.5" /> {t("invitation.venue.mapBtn")}
            </a>
          </div>
        </Screen>

        <Divider />

        {/* SCREEN 03 — invitation text pushed up, clear of the doves */}
        <Screen bg="/3.png">
          <FlowerDecor variant="greeting" />
          <div className="inv-screen-overlay inv-screen-overlay--invitation">
            <p className="inv-overlay-eyebrow">{t("invitation.greeting.eyebrow")}</p>
            <h3 className="inv-overlay-final">{welcomeText}</h3>
            <p className="inv-overlay-text">{invitationText}</p>
          </div>
        </Screen>

        <Divider />

        {/* SCREEN 04 — final + timeline */}
        <Screen bg="/4.png">
          <FlowerDecor variant="final" />
          <div className="inv-screen-overlay inv-screen-overlay--center">
            <p className="inv-overlay-eyebrow">{t("invitation.final.eyebrow")}</p>
            <h3 className="inv-overlay-final">{finalText}</h3>

            {/* visual timeline */}
            <div className="inv-timeline">
              {[
                { v: cd.days, l: t("invitation.timeline.day") },
                { v: cd.hours, l: t("invitation.timeline.hour") },
                { v: cd.minutes, l: t("invitation.timeline.minute") },
                { v: cd.seconds, l: t("invitation.timeline.second") },
              ].map((c) => (
                <div key={c.l} className="inv-timeline-node">
                  <div className="inv-timeline-dot" />
                  <div className="inv-timeline-num">
                    {Number.isFinite(c.v) ? String(c.v).padStart(2, "0") : "—"}
                  </div>
                  <div className="inv-timeline-label">{c.l}</div>
                </div>
              ))}
            </div>

            <p
              className="inv-overlay-final"
              style={{
                marginTop: "1.4rem",
                fontFamily: '"Great Vibes", cursive',
                fontStyle: "normal",
                fontSize: "clamp(1.6rem, 4.5vw, 2.2rem)",
              }}
            >
              {data.bride_name}
              <span className="inv-overlay-amp" style={{ margin: "0 0.3rem" }}>
                &
              </span>
              {data.groom_name}
            </p>
          </div>
        </Screen>
      </div>

      <div className="inv-final-actions">
        <Link to="/taklifnoma/yangi" className="inv-btn">
          <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" /> {t("invitation.actions.create")}
        </Link>
        <button onClick={copyLink} className="inv-btn">
          <Share2 className="mr-1.5 inline h-3.5 w-3.5" /> {t("invitation.actions.copy")}
        </button>
      </div>

      {/* Background music (started after the video gate is dismissed). */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

function Screen({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="inv-final-screen"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <img src={bg} alt="" className="inv-screen-bg" />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function Divider() {
  return <div className="inv-final-divider" />;
}
