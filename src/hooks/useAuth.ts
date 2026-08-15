// Re-export the shared auth implementation so existing imports keep working.
// The actual state now lives in a single <AuthProvider> context (see
// @/auth/AuthProvider) instead of a per-component hook instance, which removes
// the independent-subscription race that could blank the app after login.
export { useAuth, AuthProvider } from "@/auth/AuthProvider";
export type { AppRole, AuthContextValue } from "@/auth/AuthProvider";
