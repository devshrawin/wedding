/**
 * Vivah — Giftr's Astryx theme.
 *
 * Extends Astryx "chocolate" (warm surfaces, Fraunces headings) and re-points it at
 * Indian wedding colours: sindoor red accent, marigold highlights, ivory paper.
 * Body text uses Mukta, which carries both Latin and Devanagari, so Hindi and English
 * sit on the same baseline at the same weight.
 */
import {defineTheme} from '@astryxdesign/core/theme';
import {chocolateTheme} from '@astryxdesign/theme-chocolate/built';

export const vivahTheme = defineTheme({
  name: 'vivah',
  extends: chocolateTheme,

  typography: {
    // 16px body everywhere: older relatives read this on budget Android phones.
    scale: {base: 16, ratio: 1.2},
    body: {
      family: 'Mukta',
      fallbacks: '"Noto Sans Devanagari", -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    },
    heading: {
      family: 'Fraunces',
      fallbacks: 'Mukta, Georgia, "Times New Roman", serif',
      weights: {1: '600', 2: '600', 3: '600', 4: '600'},
    },
  },

  radius: {base: 10, multiplier: 1.4},

  tokens: {
    '--color-accent': ['#9B1C31', '#F07A86'],
    '--color-accent-muted': ['#9B1C3114', '#F07A8624'],
    '--color-on-accent': ['#FFFFFF', '#2A0A10'],
    '--color-text-accent': ['#8A1629', '#F49AA3'],
    '--color-icon-accent': ['#9B1C31', '#F07A86'],

    '--color-background-body': ['#FBF6EE', '#15100E'],
    '--color-background-surface': ['#FFFDF9', '#1E1714'],
    '--color-background-muted': ['#F3EADB', '#2A211C'],
    '--color-neutral': ['#5A2A1A0D', '#F3EADB14'],

    // Chocolate's secondary text is ~3:1 on ivory; this is ~6:1 (WCAG AA for body text).
    '--color-text-primary': ['#2B1A14', '#F5EDE3'],
    '--color-text-secondary': ['#6E5548', '#C9B8A8'],
    '--color-text-disabled': ['#B9A898', '#6E5D50'],

    '--color-border': ['#E8DCCB', '#3A2E27'],
    '--color-border-emphasized': ['#D4C1A8', '#55463C'],

    '--color-warning': ['#E9A21B', '#F2B84B'],
    '--color-on-warning': ['#2B1A14', '#2B1A14'],
    '--color-success': ['#1F7A55', '#5CC79A'],
    '--color-text-success': ['#17633F', '#7AD6AC'],
    '--color-on-success': ['#FFFFFF', '#0E2A1D'],
  },
});
