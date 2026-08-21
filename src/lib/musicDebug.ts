// Temporary mobile debugging mode for Vowly.
//
// VISIBLE ONLY when the page is opened with `?debug=1` (or, as an explicit
// opt-in, `localStorage["vowly:music-debug"]="1"`). In every normal production
// state this returns `false` and the debug overlay is never rendered, so it
// does not affect real users. The code is intentionally kept in the production
// bundle (no compile-time `import.meta.env.DEV` gate) so you can open a live
// Vercel URL with `?debug=1` on your phone and watch real-device diagnostics.
//
// It captures two things:
//   1. Music-upload diagnostics — what the Android / Telegram file picker
//      REALLY delivered (name, type, size, MIME, extension, detected format,
//      validation result, upload error).
//   2. A live Console — a capture of the browser's console.* output, so you
//      can read real errors on a phone where devtools is hard to reach.
//
// REMOVE THIS FILE + DebugOverlay once the Android case is confirmed.

export interface MusicDebugState {
  // ----- music-upload diagnostics (the requested fields) -----
  name: string; // original file.name
  type: string; // browser-reported file.type
  size: number | null; // file.size in bytes
  mime: string; // MIME used for the (normalized) upload
  extension: string; // detected / used extension
  detectedFormat: string; // magic-byte sniff: mp3 | wav | m4a | aac | ogg | NONE
  validation: string; // validation result string
  uploadStatus: string; // uploading | OK | ERROR | ""
  uploadError: string; // upload error detail
  // ----- extra deep diagnostics -----
  lastModified: number | null;
  isFile: boolean;
  isBlob: boolean;
  ctor: string;
  bytesRead: string; // READ OK (N B) | READ FAIL | skip (healthy)
  uploadPath: string;
  uploadUrl: string;
  uploadContentType: string;
  log: string[]; // narrative music-flow log
}

export const musicDebug: MusicDebugState = {
  name: "",
  type: "",
  size: null,
  mime: "",
  extension: "",
  detectedFormat: "",
  validation: "",
  uploadStatus: "",
  uploadError: "",
  lastModified: null,
  isFile: false,
  isBlob: false,
  ctor: "",
  bytesRead: "",
  uploadPath: "",
  uploadUrl: "",
  uploadContentType: "",
  log: [],
};

// Live capture of the browser console, shown in the "Console" section of the
// overlay so phone users can read real errors without remote devtools.
export const consoleLog: string[] = [];

function safeStringify(v: unknown): string {
  if (v instanceof Error) return v.stack || v.message;
  if (typeof v === "object" && v !== null) {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

let consolePatched = false;
function installConsoleCapture() {
  if (consolePatched) return;
  consolePatched = true;
  const orig = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };
  const push = (level: string, args: unknown[]) => {
    try {
      const msg = args.map((a) => safeStringify(a)).join(" ");
      consoleLog.push(`[${level}] ${msg}`);
      if (consoleLog.length > 400) consoleLog.shift();
    } catch {
      /* noop */
    }
  };
  console.log = (...a) => {
    orig.log(...a);
    push("log", a);
  };
  console.warn = (...a) => {
    orig.warn(...a);
    push("warn", a);
  };
  console.error = (...a) => {
    orig.error(...a);
    push("error", a);
  };
  console.info = (...a) => {
    orig.info(...a);
    push("info", a);
  };
}

export function musicDebugEnabled(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("debug") === "1") {
      // Latch the flag so a client-side redirect that strips the query param
      // (e.g. the wizard rewriting ?step) can't silently turn debug off.
      try {
        localStorage.setItem("vowly:music-debug", "1");
      } catch {
        /* noop */
      }
      installConsoleCapture();
      return true;
    }
  } catch {
    /* noop */
  }
  try {
    if (localStorage.getItem("vowly:music-debug") === "1") {
      installConsoleCapture();
      return true;
    }
  } catch {
    /* noop */
  }
  return false;
}

export function musicDebugReset() {
  musicDebug.name = "";
  musicDebug.type = "";
  musicDebug.size = null;
  musicDebug.mime = "";
  musicDebug.extension = "";
  musicDebug.detectedFormat = "";
  musicDebug.validation = "";
  musicDebug.uploadStatus = "";
  musicDebug.uploadError = "";
  musicDebug.lastModified = null;
  musicDebug.isFile = false;
  musicDebug.isBlob = false;
  musicDebug.ctor = "";
  musicDebug.bytesRead = "";
  musicDebug.uploadPath = "";
  musicDebug.uploadUrl = "";
  musicDebug.uploadContentType = "";
}

export function musicDebugLog(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  musicDebug.log.push(line);
  if (musicDebug.log.length > 200) musicDebug.log.shift();
  // Also surface through the real console (captured by installConsoleCapture).
  console.log("[MUSIC-DEBUG]", msg);
}
