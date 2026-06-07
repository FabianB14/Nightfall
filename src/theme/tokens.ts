// Theme tokens — Gulf Coast Gothic (§6 of CLAUDE.md).
// These are the single source of truth for colors; tailwind.config.js mirrors them,
// and applyThemeVars() exposes them as CSS variables for non-Tailwind use.
import type { ArchetypeId } from '@engine/types';

export const colors = {
  night: '#0B0E1A', // app background
  surface: '#161C2E', // panels
  cardFace: '#1B2236', // card body
  cardBorder: '#2C3550',
  eclipse: '#C2362F', // bloodmoon / danger / the dead sun
  lantern: '#F2B95C', // LIGHT / lit zones / hope
  swamp: '#A9B24E', // bayou accents
  bone: '#ECE6D6', // primary text
  muted: '#9AA0B5', // secondary text
} as const;

export const archetypeColors: Record<ArchetypeId, string> = {
  revenant: '#B11E2F', // crimson (blood)
  devout: '#E6B84A', // gold (faith/light)
  cursed: '#7A4FA3', // violet (the curse)
  conjurer: '#1FA398', // teal (hoodoo)
  marksman: '#4A6FA5', // steel (silver/precision)
  maker: '#C8742E', // copper (gadgets/scrap)
};

/** Apply theme tokens as CSS custom properties on :root. Call once at startup. */
export function applyThemeVars(target: HTMLElement = document.documentElement): void {
  for (const [key, value] of Object.entries(colors)) {
    target.style.setProperty(`--color-${key}`, value);
  }
  for (const [key, value] of Object.entries(archetypeColors)) {
    target.style.setProperty(`--archetype-${key}`, value);
  }
}
