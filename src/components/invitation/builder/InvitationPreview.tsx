import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { BuilderState } from "./types";
import FlowerDecor from "./FlowerDecor";

interface Props {
  state: BuilderState;
}

const STEP_BG: Record<string, string> = {
  couple: "/1.png",
  date: "/1.png",
  venue: "/3.png",
  message: "/2.png",
  final: "/4.png",
};

const WEEKDAYS = ["Yak", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
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

export default function InvitationPreview({ state }: Props) {
  const d = fmtDate(state.weddingDate);
  const target = state.weddingDate && state.weddingTime
    ? new Date(`${state.weddingDate}T${state.weddingTime}:00`)
    : new Date(`${new Date().toISOString().slice(0, 10)}T19:00:00`);
  const cd = useCountdown(target);

  const bride = state.brideName.trim() || "Kelin";
  const groom = state.groomName.trim() || "Kuyov";
  const venue = state.venueName.trim() || "Toy markazi";
  const address = state.address.trim() || "Manzil";
  const time = state.weddingTime || "19:00";
  const dateLabel = state.weddingDate
    ? `${d.day}.${String(new Date(state.weddingDate).getMonth() + 1).padStart(2, "0")}.${d.year}`
    : "01.10.2026";

  return (
    <div className="inv-phone" aria-hidden="true">
      <div className="inv-phone-notch" />
      <div className="inv-phone-screen">
        <div className="inv-screens">
          {/* SCREEN 01 — cover with names + date */}
          <Screen bg="/1.png">
            <FlowerDecor variant="cover" />
            <div className="inv-screen-overlay inv-screen-overlay--center">
              <p className="inv-overlay-eyebrow">Sanlı mirátnama</p>
              <h3 className="inv-overlay-names">
                {groom}
                <span className="inv-overlay-amp">&</span>
                {bride}
              </h3>
              <p className="inv-overlay-date">{dateLabel}</p>
              <p className="inv-overlay-meta" style={{ marginTop: "0.5rem" }}>
                {time} · {venue}
              </p>
            </div>
          </Screen>

          {/* SCREEN 02 — greeting + calendar */}
          <Screen bg="/2.png">
            <FlowerDecor variant="greeting" />
            <div className="inv-screen-overlay inv-screen-overlay--top">
              <p className="inv-overlay-eyebrow">Hurmatlı mehmonlar</p>
              <h3 className="inv-overlay-final">{state.welcomeText || "Hurmatli mehmonlar..."}</h3>
              <p className="inv-overlay-text">{state.invitationText}</p>
            </div>
            <div
              className="inv-screen-overlay"
              style={{ justifyContent: "flex-end", paddingBottom: "16%" }}
            >
              <div className="inv-overlay-eyebrow" style={{ marginBottom: 0 }}>
                {d.month}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", marginTop: "0.1rem" }}>
                <span className="inv-overlay-names" style={{ fontSize: "1.7rem" }}>
                  {d.day}
                </span>
                <span className="inv-overlay-meta">{d.weekday}</span>
                <span className="inv-overlay-meta">{d.year}</span>
              </div>
            </div>
          </Screen>

          {/* SCREEN 03 — venue */}
          <Screen bg="/3.png">
            <FlowerDecor variant="venue" />
            <div className="inv-screen-overlay">
              <p className="inv-overlay-eyebrow">Toy markazı</p>
              <h3 className="inv-overlay-names" style={{ fontStyle: "normal", fontSize: "1.4rem" }}>
                {venue}
              </h3>
              <p className="inv-overlay-meta" style={{ marginTop: "0.4rem" }}>
                {time}
              </p>
              <p className="inv-overlay-text">{address}</p>
              {state.phone && (
                <p className="inv-overlay-meta" style={{ marginTop: "0.3rem" }}>
                  {state.phone}
                </p>
              )}
              <div className="inv-btn inv-btn-primary" style={{ marginTop: "0.8rem", fontSize: "0.5rem", padding: "0.4rem 0.9rem" }}>
                Xarıtada kóriw
              </div>
            </div>
          </Screen>

          {/* SCREEN 04 — final + countdown */}
          <Screen bg="/4.png">
            <FlowerDecor variant="final" />
            <div className="inv-screen-overlay inv-screen-overlay--center">
              <p className="inv-overlay-eyebrow">Sizni intizorlık penen kútamız</p>
              <h3 className="inv-overlay-final">{state.finalText || "Sizni intizorlik bilan kutamiz"}</h3>
              <div className="inv-overlay-countdown">
                {[
                  { v: cd.days, l: "kún" },
                  { v: cd.hours, l: "saat" },
                  { v: cd.minutes, l: "minut" },
                  { v: cd.seconds, l: "sekund" },
                ].map((c) => (
                  <div key={c.l} style={{ textAlign: "center" }}>
                    <div className="inv-overlay-cd-num">{String(c.v).padStart(2, "0")}</div>
                    <div className="inv-overlay-cd-label">{c.l}</div>
                  </div>
                ))}
              </div>
              <p
                className="inv-overlay-final"
                style={{ marginTop: "1.2rem", fontFamily: '"Great Vibes", cursive', fontSize: "1.4rem" }}
              >
                {groom}
                <span className="inv-overlay-amp" style={{ margin: "0 0.2rem" }}>
                  &
                </span>
                {bride}
              </p>
            </div>
          </Screen>
        </div>
      </div>
    </div>
  );
}

function Screen({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <motion.div
      className="inv-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <img src={bg} alt="" className="inv-screen-bg" draggable={false} />
      {children}
    </motion.div>
  );
}
