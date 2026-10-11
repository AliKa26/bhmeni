/**
 * Teme restorana: presets boja i allowlist fontova.
 * Ovaj fajl je čista konfiguracija (koristi ga i Zod šema u content.config.ts),
 * zato ne smije importovati font fajlove. URL-ovi fontova su u src/lib/fonts.ts.
 */

export interface ThemeColors {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export const THEME_PRESETS = {
  /** Topla, "domaća" paleta (ćevabdžinice, aščinice). */
  warm: {
    primary: '#B3261E',
    accent: '#F2A33A',
    background: '#FFF8F0',
    surface: '#FFFFFF',
    text: '#2B1B12',
  },
  /** Svježa, zelena (salate, brunch, vegan). */
  fresh: {
    primary: '#2F6B3B',
    accent: '#C9D94A',
    background: '#F5F8F1',
    surface: '#FFFFFF',
    text: '#17261A',
  },
  /** Klasična, elegantna (restorani, fine dining). */
  classic: {
    primary: '#1F3A5F',
    accent: '#C8A24A',
    background: '#F7F5F0',
    surface: '#FFFFFF',
    text: '#1A1A1A',
  },
  /** Tamna (barovi, pizzerije uveče). */
  night: {
    primary: '#F2A33A',
    accent: '#E5484D',
    background: '#141210',
    surface: '#1F1C19',
    text: '#F4EEE6',
  },
  /** Neutralna, minimalistička (kafići). */
  minimal: {
    primary: '#111111',
    accent: '#D9480F',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#111111',
  },
} as const satisfies Record<string, ThemeColors>;

export type ThemePreset = keyof typeof THEME_PRESETS;
export const THEME_PRESET_IDS = Object.keys(THEME_PRESETS) as [ThemePreset, ...ThemePreset[]];

export interface FontConfig {
  /** CSS font-family ime (kako ga definiše @font-face u src/lib/fonts.ts). */
  family: string;
  /** Fallback stack. */
  fallback: string;
}

/** Allowlist fontova. Restoran može koristiti samo ove ID-eve. */
export const FONTS = {
  inter: { family: 'Inter Variable', fallback: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
  'dm-sans': { family: 'DM Sans Variable', fallback: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
  fraunces: { family: 'Fraunces Variable', fallback: 'Georgia, "Times New Roman", serif' },
  'playfair-display': { family: 'Playfair Display Variable', fallback: 'Georgia, "Times New Roman", serif' },
  lora: { family: 'Lora Variable', fallback: 'Georgia, "Times New Roman", serif' },
} as const satisfies Record<string, FontConfig>;

export type FontId = keyof typeof FONTS;
export const FONT_IDS = Object.keys(FONTS) as [FontId, ...FontId[]];

export const MENU_LAYOUTS = ['cards', 'list', 'compact', 'photo-grid', 'custom'] as const;
export type MenuLayout = (typeof MENU_LAYOUTS)[number];

export const RADIUS_OPTIONS = ['none', 'sm', 'md', 'lg', 'xl'] as const;
export type Radius = (typeof RADIUS_OPTIONS)[number];

export const HEADER_STYLES = ['cover', 'logo', 'minimal'] as const;
export type HeaderStyle = (typeof HEADER_STYLES)[number];

/** Vizuelni identitet samog BHMeni sajta (imenik). */
export const BRAND_FONTS = { heading: 'fraunces', body: 'inter' } as const satisfies Record<string, FontId>;
