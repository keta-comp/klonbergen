import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary.
 *
 * The app previously had NO error boundary anywhere, so any render-time error
 * unmounted the entire React tree and left the user staring at a blank white
 * screen with no clue what failed. This boundary catches those errors and shows
 * the actual message + stack (it surfaces the error — it does NOT hide it), plus
 * a reload button, so a crash is always diagnosable instead of silent.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the original error visible in the console for diagnosis.
    console.error("[ErrorBoundary] Uncaught error:", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0f",
          padding: 24,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 28,
            color: "#e7e7ea",
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
            Kútten shıǵıw / Unexpected error
          </h1>
          <p style={{ fontSize: 14, opacity: 0.75, margin: "0 0 16px" }}>
            Ilova kútten shıǵıp qaldı. Sahypanı jańap kóriń — ádette qáte waqınsha
            bolǵan. (The app hit an unexpected error. Reloading usually recovers;
            the details below help diagnose it.)
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "rgba(0,0,0,0.35)",
              borderRadius: 10,
              padding: 12,
              fontSize: 12,
              lineHeight: 1.5,
              maxHeight: 220,
              overflow: "auto",
              margin: "0 0 16px",
            }}
          >
            {error.message}
            {error.stack ? "\n\n" + error.stack : ""}
          </pre>
          <button
            onClick={this.handleReload}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(90deg,#d4af37,#f0d27a)",
              color: "#1a1407",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Jańadan júklew / Reload
          </button>
        </div>
      </div>
    );
  }
}
