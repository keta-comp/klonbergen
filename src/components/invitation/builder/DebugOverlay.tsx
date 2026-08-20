// Temporary mobile debugging overlay (Vowly).
//
// Rendered at the builder root so it is visible on EVERY step when the page is
// opened with `?debug=1` (or `localStorage["vowly:music-debug"]="1"`). Normal
// production visitors never see it — `musicDebugEnabled()` returns false.
//
// It shows two fixed, non-interactive panels:
//   • Music upload diagnostics — name / type / size / MIME / extension /
//     detected format / validation / upload status / upload error.
//   • Console — a live capture of the browser console.* output.

import { useEffect, useState } from "react";
import { consoleLog, musicDebug, musicDebugEnabled } from "@/lib/musicDebug";

function fmtBytes(n: number | null): string {
  if (n == null) return "-";
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span style={{ color: "#6cf" }}>{k}:</span> {v || "-"}
    </div>
  );
}

export function DebugOverlay() {
  // Gate is evaluated INSIDE the component so production minification cannot
  // dead-code-eliminate it. Normal users get null and never see the overlay.
  const enabled = musicDebugEnabled();
  const [, force] = useState(0);

  // Live refresh while visible — the debug store is a plain module singleton,
  // so we tick on an interval to re-read its current values.
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => force((n) => n + 1), 400);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  const diagRows: [string, string][] = [
    ["name", musicDebug.name],
    ["type", musicDebug.type],
    ["size", fmtBytes(musicDebug.size)],
    ["MIME", musicDebug.mime],
    ["extension", musicDebug.extension],
    ["detected format", musicDebug.detectedFormat],
    ["validation", musicDebug.validation],
    ["upload status", musicDebug.uploadStatus],
    ["upload error", musicDebug.uploadError],
  ];

  const panel: React.CSSProperties = {
    position: "fixed",
    right: 8,
    bottom: 8,
    zIndex: 99999,
    maxWidth: "94vw",
    maxHeight: "72vh",
    overflow: "auto",
    background: "rgba(8,8,8,0.94)",
    color: "#0f0",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 11,
    lineHeight: 1.45,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #0f0",
    whiteSpace: "pre-wrap",
    pointerEvents: "none",
  };
  const head: React.CSSProperties = { fontWeight: "bold", marginBottom: 4 };

  return (
    <div style={panel}>
      <div style={head}>Vowly Debug (?debug=1)</div>

      <div style={{ color: "#ff0", fontWeight: "bold", marginTop: 4 }}>Music upload diagnostics</div>
      {diagRows.map(([k, v]) => (
        <Row key={k} k={k} v={v} />
      ))}

      <div style={{ color: "#ff0", fontWeight: "bold", marginTop: 6, borderTop: "1px solid #060", paddingTop: 4 }}>
        Console
      </div>
      {consoleLog.slice(-50).map((l, i) => (
        <div key={i} style={{ color: l.startsWith("[error]") ? "#f66" : l.startsWith("[warn]") ? "#fd6" : "#0f0" }}>
          {l}
        </div>
      ))}
      {consoleLog.length === 0 && <div style={{ color: "#5a5" }}>— no console output yet —</div>}
    </div>
  );
}
