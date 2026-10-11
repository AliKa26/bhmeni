/**
 * Parsiranje radnog vremena iz restaurant.json.
 * Koristi ga Zod šema (validacija) i kasnije klijentski status "Otvoreno/Zatvoreno".
 *
 * Format `days`:  "Pon–Pet", "Sub, Ned", "Pon–Čet, Sub", "Svaki dan"
 * Format `hours`: "08:00–23:00", "08:00–15:00, 17:00–23:00", "Zatvoreno"
 * Crtica može biti "–" ili "-". Zatvaranje iza ponoći ("18:00–02:00") je dozvoljeno.
 */

/** Indeksi dana: 0 = ponedjeljak … 6 = nedjelja. */
const DAY_TOKENS: Record<string, number> = {
  pon: 0,
  uto: 1,
  sri: 2,
  cet: 3,
  čet: 3,
  pet: 4,
  sub: 5,
  ned: 6,
};

export const DAY_TOKEN_HINT = 'Pon, Uto, Sri, Čet, Pet, Sub, Ned (npr. "Pon–Pet", "Sub, Ned" ili "Svaki dan")';

const RANGE_SEPARATOR = /\s*[–-]\s*/;

function dayIndex(token: string): number | undefined {
  return DAY_TOKENS[token.trim().toLowerCase()];
}

/** Vraća listu dana (0–6) ili null ako format nije ispravan. */
export function parseDays(input: string): number[] | null {
  const value = input.trim();
  if (value.toLowerCase() === 'svaki dan') return [0, 1, 2, 3, 4, 5, 6];

  const days = new Set<number>();
  for (const segment of value.split(',')) {
    const parts = segment.trim().split(RANGE_SEPARATOR);
    if (parts.length === 1) {
      const day = dayIndex(parts[0] ?? '');
      if (day === undefined) return null;
      days.add(day);
    } else if (parts.length === 2) {
      const from = dayIndex(parts[0] ?? '');
      const to = dayIndex(parts[1] ?? '');
      if (from === undefined || to === undefined) return null;
      // Raspon može ići preko nedjelje (npr. "Pet–Pon").
      for (let d = from; ; d = (d + 1) % 7) {
        days.add(d);
        if (d === to) break;
      }
    } else {
      return null;
    }
  }
  return [...days].sort((a, b) => a - b);
}

export interface TimeRange {
  /** Minute od ponoći. */
  open: number;
  /** Minute od ponoći; ako je <= open, zatvara se idući dan. */
  close: number;
}

const TIME = /^([01]\d|2[0-4]):([0-5]\d)$/;

function parseTime(value: string): number | null {
  const match = TIME.exec(value.trim());
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes > 24 * 60 ? null : minutes;
}

/** Vraća intervale, prazan niz za "Zatvoreno", ili null ako format nije ispravan. */
export function parseHours(input: string): TimeRange[] | null {
  const value = input.trim();
  if (value.toLowerCase() === 'zatvoreno') return [];

  const ranges: TimeRange[] = [];
  for (const segment of value.split(',')) {
    const parts = segment.trim().split(RANGE_SEPARATOR);
    if (parts.length !== 2) return null;
    const open = parseTime(parts[0] ?? '');
    const close = parseTime(parts[1] ?? '');
    if (open === null || close === null) return null;
    ranges.push({ open, close });
  }
  return ranges;
}

export interface WorkingHoursEntry {
  days: string;
  hours: string;
}

/**
 * Raspored po danima (indeks 0 = ponedjeljak). Kasniji unos za isti dan prepisuje raniji.
 * `undefined` = za taj dan nema podatka; `[]` = zatvoreno.
 */
export function buildWeekSchedule(entries: readonly WorkingHoursEntry[]): Array<TimeRange[] | undefined> {
  const week: Array<TimeRange[] | undefined> = Array.from({ length: 7 }, () => undefined);
  for (const entry of entries) {
    const days = parseDays(entry.days);
    const ranges = parseHours(entry.hours);
    if (!days || !ranges) continue; // šema ovo već odbija
    for (const day of days) week[day] = ranges;
  }
  return week;
}
