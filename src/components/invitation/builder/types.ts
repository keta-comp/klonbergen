// Shared types for the new invitation builder. The existing useInvitations
// hook remains the source of truth for persistence; this module only types
// the in-memory builder state.

export type InvitationTemplateId = "t1" | "t2" | "t3" | "t4";

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
  coverImage: string | null;
  galleryImages: string[];
  templateId: InvitationTemplateId;
  music: File | null;
}

export interface BuilderStepMeta {
  id: "couple" | "date" | "venue" | "message" | "gallery" | "template";
  label: string;
  sub: string;
}
