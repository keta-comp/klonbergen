import { motion } from "framer-motion";

interface Props {
  variant: "cover" | "greeting" | "venue" | "final";
}

/**
 * Subtle decorative layer using /flower.png. The user-provided floral asset
 * is positioned absolutely on the screen with a slow float animation. We
 * never reuse the same image twice on the same screen.
 */
export default function FlowerDecor({ variant }: Props) {
  const common = {
    className: "inv-flower",
    draggable: false,
    alt: "",
  };

  if (variant === "cover") {
    return (
      <>
        <motion.img
          {...common}
          src="/flower.png"
          className="inv-flower inv-flower--tl"
          style={{ ["--rot" as string]: "-12deg" } as React.CSSProperties}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          loading="lazy"
        />
        <motion.img
          {...common}
          src="/flower.png"
          className="inv-flower inv-flower--br"
          style={{ ["--rot" as string]: "180deg" } as React.CSSProperties}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          loading="lazy"
        />
      </>
    );
  }

  if (variant === "greeting") {
    return (
      <>
        <motion.img
          {...common}
          src="/flower.png"
          className="inv-flower inv-flower--tr"
          style={{ ["--rot" as string]: "20deg" } as React.CSSProperties}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          loading="lazy"
        />
        <motion.img
          {...common}
          src="/flower.png"
          className="inv-flower inv-flower--bl"
          style={{ ["--rot" as string]: "-20deg" } as React.CSSProperties}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          loading="lazy"
        />
      </>
    );
  }

  if (variant === "venue") {
    return (
      <>
        <motion.img
          {...common}
          src="/flower.png"
          className="inv-flower inv-flower--tl"
          style={{ ["--rot" as string]: "-12deg" } as React.CSSProperties}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          loading="lazy"
        />
      </>
    );
  }

  // final
  return (
    <>
      <motion.img
        {...common}
        src="/flower.png"
        className="inv-flower inv-flower--tl"
        style={{ ["--rot" as string]: "-12deg" } as React.CSSProperties}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        loading="lazy"
      />
      <motion.img
        {...common}
        src="/flower.png"
        className="inv-flower inv-flower--br"
        style={{ ["--rot" as string]: "180deg" } as React.CSSProperties}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        loading="lazy"
      />
    </>
  );
}
