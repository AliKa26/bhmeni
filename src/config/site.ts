/**
 * Globalna konfiguracija sajta.
 * SITE_URL se postavlja u astro.config.mjs (env varijabla SITE_URL, fallback workers.dev).
 */

export const SITE_NAME = 'BHMeni';
export const SITE_TAGLINE = 'Meniji restorana u Bosni i Hercegovini';

/** Apsolutni URL sajta bez završne kose crte, npr. https://bhmeni.ba */
export const SITE_URL: string = (import.meta.env.SITE ?? 'https://bhmeni.workers.dev').replace(/\/$/, '');

/** Broj kartica po stranici u imeniku. */
export const PAGE_SIZE = 12;

export type TextDirection = 'ltr' | 'rtl';

export interface LanguageConfig {
  /** Naziv jezika na samom jeziku (za language switcher). */
  label: string;
  /** BCP 47 locale za formatiranje cijena i datuma. */
  locale: string;
  dir: TextDirection;
}

/** Podržani jezici. Redoslijed je redoslijed prikaza u switcheru. */
export const LANGUAGES = {
  bs: { label: 'Bosanski', locale: 'bs-BA', dir: 'ltr' },
  en: { label: 'English', locale: 'en-GB', dir: 'ltr' },
  de: { label: 'Deutsch', locale: 'de-DE', dir: 'ltr' },
  tr: { label: 'Türkçe', locale: 'tr-TR', dir: 'ltr' },
  ar: { label: 'العربية', locale: 'ar', dir: 'rtl' },
  it: { label: 'Italiano', locale: 'it-IT', dir: 'ltr' },
} as const satisfies Record<string, LanguageConfig>;

export type Lang = keyof typeof LANGUAGES;

export const DEFAULT_LANG: Lang = 'bs';

export const LANG_CODES = Object.keys(LANGUAGES) as [Lang, ...Lang[]];

export function isLang(value: string): value is Lang {
  return Object.hasOwn(LANGUAGES, value);
}

/**
 * Slugovi koje restoran ne smije koristiti (sudaraju se s rutama sajta).
 */
export const RESERVED_SLUGS = [
  'grad',
  'kategorija',
  'search-index',
  'search-dishes',
  '404',
  '_astro',
  'api',
  'o-nama',
  'admin',
] as const;

/**
 * Šta raditi sa jelima koja imaju `available: false`:
 * 'hide' = sakriti, 'show' = prikazati s oznakom "Trenutno nedostupno".
 */
export const UNAVAILABLE_ITEMS: 'hide' | 'show' = 'show';

/** Valuta po defaultu (konvertibilna marka). */
export const DEFAULT_CURRENCY = 'KM';
