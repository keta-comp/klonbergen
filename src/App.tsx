import { Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LocalizedSeo from "@/components/seo/LocalizedSeo";
import { LanguageProvider, useTranslation } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/auth/AuthProvider";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { lazyWithRetry } from "@/lib/lazyRetry";

// Private/secondary routes are code-split so the public landing page ships less JS.
// `lazyWithRetry` (not React.lazy) makes these robust against transient dev-server
// fetch failures (e.g. stale Vite HMR cache-buster URLs after a dev restart), so
// the dashboard never permanently breaks with a "Failed to fetch dynamically
// imported module" error.
const LoginPage = lazyWithRetry(() => import("./pages/LoginPage"));
const SuperAdminDashboard = lazyWithRetry(() => import("./pages/SuperAdminDashboard"));
const HallAdminDashboard = lazyWithRetry(() => import("./pages/HallAdminDashboard"));
const GuestPage = lazyWithRetry(() => import("./pages/GuestPage"));
const InvitationBuilder = lazyWithRetry(() => import("./pages/InvitationBuilder"));
const InvitationPage = lazyWithRetry(() => import("./pages/InvitationPage"));

/** `/` → redirect to the active/detected locale. */
function RootRedirect() {
  const { locale } = useTranslation();
  return <Navigate to={`/${locale}`} replace />;
}

/** Keeps the i18n context in sync with the locale segment in the URL. */
function LocaleLayout() {
  const params = useParams();
  const urlLocale = params.locale;
  const { syncLocaleFromUrl } = useTranslation();

  useEffect(() => {
    if (isLocale(urlLocale)) syncLocaleFromUrl(urlLocale as Locale);
  }, [urlLocale, syncLocaleFromUrl]);

  if (!isLocale(urlLocale)) return <Navigate to={`/${DEFAULT_LOCALE}`} replace />;
  return <Outlet />;
}

/** Unprefixed (legacy) routes → same path under the active locale, preserving query + params. */
function LegacyRedirect({ to }: { to: string }) {
  const { pathname, search } = useLocation();
  const params = useParams();
  const { locale } = useTranslation();
  // Substitute EVERY `:param` segment (e.g. :slug, :hallId) with its real value
  // from the matched route. The previous code only replaced `:slug`, so routes
  // like `/hall/:hallId` kept the literal placeholder `:hallId` in the redirect
  // target — GuestPage then received the string ":hallId" and Supabase was
  // queried with `id=eq.:hallId` (HTTP 400 → "Toyxana tabılmadı").
  const target = to.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_m, key) => params[key] ?? "");
  return <Navigate to={`/${locale}${target}${search}`} replace />;
}

const queryClient = new QueryClient();

const App = () => (
  <LanguageProvider>
    <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Root → detected/default locale */}
            <Route path="/" element={<RootRedirect />} />

            {/* Locale-prefixed application */}
            <Route path="/:locale" element={<LocaleLayout />}>
              <Route
                index
                element={
                  <>
                    <LocalizedSeo page="home" />
                    <Index />
                  </>
                }
              />
              <Route
                path="login"
                element={
                  <>
                    <LocalizedSeo page="login" />
                    <LoginPage />
                  </>
                }
              />
              <Route
                path="super-admin"
                element={
                  <ProtectedRoute allow={["super_admin"]}>
                    <LocalizedSeo page="super-admin" noindex />
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute allow={["owner", "super_admin"]}>
                    <LocalizedSeo page="admin" noindex />
                    <HallAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="hall/:hallId" element={<GuestPage />} />
              <Route
                path="taklifnoma/yangi"
                element={
                  <>
                    <LocalizedSeo page="builder" />
                    <InvitationBuilder />
                  </>
                }
              />
              <Route
                path="taklifnoma/:slug"
                element={
                  <>
                    <LocalizedSeo page="invitation" />
                    <InvitationPage />
                  </>
                }
              />
              <Route
                path="*"
                element={
                  <>
                    <LocalizedSeo page="notFound" noindex />
                    <NotFound />
                  </>
                }
              />
            </Route>

            {/* Legacy unprefixed routes → locale-prefixed equivalents (no breakage) */}
            <Route path="/login" element={<LegacyRedirect to="/login" />} />
            <Route path="/super-admin" element={<LegacyRedirect to="/super-admin" />} />
            <Route path="/admin" element={<LegacyRedirect to="/admin" />} />
            <Route path="/hall/:hallId" element={<LegacyRedirect to="/hall/:hallId" />} />
            <Route path="/taklifnoma/yangi" element={<LegacyRedirect to="/taklifnoma/yangi" />} />
            <Route path="/taklifnoma/:slug" element={<LegacyRedirect to="/taklifnoma/:slug" />} />
            <Route path="/invitation/new" element={<LegacyRedirect to="/taklifnoma/yangi" />} />
            <Route path="/i/:slug" element={<LegacyRedirect to="/taklifnoma/:slug" />} />

            {/* Unmatched (unprefixed) → 404 */}
            <Route
              path="*"
              element={
                <>
                  <LocalizedSeo page="notFound" noindex />
                  <NotFound />
                </>
              }
            />
          </Routes>
        </Suspense>
        </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default App;
