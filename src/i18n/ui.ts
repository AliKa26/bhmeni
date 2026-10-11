/**
 * UI tekstovi po jeziku. `bs` je potpun i služi kao fallback.
 * Ostali jezici se dopunjuju u Fazi 3 (prijevode treba pregledati izvorni govornik).
 */
import type { Lang } from '../config/site';

const bs = {
  skipToContent: 'Preskoči na sadržaj',
  menu: 'Meni',
  info: 'Info',
  infoTitle: 'Informacije',
  close: 'Zatvori',
  address: 'Adresa',
  openInMaps: 'Otvori u Google Maps',
  call: 'Pozovi',
  email: 'Email',
  website: 'Web stranica',
  socials: 'Društvene mreže',
  workingHours: 'Radno vrijeme',
  today: 'Danas',
  closed: 'Zatvoreno',
  statusOpenUntil: 'Otvoreno · do {time}',
  statusOpensAt: 'Zatvoreno · otvara u {time}',
  statusClosed: 'Zatvoreno',
  categories: 'Kategorije menija',
  language: 'Jezik',
  allergens: 'Alergeni',
  unavailable: 'Trenutno nedostupno',
  'badge.new': 'Novo',
  'badge.popular': 'Popularno',
  'badge.chef': 'Preporuka kuhara',
  'badge.sale': 'Akcija',
  poweredBy: 'Powered by',
  allRestaurants: 'Svi restorani',
} as const;

export type UiKey = keyof typeof bs;

const en: Partial<Record<UiKey, string>> = {
  skipToContent: 'Skip to content',
  menu: 'Menu',
  info: 'Info',
  infoTitle: 'Information',
  close: 'Close',
  address: 'Address',
  openInMaps: 'Open in Google Maps',
  call: 'Call',
  email: 'Email',
  website: 'Website',
  socials: 'Social media',
  workingHours: 'Opening hours',
  today: 'Today',
  closed: 'Closed',
  statusOpenUntil: 'Open · until {time}',
  statusOpensAt: 'Closed · opens at {time}',
  statusClosed: 'Closed',
  categories: 'Menu categories',
  language: 'Language',
  allergens: 'Allergens',
  unavailable: 'Currently unavailable',
  'badge.new': 'New',
  'badge.popular': 'Popular',
  'badge.chef': "Chef's choice",
  'badge.sale': 'On sale',
  poweredBy: 'Powered by',
  allRestaurants: 'All restaurants',
};

export const ui: { bs: Record<UiKey, string> } & Partial<Record<Lang, Partial<Record<UiKey, string>>>> = {
  bs,
  en,
};
