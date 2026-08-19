import { useEffect, useRef, useState } from "react";
import { MapPin, Music, Phone, RotateCw, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { BuilderState } from "../types";
import { useTranslation } from "@/i18n/LanguageContext";

type UpdateFn = <K extends keyof BuilderState>(
  key: K,
  value: BuilderState[K]
) => void;

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// ------------------ STEP 01 — COUPLE ------------------
export function CoupleForm({
  state,
  update,
  errors,
}: {
  state: BuilderState;
  update: UpdateFn;
  errors: string[];
}) {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="inv-step-title">
        {t("builder.couple.t1")} <em>&</em> {t("builder.couple.t2")}
      </h1>
      <p className="inv-step-sub">
        {t("builder.couple.sub")}
      </p>

      <div className="inv-field-row">
        <div className="inv-field">
          <label className="inv-label" htmlFor="groom">{t("builder.couple.groom")}</label>
          <input
            id="groom"
            className="inv-input"
            type="text"
            placeholder={t("builder.couple.groomPh")}
            value={state.groomName}
            onChange={(e) => update("groomName", e.target.value)}
            autoFocus
          />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="bride">{t("builder.couple.bride")}</label>
          <input
            id="bride"
            className="inv-input"
            type="text"
            placeholder={t("builder.couple.bridePh")}
            value={state.brideName}
            onChange={(e) => update("brideName", e.target.value)}
          />
        </div>
      </div>

      {errors.length > 0 && (
        <FieldErrors errors={errors} />
      )}
    </div>
  );
}

// ------------------ STEP 02 — DATE ------------------
export function DateForm({
  state,
  update,
  errors,
}: {
  state: BuilderState;
  update: UpdateFn;
  errors: string[];
}) {
  const { t, tList } = useTranslation();
  const weekdays = tList("builder.date.weekdays");
  const months = tList("builder.date.months");
  const dateObj = state.weddingDate ? new Date(`${state.weddingDate}T00:00:00`) : null;
  const isValid = dateObj && !Number.isNaN(dateObj.getTime());
  const weekday = isValid ? weekdays[dateObj.getDay()] : "—";
  const monthShort = isValid ? months[dateObj.getMonth()] : "—";

  return (
    <div>
      <h1 className="inv-step-title">
        {t("builder.date.t1")} <em>{t("builder.date.t2")}</em>
      </h1>
      <p className="inv-step-sub">
        {t("builder.date.sub")}
      </p>

      <div className="inv-field-row">
        <div className="inv-field">
          <label className="inv-label" htmlFor="wedding-date">{t("builder.date.label")}</label>
          <input
            id="wedding-date"
            className="inv-input inv-input-small"
            type="date"
            value={state.weddingDate}
            onChange={(e) => update("weddingDate", e.target.value)}
          />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="wedding-time">{t("builder.date.timeLabel")}</label>
          <input
            id="wedding-time"
            className="inv-input inv-input-small"
            type="time"
            value={state.weddingTime}
            onChange={(e) => update("weddingTime", e.target.value)}
          />
        </div>
      </div>

      {isValid && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inv-date-grid"
          style={{ marginTop: "0.4rem" }}
        >
          <div>
            <div className="inv-date-num">{String(dateObj.getDate()).padStart(2, "0")}</div>
            <div className="inv-date-meta">
              {monthShort} {dateObj.getFullYear()}
            </div>
          </div>
          <div>
            <div className="inv-date-meta" style={{ marginBottom: "0.4rem" }}>
              {weekday}
            </div>
            <div className="inv-date-num" style={{ fontSize: "1.8rem", color: "var(--vi-gold)" }}>
              {state.weddingTime || "19:00"}
            </div>
          </div>
        </motion.div>
      )}

      {errors.length > 0 && <FieldErrors errors={errors} />}
    </div>
  );
}

// ------------------ STEP 03 — VENUE ------------------
export function VenueForm({
  state,
  update,
  errors,
}: {
  state: BuilderState;
  update: UpdateFn;
  errors: string[];
}) {
  const { t } = useTranslation();
  const hasMap = !!state.mapsUrl;
  return (
    <div>
      <h1 className="inv-step-title">
        <em>{t("builder.venue.title")}</em>
      </h1>
      <p className="inv-step-sub">
        {t("builder.venue.sub")}
      </p>

      <div className="inv-field">
        <label className="inv-label" htmlFor="venue">{t("builder.venue.name")}</label>
        <input
          id="venue"
          className="inv-input"
          type="text"
          placeholder="Zarafshon Ceremony Hall"
          value={state.venueName}
          onChange={(e) => update("venueName", e.target.value)}
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="address">{t("builder.venue.address")}</label>
        <input
          id="address"
          className="inv-input inv-input-small"
          type="text"
          placeholder="Nukus shahri, Berdaq ko'chasi 12"
          value={state.address}
          onChange={(e) => update("address", e.target.value)}
        />
      </div>

      <div className="inv-field-row">
        <div className="inv-field">
          <label className="inv-label" htmlFor="phone">
            <Phone className="inline h-3 w-3" /> {t("builder.venue.phone")}
          </label>
          <input
            id="phone"
            className="inv-input inv-input-small"
            type="tel"
            placeholder="+998 90 123 45 67"
            value={state.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="maps">
            <MapPin className="inline h-3 w-3" /> {t("builder.venue.maps")}
          </label>
          <input
            id="maps"
            className="inv-input inv-input-small"
            type="url"
            placeholder="https://maps.google.com/..."
            value={state.mapsUrl}
            onChange={(e) => update("mapsUrl", e.target.value)}
          />
        </div>
      </div>

      {hasMap && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inv-btn inv-btn-primary"
          style={{ marginTop: "0.6rem", fontSize: "0.6rem", padding: "0.6rem 1.2rem" }}
        >
          <MapPin className="mr-1.5 inline h-3 w-3" /> {t("builder.venue.mapBtn")}
        </motion.div>
      )}

      {errors.length > 0 && <FieldErrors errors={errors} />}
    </div>
  );
}

// ------------------ STEP 04 — MESSAGE ------------------
export function MessageForm({
  state,
  update,
}: {
  state: BuilderState;
  update: UpdateFn;
}) {
  const { t } = useTranslation();
  const musicRef = useRef<HTMLInputElement>(null);

  // Allowed background-music formats (matches the upload pipeline).
  const ALLOWED_EXT = ["mp3", "wav", "m4a", "aac", "ogg"];

  const onMusicPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so the same file can be re-picked
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const okType = file.type.startsWith("audio/") || ALLOWED_EXT.includes(ext);
    if (!okType) {
      toast.error(t("builder.message.musicType"));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error(t("builder.message.musicTooLarge"));
      return;
    }
    console.log(`[MUSIC] picked ${file.name} (${file.type || ext}, ${file.size} bytes)`);
    update("music", file);
  };

  // Local preview of the picked track (not uploaded until the invitation is
  // published — this is just so the creator can confirm the right file).
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!state.music) {
      setPreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(state.music);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [state.music]);

  return (
    <div>
      <h1 className="inv-step-title">
        {t("builder.message.t1")} <em>{t("builder.message.t2")}</em>
      </h1>
      <p className="inv-step-sub">
        {t("builder.message.sub")}
      </p>

      <div className="inv-field">
        <label className="inv-label" htmlFor="welcome">{t("builder.message.welcome")}</label>
        <textarea
          id="welcome"
          className="inv-textarea"
          rows={3}
          placeholder="Hurmatli mehmonlar..."
          value={state.welcomeText}
          onChange={(e) => update("welcomeText", e.target.value)}
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="invitation">{t("builder.message.invitation")}</label>
        <textarea
          id="invitation"
          className="inv-textarea"
          rows={4}
          placeholder="Sizlarni to'yimizga taklif qilamiz..."
          value={state.invitationText}
          onChange={(e) => update("invitationText", e.target.value)}
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="final">{t("builder.message.final")}</label>
        <textarea
          id="final"
          className="inv-textarea"
          rows={2}
          placeholder="Sizni intizorlik bilan kutamiz..."
          value={state.finalText}
          onChange={(e) => update("finalText", e.target.value)}
        />
      </div>

      {/* ----- music picker ----- */}
      <div className="inv-field" style={{ marginTop: "0.8rem" }}>
        <label className="inv-label">
          <Music className="inline h-3 w-3" /> {t("builder.message.musicLabel")}
        </label>
        {state.music ? (
          <div className="inv-music-chip">
            <Music className="mr-1.5 inline h-3.5 w-3.5" />
            <span className="inv-music-name" title={state.music.name}>{state.music.name}</span>
            <span className="inv-music-size">{formatBytes(state.music.size)}</span>
            <button
              type="button"
              className="inv-music-remove"
              onClick={() => musicRef.current?.click()}
              aria-label={t("builder.message.musicReplace")}
              title={t("builder.message.musicReplace")}
            >
              <RotateCw className="h-3 w-3" />
            </button>
            <button
              type="button"
              className="inv-music-remove"
              onClick={() => update("music", null)}
              aria-label={t("builder.message.musicRemove")}
              title={t("builder.message.musicRemove")}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="inv-uploader-add"
            onClick={() => musicRef.current?.click()}
            style={{ width: "100%" }}
          >
            <Music className="h-5 w-5" />
            <span>{t("builder.message.musicUpload")}</span>
          </button>
        )}
        <input
          ref={musicRef}
          type="file"
          accept="audio/mp3,audio/wav,audio/x-m4a,audio/aac,audio/ogg,.mp3,.wav,.m4a,.aac,.ogg"
          className="hidden"
          onChange={onMusicPick}
          style={{ display: "none" }}
        />
        {state.music && previewUrl && (
          <audio className="inv-music-preview" controls src={previewUrl} preload="none" />
        )}
        <p className="inv-step-sub" style={{ marginTop: "0.4rem", fontSize: "0.62rem" }}>
          {state.music
            ? t("builder.message.musicStatus")
            : t("builder.message.musicHint")}
        </p>
      </div>
    </div>
  );
}

// ------------------ error list ------------------
function FieldErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        marginTop: "0.8rem",
        fontFamily: "Inter, sans-serif",
        fontSize: "0.72rem",
        color: "var(--vi-rose)",
        letterSpacing: "0.04em",
      }}
    >
      {errors.map((e) => (
        <div key={e}>— {e}</div>
      ))}
    </motion.div>
  );
}
