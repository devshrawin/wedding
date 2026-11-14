import type { CSSProperties } from "react";
import { themeOf } from "./utils";

/**
 * Re-points the Astryx accent tokens at a registry's chosen colour, for the subtree only.
 * Everything Astryx draws in "accent" (primary buttons, focus rings, progress) follows.
 */
export function registryThemeStyle(theme: string | null | undefined): CSSProperties {
  const t = themeOf(theme);
  return {
    "--color-accent": t.primary,
    "--color-accent-muted": `${t.primary}1f`,
    "--color-text-accent": t.primary,
    "--color-icon-accent": t.primary,
    "--brand-soft": t.soft,
    "--brand-deep": t.deep,
  } as CSSProperties;
}
