import { LANGUAGES, type Lang } from '../config/site';
import { ui, type UiKey } from './ui';

/** Lokalizirani tekst iz podataka; fallback na bs. */
export type Localized = { bs: string } & Partial<Record<Lang, string>>;

export function localize(text: Localized, lang: Lang): string {
  return text[lang] ?? text.bs;
}

export function localizeOptional(text: Localized | undefined, lang: Lang): string | undefined {
  return text ? localize(text, lang) : undefined;
}

/** UI tekst; fallback na bs. `{name}` placeholderi se zamjenjuju iz `vars`. */
export function t(lang: Lang, key: UiKey, vars?: Record<string, string>): string {
  const template = ui[lang]?.[key] ?? ui.bs[key];
  return vars ? template.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`) : template;
}

/** Vraća funkciju t vezanu za jezik (kraći zapis u komponentama). */
export function useTranslations(lang: Lang) {
  return (key: UiKey, vars?: Record<string, string>) => t(lang, key, vars);
}

export function formatPrice(value: number, currency: 'KM' | 'EUR', lang: Lang): string {
  const number = new Intl.NumberFormat(LANGUAGES[lang].locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return currency === 'EUR' ? `${number} €` : `${number} KM`;
}

/** Naziv dana (0 = ponedjeljak) na jeziku stranice, preko Intl (bez ručnih prijevoda). */
export function weekdayName(day: number, lang: Lang, style: 'short' | 'long' = 'long'): string {
  const { locale } = LANGUAGES[lang];
  // 1. 1. 2024. je bio ponedjeljak.
  const name = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, 0, 1 + day)),
  );
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

export function formatMinutes(minutes: number): string {
  const m = minutes % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
