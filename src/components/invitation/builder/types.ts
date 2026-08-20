// Shared types for the new invitation builder. The existing useInvitations
// hook remains the source of truth for persistence; this module only types
// the in-memory builder state.

export interface BuilderState {
  brideName: string;
  groomName: string;
  weddingDate: string; // YYYY-MM-DD
  weddingTime: string; // HH:MM
  venueName: string;
  address: string;
  phone: string;
  mapsUrl: string;
  welcomeText: string;
  invitationText: string;
  finalText: string;
  // `File` = picked from device; `string` = a direct audio URL pasted by the
  // user (works even inside restricted WebViews like Telegram's in-app browser
  // where the <input type=file> picker delivers empty/0-byte files).
  music: File | string | null;
}

export interface BuilderStepMeta {
  id: "couple" | "date" | "venue" | "message";
  label: string;
  sub: string;
}
