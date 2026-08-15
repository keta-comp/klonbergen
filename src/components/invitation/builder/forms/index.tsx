import { useRef } from "react";
import { ImagePlus, MapPin, Music, Phone, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type {
  BuilderState,
  InvitationTemplateId,
} from "../types";
import { useTranslation } from "@/i18n/LanguageContext";

type UpdateFn = <K extends keyof BuilderState>(
  key: K,
  value: BuilderState[K]
) => void;

const TEMPLATES: { id: InvitationTemplateId; label: string; asset: string }[] = [
  { id: "t1", label: "Template 01", asset: "/1.png" },
  { id: "t2", label: "Template 02", asset: "/2.png" },
  { id: "t3", label: "Template 03", asset: "/3.png" },
  { id: "t4", label: "Template 04", asset: "/4.png" },
];

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
          <label className="inv-label" htmlFor="bride">{t("builder.couple.bride")}</label>
          <input
            id="bride"
            className="inv-input"
            type="text"
            placeholder="Aygúl"
            value={state.brideName}
            onChange={(e) => update("brideName", e.target.value)}
            autoFocus
          />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="groom">{t("builder.couple.groom")}</label>
          <input
            id="groom"
            className="inv-input"
            type="text"
            placeholder="Marat"
            value={state.groomName}
            onChange={(e) => update("groomName", e.target.value)}
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

  const onMusicPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      toast.error(t("builder.message.musicTooLarge"));
      return;
    }
    update("music", file);
  };

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
            <span className="inv-music-name">{state.music.name}</span>
            <button
              type="button"
              className="inv-music-remove"
              onClick={() => update("music", null)}
              aria-label={t("builder.message.musicRemove")}
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
          accept="audio/*"
          className="hidden"
          onChange={onMusicPick}
          style={{ display: "none" }}
        />
        <p className="inv-step-sub" style={{ marginTop: "0.4rem", fontSize: "0.62rem" }}>
          {t("builder.message.musicHint")}
        </p>
      </div>
    </div>
  );
}

// ------------------ STEP 05 — GALLERY ------------------
export function GalleryForm({
  state,
  update,
}: {
  state: BuilderState;
  update: UpdateFn;
}) {
  const { t } = useTranslation();
  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const readFiles = (files: FileList | null) =>
    Array.from(files ?? [])
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 6);

  const onCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return;
    const url = URL.createObjectURL(file);
    update("coverImage", url);
  };

  const onGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = readFiles(e.target.files);
    if (files.length === 0) return;
    files.forEach((f) => {
      if (f.size > 8 * 1024 * 1024) return;
      const url = URL.createObjectURL(f);
      update("galleryImages", [...state.galleryImages, url]);
    });
  };

  return (
    <div>
      <h1 className="inv-step-title">
        {t("builder.gallery.t1")} <em>{t("builder.gallery.t2")}</em>
      </h1>
      <p className="inv-step-sub">
        {t("builder.gallery.sub")}
      </p>

      <p className="inv-label" style={{ marginBottom: "0.6rem" }}>
        {t("builder.gallery.cover")}
      </p>
      <div className="inv-uploader" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        {state.coverImage ? (
          <div className="inv-uploader-tile">
            <img src={state.coverImage} alt="Cover" />
            <button
              type="button"
              className="inv-uploader-tile-remove"
              onClick={() => update("coverImage", null)}
              aria-label={t("builder.gallery.remove")}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="inv-uploader-add"
            onClick={() => coverRef.current?.click()}
          >
            <ImagePlus className="h-5 w-5" />
            <span>{t("builder.gallery.coverAdd")}</span>
          </button>
        )}
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onCoverPick}
          style={{ display: "none" }}
        />
      </div>

      <div className="inv-divider" />

      <p className="inv-label" style={{ marginBottom: "0.6rem" }}>
        {t("builder.gallery.gallery")}
      </p>
      <div className="inv-uploader">
        {state.galleryImages.map((src, i) => (
          <div key={i} className="inv-uploader-tile">
            <img src={src} alt={t("builder.gallery.alt", { n: i + 1 })} />
            <button
              type="button"
              className="inv-uploader-tile-remove"
              onClick={() =>
                update(
                  "galleryImages",
                  state.galleryImages.filter((_, idx) => idx !== i)
                )
              }
              aria-label={t("builder.gallery.remove")}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {state.galleryImages.length < 6 && (
          <button
            type="button"
            className="inv-uploader-add"
            onClick={() => galleryRef.current?.click()}
          >
            <ImagePlus className="h-5 w-5" />
            <span>{t("builder.gallery.add")}</span>
          </button>
        )}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onGalleryPick}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

// ------------------ STEP 06 — TEMPLATE ------------------
export function TemplateSelector({
  state,
  update,
}: {
  state: BuilderState;
  update: UpdateFn;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="inv-step-title">
        {t("builder.template.t1")} <em>{t("builder.template.t2")}</em>
      </h1>
      <p className="inv-step-sub">
        {t("builder.template.sub")}
      </p>

      <div className="inv-templates">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => update("templateId", tpl.id)}
            className={`inv-template ${state.templateId === tpl.id ? "is-active" : ""}`}
          >
            <img src={tpl.asset} alt={tpl.label} className="inv-template-img" />
            <div className="inv-template-label">
              <span>{t("builder.template.label", { n: tpl.id.replace("t", "") })}</span>
              {state.templateId === tpl.id && (
                <span style={{ color: "var(--vi-gold)" }}>{t("builder.template.selected")}</span>
              )}
            </div>
          </button>
        ))}
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
