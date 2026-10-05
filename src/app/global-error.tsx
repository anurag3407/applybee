"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f7f4ec", color: "#18231e", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>ReachBee couldn’t load</h1>
          <p style={{ marginTop: "0.5rem", color: "#586257" }}>
            A critical error occurred. Please reload the page.
            {error.digest ? ` Reference: ${error.digest}` : ""}
          </p>
          <button onClick={reset} style={{ marginTop: "1rem", background: "#18231e", color: "#fffdf7", border: "none", borderRadius: "0.625rem", padding: "0.6rem 1.2rem", fontWeight: 600, cursor: "pointer" }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
