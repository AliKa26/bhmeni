/** Tema restorana -> CSS custom properties (inline na <body>). */
import { THEME_PRESETS, type FontId, type Radius, type ThemeColors, type ThemePreset } from '../config/themes';
import { contrastRatio } from './color';
import { fontStack } from './fonts';

export interface RestaurantTheme {
  preset: ThemePreset;
  colors: Partial<ThemeColors>;
  fonts: { heading: FontId; body: FontId };
  radius: Radius;
}

const RADIUS_VALUES: Record<Radius, string> = {
  none: '0px',
  sm: '0.375rem',
  md: '0.75rem',
  lg: '1.25rem',
  xl: '1.75rem',
};

export function resolveColors(theme: RestaurantTheme): ThemeColors {
  return { ...THEME_PRESETS[theme.preset], ...theme.colors };
}

/** Bijeli ili tamni tekst, šta god ima bolji kontrast na pozadini. */
function readableOn(background: string): string {
  return contrastRatio('#ffffff', background) >= contrastRatio('#111111', background) ? '#ffffff' : '#111111';
}

export function themeStyle(theme: RestaurantTheme): string {
  const c = resolveColors(theme);
  const vars: Record<string, string> = {
    '--color-primary': c.primary,
    '--color-accent': c.accent,
    '--color-background': c.background,
    '--color-surface': c.surface,
    '--color-text': c.text,
    '--color-on-primary': readableOn(c.primary),
    '--font-heading': fontStack(theme.fonts.heading),
    '--font-body': fontStack(theme.fonts.body),
    '--radius-card': RADIUS_VALUES[theme.radius],
  };
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}

/** Da li je pozadina tamna (za color-scheme i nijanse sjena). */
export function isDarkTheme(theme: RestaurantTheme): boolean {
  return contrastRatio('#ffffff', resolveColors(theme).background) > 7;
}
