import { motion } from "framer-motion";
import type { BuilderStepMeta } from "./types";

interface Props {
  steps: readonly BuilderStepMeta[];
  activeIdx: number;
  onJump: (i: number) => void;
}

export default function StepIndicator({ steps, activeIdx, onJump }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-7">
      {steps.map((s, i) => {
        const isActive = i === activeIdx;
        const isDone = i < activeIdx;
        const activeBorder = isActive
          ? "border-[color:var(--vi-gold)] text-[color:var(--iv-ink)]"
          : isDone
            ? "border-[color:var(--vi-line-strong)] text-[color:var(--vi-soft)]"
            : "border-[color:var(--vi-line)] text-[color:var(--vi-soft)]";
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(i)}
            className={`group inline-flex items-center gap-3 rounded-full border px-3.5 py-1.5 transition-all duration-300 ${activeBorder}`}
          >
            <span className="font-display text-sm leading-none">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[0.6rem] ${
                  isActive
                    ? "border-[color:var(--vi-gold)] bg-[color:var(--vi-gold)] text-[#1a1410]"
                    : isDone
                      ? "border-[color:var(--vi-gold-soft)] bg-[color:var(--vi-gold-soft)] text-[#1a1410]"
                      : "border-current"
                }`}
              >
                {isDone ? "✓" : String(i + 1).padStart(2, "0")}
              </span>
            </span>
            <span className="font-ui text-[0.66rem] uppercase tracking-[0.32em] leading-none">
              {s.label}
            </span>
            {isActive && (
              <motion.span
                layoutId="inv-step-bar"
                className="absolute -bottom-px left-3 right-3 h-px bg-[color:var(--vi-gold)]"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
