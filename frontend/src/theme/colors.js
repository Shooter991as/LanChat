// Deliberate palette for LAN Chat — dark, network/tech-coded, built around one
// violet accent instead of a generic frosted-glass-over-stock-photo look.
// Two accents used with restraint: violet carries buttons/links/own-message
// bubbles; ember is reserved for unread badges and small highlights only.

export const colors = {
  bg: "#121420",          // deep indigo-black app background
  panel: "#1A1D2E",       // sidebar / card surface
  panelRaised: "#232640", // hovered rows, input fields, elevated surfaces
  border: "#2F3350",
  textHi: "#F2F1F7",
  textMid: "#A6A8BD",
  textDim: "#6B6E89",
  accent: "#7C5CFC",      // primary violet
  accentHover: "#8F72FF",
  ember: "#FF8A4C",       // sparing use — unread badges, small highlights
  online: "#34D399",
  danger: "#F2545B",
  dangerHover: "#FF6B72",
};

// Subtle network/circuit-style background: a faint dot grid plus two soft
// radial glows. No image asset to load or fail across devices — pure CSS.
export const appBackground = {
  bg: colors.bg,
  backgroundImage: `
    radial-gradient(circle at 15% 10%, rgba(124,92,252,0.14), transparent 40%),
    radial-gradient(circle at 85% 85%, rgba(255,138,76,0.08), transparent 35%),
    radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)
  `,
  backgroundSize: "auto, auto, 22px 22px",
};
