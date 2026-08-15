import { useEffect, useRef, useState } from "react";

const OPENING_VIDEO = "/opening.mp4";

/**
 * Cinematic "open the invitation" intro — mirrors the experience in
 * vowly_landing_vowly_ultimate.html. A full-screen, muted film plays only
 * after the visitor taps/clicks; when it ends the site is revealed.
 * Reduced-motion visitors skip the intro entirely.
 */
export default function OpeningExperience() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const openedRef = useRef(false);
  const prevOverflowRef = useRef<string>("");
  const [playing, setPlaying] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [mounted, setMounted] = useState(true);

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Lock page scroll while the intro is on screen.
  useEffect(() => {
    if (prefersReduced) return;
    prevOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflowRef.current;
    };
  }, [prefersReduced]);

  // Explicitly restore scroll. Returning null from this component does NOT
  // unmount it (so the effect cleanup would not run), therefore we must
  // release the lock by hand.
  const unlock = () => {
    document.body.style.overflow = prevOverflowRef.current;
  };

  const reveal = () => {
    if (leaving || !mounted) return;
    setLeaving(true);
    // Release scroll + unmount after the CSS fade-out completes.
    window.setTimeout(() => {
      unlock();
      setMounted(false);
    }, 1300);
  };

  const open = async () => {
    if (openedRef.current) return;
    openedRef.current = true;
    setPlaying(true);
    const v = videoRef.current;
    if (!v) {
      reveal();
      return;
    }
    try {
      await v.play();
    } catch {
      // Autoplay policy interference (already interacted, so retry once).
      try {
        await v.play();
      } catch {
        reveal();
      }
    }
    if (!Number.isFinite(v.duration) || v.duration <= 0) reveal();
  };

  // Reduced-motion or already revealed -> render nothing.
  if (!mounted || prefersReduced) return null;

  return (
    <div
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Vowly mirátnama ashıw"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflow: "hidden",
        background: "#12100d",
        cursor: "pointer",
        opacity: leaving ? 0 : 1,
        visibility: leaving ? "hidden" : "visible",
        transition:
          "opacity 1.25s cubic-bezier(.22,.61,.36,1), visibility 1.25s",
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        onEnded={reveal}
        onError={reveal}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          filter: "saturate(.86) contrast(.98)",
          background: "#12100d",
        }}
      >
        <source src={OPENING_VIDEO} type="video/mp4" />
      </video>

      {/* Film grain + vignette texture */}
      <div
        className="vignette"
        style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
      />
      <div
        className="grain"
        style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", opacity: 0.07 }}
      />

      {/* Brand mark */}
      <div
        style={{
          position: "absolute",
          zIndex: 3,
          top: "6.5vh",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          color: "rgba(255,249,239,.92)",
          pointerEvents: "none",
          opacity: playing ? 0.18 : 1,
          transition: "opacity .6s ease",
        }}
      >
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, letterSpacing: ".04em" }}>
          Vowly
        </div>
        <div
          className="foil-rule"
          style={{ width: 38, height: 1, margin: "12px auto 0", background: "rgba(225,189,97,.8)" }}
        />
      </div>

      {/* Tap-to-open hint */}
      <div
        style={{
          position: "absolute",
          zIndex: 4,
          left: "50%",
          bottom: "7vh",
          transform: "translateX(-50%)",
          textAlign: "center",
          color: "#fff9ef",
          pointerEvents: "none",
          opacity: playing ? 0 : 1,
          transition: "opacity .5s ease, transform .5s ease",
        }}
      >
        <div
          style={{
            fontSize: 9,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#ead7a0",
            marginBottom: 13,
          }}
        >
          Ómirińizdegi eń ullı kún
        </div>
        <div
          style={{
            minWidth: 164,
            height: 48,
            padding: "0 22px",
            border: "1px solid rgba(255,249,239,.55)",
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "rgba(20,17,13,.18)",
            backdropFilter: "blur(12px)",
            fontSize: 9,
            letterSpacing: 2,
            textTransform: "uppercase",
            boxShadow: "0 12px 45px rgba(0,0,0,.16)",
          }}
        >
          <span
            className="animate-ring-pulse"
            style={{ width: 5, height: 5, borderRadius: "50%", background: "#e1bd61" }}
          />
          Mirátnama ashıw
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          zIndex: 4,
          right: "4vw",
          bottom: "4vh",
          color: "rgba(255,249,239,.48)",
          fontSize: 8,
          letterSpacing: 1.8,
          textTransform: "uppercase",
        }}
      >
        Tap anywhere to open
      </div>
    </div>
  );
}
