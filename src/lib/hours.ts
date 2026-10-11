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

export type OpenStatus =
  | { state: 'open'; until: number }
  | { state: 'open24' }
  | { state: 'closed'; opensAt: number; tomorrow: boolean }
  | { state: 'closed' }
  | { state: 'unknown' };

const DAY = 24 * 60;

/**
 * Status u trenutku `minutes` (0–1439) dana `day` (0 = ponedjeljak).
 * Intervali jučer/danas/sutra se postave na zajedničku vremensku osu i spoje ako se dodiruju,
 * pa ispravno rade i "20:00–02:00", "09:00–00:00" i uzastopni intervali ("12:00–16:00, 16:00–23:00").
 * `schedule` je u formatu iz buildWeekSchedule ili njegovog JSON oblika ([open, close] parovi).
 */
export function getOpenStatus(
  schedule: ReadonlyArray<ReadonlyArray<TimeRange | readonly [number, number]> | null | undefined>,
  day: number,
  minutes: number,
): OpenStatus {
  if (!schedule.some((d) => d !== null && d !== undefined)) return { state: 'unknown' };

  const intervals: Array<[number, number]> = [];
  for (const offset of [-1, 0, 1]) {
    const ranges = schedule[(day + offset + 7) % 7] ?? [];
    for (const range of ranges) {
      const [open, close] = Array.isArray(range) ? range : [(range as TimeRange).open, (range as TimeRange).close];
      const start = offset * DAY + open;
      const end = offset * DAY + (close <= open ? close + DAY : close);
      intervals.push([start, end]);
    }
  }
  intervals.sort((a, b) => a[0] - b[0]);

  const merged: Array<[number, number]> = [];
  for (const [start, end] of intervals) {
    const last = merged.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }

  const current = merged.find(([start, end]) => start <= minutes && minutes < end);
  if (current) {
    // Bez prekida do kraja sutrašnjeg dana: tretira se kao non-stop.
    if (current[1] - minutes >= DAY) return { state: 'open24' };
    return { state: 'open', until: ((current[1] % DAY) + DAY) % DAY };
  }
  const next = merged.find(([start]) => start > minutes);
  if (next) return { state: 'closed', opensAt: next[0] % DAY, tomorrow: next[0] >= DAY };
  return { state: 'closed' };
}
