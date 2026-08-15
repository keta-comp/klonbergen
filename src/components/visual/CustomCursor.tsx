import { useEffect, useRef, useState } from "react";

/**
 * Desktop-only custom cursor. A small gold dot that expands into a labelled
 * ring over elements carrying a `data-cursor="view|open|explore"` attribute.
 * Disabled on touch devices and when the visitor prefers reduced motion.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<null | string>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);

    const move = (e: MouseEvent) => {
      const el = dotRef.current;
      if (!el) return;
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      const target = (e.target as HTMLElement)?.closest?.("[data-cursor]") as HTMLElement | null;
      const kind = target?.getAttribute("data-cursor") ?? null;
      setActive(kind);
    };

    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  if (!enabled) return null;

  return (
    <div ref={dotRef} className={`vow-cursor${active ? " is-active" : ""}`} aria-hidden="true">
      <span className="vow-cursor-label">
        {active === "view" ? "View" : active === "open" ? "Open" : active === "explore" ? "Explore" : ""}
      </span>
    </div>
  );
}
