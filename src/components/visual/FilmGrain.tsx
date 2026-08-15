/**
 * Subtle global film-grain overlay (2–4% opacity) for a photographic,
 * cinematic texture. Purely decorative; ignores pointer events.
 */
export default function FilmGrain() {
  return <div className="film-grain" aria-hidden="true" />;
}
