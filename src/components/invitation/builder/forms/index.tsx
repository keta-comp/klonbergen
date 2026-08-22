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
  // Second input: open the system file manager (Files / Documents) instead of
  // the media/audio picker. On some Android builds the media picker hands back
  // a content-URI File that the web can't read (0 bytes), while the document
  // picker returns real bytes from the phone's local storage.
  const filesRef = useRef<HTMLInputElement>(null);

  // Allowed background-music formats (matches the upload pipeline).
  const ALLOWED_EXT = ["mp3", "wav", "m4a", "aac", "ogg"];

  // Canonical MIME per extension — used to assign a correct, uploadable
  // content-type to Android / Telegram files that arrive with an EMPTY
  // `file.type` and no filename extension (content-URI display names).
  const EXT_TO_MIME: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    aac: "audio/aac",
    ogg: "audio/ogg",
  };

  // Detect a genuine audio file from its magic bytes. Last-resort check for
  // Android / files shared from Telegram that arrive with an EMPTY `file.type`
  // AND no usable filename extension (content-URI display names often do).
  const sniffAudioExt = (buf: ArrayBuffer): string | null => {
    const b = new Uint8Array(buf);
    if (b.length >= 3 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) return "mp3"; // ID3v2
    if (b.length >= 12) {
      if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
          b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45) return "wav"; // RIFF....WAVE
      if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return "m4a"; // ftyp box
    }
    if (b.length >= 4 &&
        b[0] === 0x4f && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53) return "ogg"; // OggS
    if (b.length >= 2) {
      if ((b[0] & 0xff) === 0xff && (b[1] & 0xf0) === 0xf0) return "aac"; // ADTS AAC
      if ((b[0] & 0xff) === 0xff && (b[1] & 0xe0) === 0xe0) return "mp3"; // MPEG audio frame
    }
    return null;
  };

  // Read a file's raw bytes. Different Android Chrome / WebView builds expose
  // different APIs reliably — some misreport `File.size` as 0 but still serve
  // bytes through a slice; some break FileReader but keep `Blob.arrayBuffer()`.
  // We try four strategies in order and return the first non-empty buffer:
  //   1. FileReader.readAsArrayBuffer on the full file
  //   2. FileReader on a 50 MB slice (forces the provider to materialise bytes)
  //   3. Blob.arrayBuffer() on the full file
  //   4. Blob.arrayBuffer() on the 50 MB slice
  // Resolves to null only if every strategy returns 0 bytes / fails.
  const readFileBytes = async (f: Blob): Promise<ArrayBuffer | null> => {
    const slice = f.slice(0, 50 * 1024 * 1024);
    const tryFileReader = (blob: Blob): Promise<ArrayBuffer | null> =>
      new Promise((res) => {
        try {
          const fr = new FileReader();
          fr.onload = () => res((fr.result as ArrayBuffer) ?? null);
          fr.onerror = () => res(null);
          fr.readAsArrayBuffer(blob);
        } catch {
          res(null);
        }
      });
    const tryArrayBuffer = async (blob: Blob): Promise<ArrayBuffer | null> => {
      try {
        if (typeof (blob as Blob & { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
          return await blob.arrayBuffer();
        }
      } catch {
        /* noop */
      }
      return null;
    };
    const strategies: Array<() => Promise<ArrayBuffer | null>> = [
      () => tryFileReader(f),
      () => tryFileReader(slice),
      () => tryArrayBuffer(f),
      () => tryArrayBuffer(slice),
    ];
    for (const strat of strategies) {
      const ab = await strat();
      if (ab && ab.byteLength > 0) return ab;
    }
    return null;
  };

  const onMusicPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so the same file can be re-picked
    if (!file) return;

    // ---- DO NOT reject on `file.size === 0` up front. On some Android Chrome
    // builds the <input type=file> picker returns a File whose `size` field is
    // misreported as 0 (a MediaStore `_SIZE` quirk) even though the REAL bytes
    // ARE available — `readAsArrayBuffer` still serves them. We verify by
    // actually reading the bytes below and ONLY reject if they are genuinely
    // empty.

    const rawExt = file.name.split(".").pop()?.toLowerCase() || "";
    const audioMime =
      !!file.type && file.type !== "application/octet-stream" && file.type.startsWith("audio/");

    // Size guard (every path).
    if (file.size > 12 * 1024 * 1024) {
      toast.error(t("builder.message.musicTooLarge"));
      return;
    }

    // Fast path: a genuinely healthy audio file (real audio MIME + known
    // extension AND a non-zero size) — the desktop / modern-mobile case. No
    // re-read needed. Files whose size is misreported as 0 fall through to the
    // byte-read path below, which recovers their real content.
    if (audioMime && ALLOWED_EXT.includes(rawExt) && file.size > 0) {
      console.log(`[MUSIC] picked ${file.name} (type=${file.type}, ${file.size} bytes)`);
      update("music", file);
      return;
    }

    // Android / Telegram path. Read the ACTUAL bytes — this defeats the empty
    // `file.type`, the missing extension, AND the content-URI display-name, and
    // lets us re-wrap the file into a real in-memory File with a guaranteed
    // extension + correct MIME that Supabase can read and tag.
    const bytes = await readFileBytes(file);
    if (!bytes) {
      toast.error(
        "Brauzer bu faylni o'qiy olmadi. Telefon xotirasidagi Files/Dokumentlar ilovasidan tanlang yoki audio havolasini (URL) qo'shing.",
        { duration: 8000 }
      );
      console.warn(`[MUSIC] REJECT: all read strategies returned 0 bytes / failed. Content-URI unreachable. UA=${typeof navigator !== "undefined" ? navigator.userAgent : "?"}`);
      return;
    }
    if (bytes.byteLength === 0) {
      toast.error(
        "Fayl bo'sh (0 bayt). Pastdagi «Telefon xotirasidan tanlash» tugmasi orqali Files/Dokumentlar ilovasidan tanlang yoki audio havolasini (URL) qo'shing.",
        { duration: 8000 }
      );
      console.warn(`[MUSIC] REJECT: 0 bytes actually read. Picker returned an empty file. UA=${typeof navigator !== "undefined" ? navigator.userAgent : "?"}`);
      return;
    }

    const sniffed = sniffAudioExt(bytes);
    if (!sniffed) {
      toast.error(t("builder.message.musicType"));
      return;
    }

    // Normalize: a fresh in-memory File with a guaranteed extension + correct MIME.
    const finalExt = sniffed;
    const finalMime = EXT_TO_MIME[sniffed] || "audio/mpeg";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "music";
    const finalName = `${baseName}.${finalExt}`;
    const normalized = new File([bytes], finalName, {
      type: finalMime,
      lastModified: (file as { lastModified?: number }).lastModified ?? Date.now(),
    });
    console.log(`[MUSIC] picked+normalized ${finalName} (type=${finalMime}, ${normalized.size} bytes)`);
    update("music", normalized);
  };

  // Local preview of the picked track (not uploaded until the invitation is
  // published — this is just so the creator can confirm the right file).
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [musicUrlInput, setMusicUrlInput] = useState("");
  useEffect(() => {
    if (typeof state.music === "string") {
      setPreviewSrc(state.music);
      return;
    }
    if (!state.music) {
      setPreviewSrc(null);
      return;
    }
    const u = URL.createObjectURL(state.music);
    setPreviewSrc(u);
    return () => URL.revokeObjectURL(u);
  }, [state.music]);

  // Alternative path that works even inside Telegram's in-app WebView, where
  // the <input type=file> picker delivers empty/0-byte files: the user pastes
  // a direct audio URL and we use it as the music source as-is.
  const onMusicUrlAdd = () => {
    const url = musicUrlInput.trim();
    if (!/^https?:\/\/.+/i.test(url)) {
      toast.error(t("builder.message.musicUrlInvalid"));
      return;
    }
    update("music", url);
    setMusicUrlInput("");
    toast.success(t("builder.message.musicUrlAdded"));
  };

  // Telegram Android WebView delivers 0-byte files via its in-app file picker,
  // so music uploads never work there. Warn once per session and point the user
  // to opening the page in their real browser (Chrome) instead.
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent || "";
    if (!/TelegramBot|TelegramAndroid|tgWeb/i.test(ua)) return;
    try { if (sessionStorage.getItem("vowly:tg-warned")) return; } catch { /* noop */ }
    try { sessionStorage.setItem("vowly:tg-warned", "1"); } catch { /* noop */ }
    toast.warning(
      "Telegram ichidagi brauzerda fayl yuklanmaydi. Audio havolasini (URL) qo'shing yoki Chrome'da oching.",
      { duration: 10000 }
    );
    console.warn(`[MUSIC] Telegram WebView detected (${ua}). File picker delivers 0-byte stubs here. Open in Chrome.`);
  }, []);

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
            <span className="inv-music-name" title={typeof state.music === "string" ? state.music : state.music.name}>{typeof state.music === "string" ? state.music : state.music.name}</span>
            <span className="inv-music-size">{typeof state.music === "string" ? "" : formatBytes(state.music.size)}</span>
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
          accept=".mp3,.wav,.m4a,.aac,.ogg,audio/*"
          className="hidden"
          onChange={onMusicPick}
          style={{ display: "none" }}
        />
        {/* Fallback picker: open the system file manager (Files / Documents)
            instead of the media/audio picker. Useful on Android when the audio
            picker returns an unreadable content-URI file (0 bytes). */}
        <input
          ref={filesRef}
          type="file"
          accept=".mp3,.wav,.m4a,.aac,.ogg,audio/*,*/*"
          className="hidden"
          onChange={onMusicPick}
          style={{ display: "none" }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="inv-uploader-add"
            onClick={() => filesRef.current?.click()}
            style={{ flex: "1 1 auto", fontSize: "0.72rem", padding: "0.55rem 0.9rem" }}
            title={t("builder.message.musicFilesHint")}
          >
            <Music className="h-4 w-4" />
            <span>{t("builder.message.musicFilesBtn")}</span>
          </button>
        </div>
        {/* Alternative: paste a direct audio URL — works inside Telegram's
            in-app WebView where the file picker delivers 0-byte files. */}
        <div className="inv-field" style={{ marginTop: "0.5rem" }}>
          <label className="inv-label">{t("builder.message.musicUrlLabel")}</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="inv-input"
              type="url"
              inputMode="url"
              placeholder={t("builder.message.musicUrlPlaceholder")}
              value={musicUrlInput}
              onChange={(e) => setMusicUrlInput(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button
              type="button"
              className="inv-uploader-add"
              onClick={onMusicUrlAdd}
              style={{ width: "auto", padding: "0 0.8rem", whiteSpace: "nowrap" }}
            >
              {t("builder.message.musicUrlButton")}
            </button>
          </div>
        </div>
        {state.music && previewSrc && (
          <audio className="inv-music-preview" controls src={previewSrc} preload="none" />
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
