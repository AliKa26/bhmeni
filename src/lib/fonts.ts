/**
 * Self-hosted fontovi, samo `latin` + `latin-ext` subset (č ć š đ ž).
 * Uvozimo direktno .woff2 fajlove umjesto fontsource CSS-a, da u dist/
 * ne završe nepotrebni subseti (ćirilica, grčki, vijetnamski).
 */
import { FONTS, type FontId } from '../config/themes';

import interLatin from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import interLatinExt from '@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2?url';
import dmSansLatin from '@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url';
import dmSansLatinExt from '@fontsource-variable/dm-sans/files/dm-sans-latin-ext-wght-normal.woff2?url';
import frauncesLatin from '@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2?url';
import frauncesLatinExt from '@fontsource-variable/fraunces/files/fraunces-latin-ext-wght-normal.woff2?url';
import playfairLatin from '@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2?url';
import playfairLatinExt from '@fontsource-variable/playfair-display/files/playfair-display-latin-ext-wght-normal.woff2?url';
import loraLatin from '@fontsource-variable/lora/files/lora-latin-wght-normal.woff2?url';
import loraLatinExt from '@fontsource-variable/lora/files/lora-latin-ext-wght-normal.woff2?url';

// unicode-range vrijednosti preuzete iz fontsource paketa (iste za sve fontove).
const LATIN_RANGE =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT_RANGE =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

interface FontFiles {
  latin: string;
  latinExt: string;
  weight: string;
}

const FONT_FILES: Record<FontId, FontFiles> = {
  inter: { latin: interLatin, latinExt: interLatinExt, weight: '100 900' },
  'dm-sans': { latin: dmSansLatin, latinExt: dmSansLatinExt, weight: '100 1000' },
  fraunces: { latin: frauncesLatin, latinExt: frauncesLatinExt, weight: '100 900' },
  'playfair-display': { latin: playfairLatin, latinExt: playfairLatinExt, weight: '400 900' },
  lora: { latin: loraLatin, latinExt: loraLatinExt, weight: '400 700' },
};

/** @font-face pravila za date fontove (bez duplikata). */
export function fontFaceCss(ids: readonly FontId[]): string {
  return [...new Set(ids)]
    .map((id) => {
      const { family } = FONTS[id];
      const files = FONT_FILES[id];
      return [
        [files.latinExt, LATIN_EXT_RANGE],
        [files.latin, LATIN_RANGE],
      ]
        .map(
          ([url, range]) =>
            `@font-face{font-family:'${family}';font-style:normal;font-display:swap;font-weight:${files.weight};src:url(${url}) format('woff2-variations');unicode-range:${range}}`,
        )
        .join('');
    })
    .join('');
}

/** URL glavnog (latin) fajla fonta za <link rel="preload">. */
export function fontPreloadUrl(id: FontId): string {
  return FONT_FILES[id].latin;
}

/** CSS vrijednost font-family s fallbackom. */
export function fontStack(id: FontId): string {
  const { family, fallback } = FONTS[id];
  return `'${family}', ${fallback}`;
}
