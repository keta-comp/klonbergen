import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "super_admin" | "owner" | "guest";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSuperAdmin: boolean;
  hallId: string | null;
  isHallAdmin: boolean;
  approved: boolean;
}

export interface AuthContextValue extends AuthState {
  /** Always a concrete value — never `undefined` — so guards can't crash on it. */
  role: AppRole;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  isSuperAdmin: false,
  hallId: null,
  isHallAdmin: false,
  approved: false,
};

/**
 * Single source of truth for authentication.
 *
 * Previously every component called a plain `useAuth()` hook, which created its
 * own Supabase subscription + `getSession()` and its own copy of auth state.
 * Because each instance resolved independently and asynchronously, different
 * components could momentarily disagree on `user` / `role` / `loading`, and — with
 * no error boundary in the app — any hiccup during that window unmounted the
 * entire React tree, producing the intermittent blank/white screen after login.
 *
 * This provider runs ONE subscription and ONE resolution pass, so every consumer
 * sees identical, consistent auth state.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    let active = true;

    const resolve = async (session: Session | null) => {
      const user = session?.user ?? null;

      if (!user) {
        if (!active) return;
        // Never clobber an already-resolved session with a transient null
        // (e.g. getSession() momentarily returning null while the auth-state
        // listener already delivered the session). This prevents the rare
        // redirect-to-404 race after a fresh OAuth callback.
        setState((prev) => (prev.user ? prev : { ...initialState, loading: false }));
        return;
      }

      // Expose the session immediately so guards stop blocking on auth.
      if (active) setState((prev) => ({ ...prev, user, session, loading: true }));

      try {
        const [roleRes, adminRes, profileRes] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "super_admin")
            .maybeSingle(),
          supabase
            .from("hall_admins")
            .select("hall_id")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("approved")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (!active) return;

        const isSuperAdmin = !!roleRes.data;
        setState({
          user,
          session,
          loading: false,
          isSuperAdmin,
          hallId: adminRes.data?.hall_id ?? null,
          isHallAdmin: !!adminRes.data,
          // Super admins are always allowed in; everyone else needs approval.
          approved: isSuperAdmin || !!profileRes.data?.approved,
        });
      } catch (err) {
        if (!active) return;
        // A transient query failure must never blank the app or trap the user in
        // a redirect loop. Keep the session, stop loading, and surface the error.
        console.error("[auth] role resolution failed", err);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    // ONE subscription for the whole app (no per-component instances). Guard the
    // result with optional chaining so a null `data` can never throw during the
    // effect — that throw previously had no boundary to catch it and blanked the
    // screen.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer Supabase calls out of the auth callback to avoid deadlocks.
      setTimeout(() => {
        if (active) void resolve(session);
      }, 0);
    });
    const subscription = data?.subscription;

    // Initial session read. Whichever source resolves first wins; the `active`
    // guard plus the no-clobber logic above keep the two in sync.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      void resolve(session);
    });

    return () => {
      active = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { lovable } = await import("@/integrations/lovable");
    // The OAuth redirect result is intentionally discarded — navigation is
    // handled by the auth state listener after the callback. Returning void
    // keeps the public `signInWithGoogle` contract simple and stable.
    return void (await lovable.auth.signInWithOAuth("google", {
      // Managed OAuth must return to the public origin. The hydrated auth
      // state below performs the role-based navigation after the callback.
      redirect_uri: window.location.origin,
    }));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const role: AppRole = state.isSuperAdmin
    ? "super_admin"
    : state.isHallAdmin
      ? "owner"
      : "guest";

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, role, signInWithGoogle, signOut }),
    [state, role, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
