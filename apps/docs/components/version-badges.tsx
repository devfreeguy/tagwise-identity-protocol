/**
 * Version badge strip displayed in the docs nav.
 * Update these constants when a new version of the SDK, API, or Docs ships.
 */

export const SDK_VERSION = "0.2.0";
export const API_VERSION = "1.0.0";
const DOCS_VERSION = "1.0.0";

interface BadgeProps {
  label: string;
  version: string;
}

function Badge({ label, version }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "12px",
        fontWeight: 500,
        letterSpacing: "0.02em",
        lineHeight: 1,
        padding: "4px 10px",
        borderRadius: "999px",
        // Adapts automatically to light / dark mode via Fumadocs CSS vars
        background: "var(--color-fd-secondary)",
        color: "var(--color-fd-muted-foreground)",
        border: "1px solid var(--color-fd-border)",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-geist-mono, monospace)",
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}</span>
      &nbsp;v{version}
    </span>
  );
}

export function VersionBadges() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      <Badge label="SDK" version={SDK_VERSION} />
      <Badge label="API" version={API_VERSION} />
      <Badge label="Docs" version={DOCS_VERSION} />
    </div>
  );
}

/**
 * Compact API + SDK badges for the sidebar footer (beside the GitHub icon strip).
 */
export function NavVersionBadges() {
  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        alignItems: "center",
        flexShrink: 0,
        padding: "8px",
      }}
    >
      <Badge label="API" version={API_VERSION} />
      <Badge label="SDK" version={SDK_VERSION} />
    </div>
  );
}
