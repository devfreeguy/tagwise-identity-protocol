/**
 * Version badge strip displayed in the docs nav.
 * Update these constants when a new version of the SDK, API, or Docs ships.
 */

const SDK_VERSION = "0.1.2";
const API_VERSION = "1.0";
const DOCS_VERSION = "1.0.0";

interface BadgeProps {
  label: string;
  version: string;
  color: string;
}

function Badge({ label, version, color }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        lineHeight: 1,
        padding: "3px 4px",
        borderRadius: "999px",
        background: color,
        color: "#fff",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-geist-mono, monospace)",
      }}
    >
      <span style={{ opacity: 0.75 }}>{label}</span>
      &nbsp;v{version}
    </span>
  );
}

export function VersionBadges() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      <Badge label="SDK" version={SDK_VERSION} color="#7c3aed" />
      <Badge label="API" version={API_VERSION} color="#0ea5e9" />
      <Badge label="Docs" version={DOCS_VERSION} color="#16a34a" />
    </div>
  );
}
