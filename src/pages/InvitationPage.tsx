import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, MapPin, Share2, Music, Volume2, VolumeX, Play, Pause } from "lucide-react";
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

/** Per-slug preference: whether the guest left music muted / playing. Lets the
 *  track resume in the same state after a refresh or reopen. */
const MUSIC_PREF = (slug: string) => `vowly:music-pref:${slug}`;

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

  // ---- background music state ----
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicBlocked, setMusicBlocked] = useState(false); // autoplay blocked → show manual play
  const [musicFailed, setMusicFailed] = useState(false); // url unreachable (404/403/400)
  const musicUrlRef = useRef<string | null>(null);
  const triedLocalRef = useRef(false);

  // Stop any background music when leaving the invitation.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Recover the picked music file from IndexedDB (per-device fallback persisted
  // at create time). The primary source is the server `music_url`; this is only
  // used if that is empty (e.g. storage was unreachable at create time).
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

  // Restore the guest's last mute/play preference for this invitation.
  useEffect(() => {
    if (!data?.slug) return;
    try {
      const raw = window.localStorage.getItem(MUSIC_PREF(data.slug));
      if (raw) {
        const pref = JSON.parse(raw) as { muted?: boolean; playing?: boolean };
        if (typeof pref.muted === "boolean") setMusicMuted(pref.muted);
      }
    } catch {
      /* ignore */
    }
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

  // Type-safe read (music_url column now exists in the generated types).
  const musicUrl = data.music_url || null;
  musicUrlRef.current = musicUrl;
  // Prefer the server URL; fall back to the locally-stored file so music keeps
  // working on the device that created it even without a working storage backend.
  const effectiveMusicUrl = musicUrl || localMusicUrl;

  const savePref = (muted: boolean, playing: boolean) => {
    if (!data.slug) return;
    try {
      window.localStorage.setItem(MUSIC_PREF(data.slug), JSON.stringify({ muted, playing }));
    } catch {
      /* ignore */
    }
  };

  // Resume playback on the very next user interaction if autoplay was blocked
  // (browsers only allow sound after a gesture — `video.onEnded` is not one).
  const armUnlock = () => {
    const handler = () => {
      const a = audioRef.current;
      if (a && a.paused) {
        a.play()
          .then(() => {
            setMusicBlocked(false);
            savePref(a.muted, true);
          })
          .catch(() => {});
      }
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("touchstart", handler);
    };
    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
  };

  const startMusic = async () => {
    const a = audioRef.current;
    if (!a || !effectiveMusicUrl) return;
    if (a.src !== effectiveMusicUrl) a.src = effectiveMusicUrl;
    a.loop = true;
    a.volume = musicMuted ? 0 : 0.7;
    try {
      await a.play();
      console.log(`[MUSIC] playback started -> ${effectiveMusicUrl}`);
      setMusicBlocked(false);
      savePref(musicMuted, true);
    } catch (e) {
      console.warn(`[MUSIC] autoplay blocked, waiting for user gesture`, e);
      setMusicBlocked(true);
      armUnlock();
    }
  };

  const dismissVideo = () => {
    if (!showVideo) return;
    setShowVideo(false);
    // Start the background music once the invitation is revealed.
    if (effectiveMusicUrl) startMusic();
  };

  const handleAudioError = () => {
    const a = audioRef.current;
    const src = a?.src ?? "";
    console.error(`[MUSIC] <audio> error (src=${src})`);
    // If the server URL failed but a local copy exists, try it once.
    if (musicUrl && localMusicUrl && src === musicUrl && !triedLocalRef.current) {
      triedLocalRef.current = true;
      console.warn(`[MUSIC] server url failed (likely 404/403), falling back to local copy`);
      a!.src = localMusicUrl;
      a!.play().catch(() => setMusicFailed(true));
      return;
    }
    setMusicFailed(true);
    setMusicBlocked(false);
  };

  const onTogglePlay = () => {
    const a = audioRef.current;
    if (!a || !effectiveMusicUrl) return;
    if (a.paused) {
      a.play()
        .then(() => {
          setMusicBlocked(false);
          savePref(a.muted, true);
        })
        .catch(() => setMusicBlocked(true));
    } else {
      a.pause();
      savePref(a.muted, false);
    }
  };

  const onToggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    const next = !a.muted;
    a.muted = next;
    a.volume = next ? 0 : 0.7;
    setMusicMuted(next);
    savePref(next, !a.paused);
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
        <button type="button" onClick={copyLink} className="inv-btn">
          <Share2 className="mr-1.5 inline h-3.5 w-3.5" /> {t("invitation.actions.copy")}
        </button>
      </div>

      {/* ---- background music control ---- */}
      {effectiveMusicUrl && !musicFailed && (
        <MusicController
          playing={musicPlaying}
          muted={musicMuted}
          blocked={musicBlocked}
          url={effectiveMusicUrl}
          onPlayPause={onTogglePlay}
          onMute={onToggleMute}
        />
      )}

      {/* Background music (single persistent <audio> element — never recreated
          per render or per section, so playback is uninterrupted). */}
      <audio
        ref={audioRef}
        className="hidden"
        loop
        preload="auto"
        onPlay={() => {
          setMusicPlaying(true);
          savePref(musicMuted, true);
        }}
        onPause={() => {
          setMusicPlaying(false);
          savePref(musicMuted, false);
        }}
        onError={handleAudioError}
      />
    </div>
  );
}

function MusicController({
  playing,
  muted,
  blocked,
  url,
  onPlayPause,
  onMute,
}: {
  playing: boolean;
  muted: boolean;
  blocked: boolean;
  url: string;
  onPlayPause: () => void;
  onMute: () => void;
}) {
  const showEq = playing && !muted;
  return (
    <div className="inv-music-ctrl" role="group" aria-label="Music control">
      <span className="inv-music-ctrl-icon">
        <Music className="h-4 w-4" />
      </span>

      {/* equalizer indicator — animates only while actually playing */}
      <span className={`inv-eq ${showEq ? "is-on" : ""}`} aria-hidden="true">
        <span className="inv-eq-bar" />
        <span className="inv-eq-bar" />
        <span className="inv-eq-bar" />
        <span className="inv-eq-bar" />
      </span>

      {blocked ? (
        <button
          type="button"
          className="inv-music-btn inv-music-btn--play"
          onClick={onPlayPause}
          aria-label="Play music"
          title="Play music"
        >
          <Play className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          className="inv-music-btn"
          onClick={onPlayPause}
          aria-label={playing ? "Pause music" : "Play music"}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      )}

      <button
        type="button"
        className="inv-music-btn"
        onClick={onMute}
        aria-label={muted ? "Unmute music" : "Mute music"}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
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
