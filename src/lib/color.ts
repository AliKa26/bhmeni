/** WCAG pomoćne funkcije za kontrast boja (hex #RGB ili #RRGGBB). */

function expandHex(hex: string): string {
  const value = hex.replace('#', '');
  return value.length === 3
    ? value
        .split('')
        .map((c) => c + c)
        .join('')
    : value;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const value = expandHex(hex);
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/** WCAG AA za normalan tekst. */
export const WCAG_AA = 4.5;
