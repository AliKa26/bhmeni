/**
 * Normalizacija za pretragu: mala slova, bez dijakritika (č ć š ž → c c s z, đ → dj),
 * interpunkcija u razmak. Ista funkcija se koristi pri buildu (data-search) i u pregledniku (upit),
 * pa "cevapi" nalazi "Ćevapi".
 */
export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Svi tokeni upita moraju se pojaviti u tekstu (redoslijed nije bitan). */
export function matchesQuery(normalizedText: string, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  return normalizedQuery.split(' ').every((token) => normalizedText.includes(token));
}
