// Temporary diagnostic store for the Vowly music upload flow.
//
// This exists ONLY to capture what a REAL Android (Telegram) file picker
// actually delivers, so we can stop guessing. It is a plain module-level
// singleton (not React state) so both the picker (forms/index.tsx) and the
// uploader (useInvitations.ts) can write to it.
//
// Visibility is gated by `musicDebugEnabled()` — dev builds, the `?debug`
// URL query param, or `localStorage["vowly:music-debug"]="1"`. That last
// flag lets a production/Vercel build show the panel too, without polluting
// normal users. Remove this file once the Android case is confirmed fixed.

export interface MusicDebugState {
  fileName: string;
  fileType: string;
  fileSize: number | null;
  fileLastModified: number | null;
  isFile: boolean;
  isBlob: boolean;
  ctor: string;
  ext: string;
  detectedMime: string;
  magic: string;
  validation: string;
  uploadStatus: string;
  uploadError: string;
  uploadPath: string;
  uploadUrl: string;
  uploadContentType: string;
  log: string[];
}

export const musicDebug: MusicDebugState = {
  fileName: "",
  fileType: "",
  fileSize: null,
  fileLastModified: null,
  isFile: false,
  isBlob: false,
  ctor: "",
  ext: "",
  detectedMime: "",
  magic: "",
  validation: "",
  uploadStatus: "",
  uploadError: "",
  uploadPath: "",
  uploadUrl: "",
  uploadContentType: "",
  log: [],
};

export function musicDebugEnabled(): boolean {
  try {
    // @ts-ignore - import.meta.env exists in Vite builds
    if (import.meta.env && import.meta.env.DEV) return true;
  } catch {
    /* noop */
  }
  try {
    if (new URLSearchParams(window.location.search).has("debug")) return true;
    if (localStorage.getItem("vowly:music-debug") === "1") return true;
  } catch {
    /* noop */
  }
  return false;
}

export function musicDebugReset() {
  musicDebug.fileName = "";
  musicDebug.fileType = "";
  musicDebug.fileSize = null;
  musicDebug.fileLastModified = null;
  musicDebug.isFile = false;
  musicDebug.isBlob = false;
  musicDebug.ctor = "";
  musicDebug.ext = "";
  musicDebug.detectedMime = "";
  musicDebug.magic = "";
  musicDebug.validation = "";
  musicDebug.uploadStatus = "";
  musicDebug.uploadError = "";
  musicDebug.uploadPath = "";
  musicDebug.uploadUrl = "";
  musicDebug.uploadContentType = "";
}

export function musicDebugLog(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  musicDebug.log.push(line);
  if (musicDebug.log.length > 200) musicDebug.log.shift();
  // Always log to console too — visible via Chrome remote debugging on Android.
  // eslint-disable-next-line no-console
  console.log("[MUSIC-DEBUG]", msg);
}
