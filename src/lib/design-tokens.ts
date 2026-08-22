/**
 * Placeholder brand tokens for Samsarafilmss Studio.
 *
 * These are stand-ins, not final brand colors/type. Swap them for the
 * marketing site's actual palette and font pairing once available (see
 * Section 9 of the build brief) — update this file and globals.css together,
 * since the invoice PDF reads these constants directly (react-pdf can't
 * read CSS custom properties).
 */
export const colors = {
  background: "#FAF7F1",
  surface: "#FFFFFF",
  foreground: "#26241F",
  muted: "#8B8577",
  border: "#E5DFD1",
  accent: "#4B5A3F",
  accentTint: "#E1E6D9",
  accentContrast: "#FFFFFF",
  warm: "#B15A3E",
  warmTint: "#F3E1D8",
  success: "#4B7A5B",
} as const;

export const fonts = {
  display: "Fraunces, Georgia, serif",
  body: "Inter, Arial, Helvetica, sans-serif",
} as const;
