import { lazy, type ComponentType } from "react";

/**
 * Wrap React.lazy so a transient fetch failure self-heals instead of
 * permanently breaking the route.
 *
 * The browser-level "Failed to fetch dynamically imported module" error
 * (shown when a Vite dev server is restarted, the HMR cache-buster URL
 * (`?t=…`) is stale, or a network request is interrupted) is raised when
 * `import()` rejects. React then unmounts the chunk and the Suspense
 * fallback stays forever. There is no built-in retry path.
 *
 * This wrapper re-runs the loader up to a few times with a small backoff.
 * On the second attempt, Vite resolves the module fresh (the stale
 * cache-buster is dropped) and the page renders normally.
 *
 * If every attempt fails, the original error is rethrown so the existing
 * ErrorBoundary can still surface the diagnostic UI instead of a silent
 * blank screen.
 */
export function lazyWithRetry<T extends ComponentType<Record<string, never>> = ComponentType<Record<string, never>>>(
  loader: () => Promise<{ default: T }>,
) {
  const MAX_ATTEMPTS = 3;
  const BASE_DELAY_MS = 250;

  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let attempt = 0;

      const tryLoad = () => {
        attempt += 1;
        loader()
          .then(resolve)
          .catch((err) => {
            if (attempt < MAX_ATTEMPTS) {
              console.warn(
                `[lazyWithRetry] dynamic import failed (attempt ${attempt}/${MAX_ATTEMPTS}); retrying in ${BASE_DELAY_MS * attempt}ms`,
                err,
              );
              setTimeout(tryLoad, BASE_DELAY_MS * attempt);
            } else {
              reject(err);
            }
          });
      };

      tryLoad();
    });
  });
}
