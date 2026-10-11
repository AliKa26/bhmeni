/**
 * Content Collections: Zod šeme za restorane, menije i taksonomije.
 * Svaka greška ovdje obara build, pa nevalidni podaci nikad ne idu live.
 *
 * Struktura: src/content/restaurants/<slug>/{restaurant.json, menu.json, images/}
 * ID restorana i menija = ime foldera (<slug>).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { defineCollection, type SchemaContext } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { DEFAULT_CURRENCY, DEFAULT_LANG, LANG_CODES, RESERVED_SLUGS, type Lang } from './config/site';
import { FONT_IDS, HEADER_STYLES, MENU_LAYOUTS, RADIUS_OPTIONS, THEME_PRESETS, THEME_PRESET_IDS } from './config/themes';
import { contrastRatio, WCAG_AA } from './lib/color';
import { DAY_TOKEN_HINT, parseDays, parseHours } from './lib/hours';

import citiesData from './data/cities.json';
import categoriesData from './data/categories.json';
import allergensData from './data/allergens.json';
import tagsData from './data/tags.json';

const RESTAURANTS_DIR = 'src/content/restaurants';

// ---------------------------------------------------------------------------
// Pomoćne šeme
// ---------------------------------------------------------------------------

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

const slugId = (what: string) =>
  z
    .string()
    .regex(SLUG_PATTERN, `${what} smije sadržavati samo mala slova bez dijakritika, brojeve i crtice (npr. "glavna-jela")`);

const nonEmpty = z.string().trim().min(1, 'Tekst ne smije biti prazan');

/**
 * Lokalizirani tekst: { bs: "...", en: "...", ... }. `bs` je obavezan, ostali opcionalni.
 * Strict: nepoznat jezički ključ (npr. "eng") je greška.
 */
export const localizedText = z.strictObject({
  bs: z
    .string({
      error: (issue) =>
        issue.input === undefined ? 'Nedostaje obavezan tekst na bosanskom ("bs")' : 'Tekst mora biti string',
    })
    .trim()
    .min(1, 'Tekst na bosanskom ("bs") ne smije biti prazan'),
  en: nonEmpty.optional(),
  de: nonEmpty.optional(),
  tr: nonEmpty.optional(),
  ar: nonEmpty.optional(),
  it: nonEmpty.optional(),
});
export type LocalizedText = z.infer<typeof localizedText>;

// Kompajlerska provjera: ključevi localizedText moraju odgovarati jezicima iz site.ts.
type SameKeys<A, B> = [Exclude<A, B> | Exclude<B, A>] extends [never] ? true : never;
const _localizedKeysMatchLanguages: SameKeys<keyof LocalizedText, Lang> = true;
void _localizedKeysMatchLanguages;

/** Enum ID-eva iz taksonomije, s razumljivom porukom kad ID ne postoji. */
function taxonomyId(label: string, ids: readonly string[]) {
  const [first, ...rest] = ids;
  if (first === undefined) throw new Error(`Taksonomija "${label}" je prazna`);
  return z.enum([first, ...rest], {
    error: (issue) => `Nepoznat ${label} "${String(issue.input)}". Dozvoljeno: ${ids.join(', ')}`,
  });
}

function uniqueArray<T extends z.ZodType>(item: T, what: string) {
  return z.array(item).refine((list) => new Set(list).size === list.length, `${what} se ponavljaju`);
}

const httpUrl = z.url({ protocol: /^https?$/, error: 'Neispravan URL (mora počinjati sa https:// ili http://)' });
/** Prazan string je dozvoljen da se polje može ostaviti u šablonu. */
const optionalUrl = z.union([httpUrl, z.literal('')]).optional();

// ---------------------------------------------------------------------------
// Taksonomije (src/data/*.json)
// ---------------------------------------------------------------------------

const citySchema = z.strictObject({
  id: slugId('ID grada'),
  name: nonEmpty,
  region: z.enum(['fbih', 'rs', 'bd']),
});

const categorySchema = z.strictObject({
  id: slugId('ID kategorije'),
  name: localizedText,
});

const iconTaxonomySchema = z.strictObject({
  id: slugId('ID'),
  icon: nonEmpty,
  name: localizedText,
});

const CITY_IDS = citiesData.map((c) => c.id);
const CATEGORY_IDS = categoriesData.map((c) => c.id);
const ALLERGEN_IDS = allergensData.map((a) => a.id);
const TAG_IDS = tagsData.map((t) => t.id);

const cityId = taxonomyId('grad', CITY_IDS);
const categoryId = taxonomyId('kategorija', CATEGORY_IDS);
const allergenId = taxonomyId('alergen', ALLERGEN_IDS);
const tagId = taxonomyId('tag', TAG_IDS);
const langCode = z.enum(LANG_CODES, {
  error: (issue) => `Nepodržan jezik "${String(issue.input)}". Dozvoljeno: ${LANG_CODES.join(', ')}`,
});

// ---------------------------------------------------------------------------
// restaurant.json
// ---------------------------------------------------------------------------

const workingHoursEntry = z.strictObject({
  days: z.string().refine((v) => parseDays(v) !== null, { error: `Neispravni dani. Koristi: ${DAY_TOKEN_HINT}` }),
  hours: z
    .string()
    .refine((v) => parseHours(v) !== null, {
      error: 'Neispravno radno vrijeme. Format: "08:00–23:00", "08:00–15:00, 17:00–23:00" ili "Zatvoreno"',
    }),
});

const themeSchema = z.strictObject({
  preset: z.enum(THEME_PRESET_IDS).default('warm'),
  colors: z
    .strictObject({
      primary: z.string().regex(HEX_COLOR, 'Boja mora biti hex, npr. "#B3261E"'),
      accent: z.string().regex(HEX_COLOR, 'Boja mora biti hex, npr. "#F2A33A"'),
      background: z.string().regex(HEX_COLOR, 'Boja mora biti hex, npr. "#FFF8F0"'),
      surface: z.string().regex(HEX_COLOR, 'Boja mora biti hex, npr. "#FFFFFF"'),
      text: z.string().regex(HEX_COLOR, 'Boja mora biti hex, npr. "#2B1B12"'),
    })
    .partial()
    .default({}),
  fonts: z
    .strictObject({
      heading: z.enum(FONT_IDS, { error: `Font nije na allowlisti. Dozvoljeno: ${FONT_IDS.join(', ')}` }),
      body: z.enum(FONT_IDS, { error: `Font nije na allowlisti. Dozvoljeno: ${FONT_IDS.join(', ')}` }),
    })
    .default({ heading: 'fraunces', body: 'inter' }),
  layout: z.enum(MENU_LAYOUTS).default('cards'),
  radius: z.enum(RADIUS_OPTIONS).default('lg'),
  header: z.enum(HEADER_STYLES).default('cover'),
});

const restaurantSchema = ({ image }: SchemaContext) =>
  z
    .strictObject({
      name: nonEmpty,
      active: z.boolean().default(true),
      listed: z.boolean().default(true),
      featured: z.boolean().default(false),
      city: cityId,
      categories: uniqueArray(categoryId, 'Kategorije').min(1, 'Navedi barem jednu kategoriju'),
      description: localizedText,
      logo: image().optional(),
      cover: image().optional(),
      address: nonEmpty,
      googleMapsUrl: optionalUrl,
      coordinates: z
        .strictObject({
          // Okvir BiH (s malom rezervom); hvata zamijenjene lat/lng.
          lat: z.number().min(42.5, 'lat izvan BiH (zamijenjeni lat/lng?)').max(45.3, 'lat izvan BiH (zamijenjeni lat/lng?)'),
          lng: z.number().min(15.7, 'lng izvan BiH (zamijenjeni lat/lng?)').max(19.7, 'lng izvan BiH (zamijenjeni lat/lng?)'),
        })
        .optional(),
      phone: z
        .string()
        .regex(/^\+?[0-9 ()/-]{6,20}$/, 'Neispravan broj telefona (npr. "+387 33 000 000")')
        .optional(),
      email: z.union([z.email('Neispravan email'), z.literal('')]).optional(),
      website: optionalUrl,
      socials: z
        .strictObject({
          instagram: optionalUrl,
          facebook: optionalUrl,
          tiktok: optionalUrl,
          tripadvisor: optionalUrl,
        })
        .default({}),
      workingHours: z.array(workingHoursEntry).default([]),
      languages: uniqueArray(langCode, 'Jezici').min(1, 'Navedi barem jedan jezik'),
      defaultLanguage: langCode.default(DEFAULT_LANG),
      currency: z.enum(['KM', 'EUR']).default(DEFAULT_CURRENCY),
      priceLevel: z.number().int().min(1).max(4),
      theme: themeSchema.default({
        preset: 'warm',
        colors: {},
        fonts: { heading: 'fraunces', body: 'inter' },
        layout: 'cards',
        radius: 'lg',
        header: 'cover',
      }),
      showPoweredBy: z.boolean().default(true),
      updatedAt: z.iso.date('Datum mora biti u formatu GGGG-MM-DD'),
    })
    .superRefine((r, ctx) => {
      if (!r.languages.includes(r.defaultLanguage)) {
        ctx.addIssue({
          code: 'custom',
          path: ['defaultLanguage'],
          message: `defaultLanguage "${r.defaultLanguage}" mora biti u listi languages (${r.languages.join(', ')})`,
        });
      }
      if (r.theme.header === 'cover' && !r.cover) {
        ctx.addIssue({
          code: 'custom',
          path: ['cover'],
          message: 'theme.header je "cover", ali restoran nema cover sliku (dodaj "cover" ili promijeni header u "logo"/"minimal")',
        });
      }
      if (r.theme.header === 'logo' && !r.logo) {
        ctx.addIssue({
          code: 'custom',
          path: ['logo'],
          message: 'theme.header je "logo", ali restoran nema logo',
        });
      }

      // Kontrast: samo upozorenje, ne obara build.
      const colors = { ...THEME_PRESETS[r.theme.preset], ...r.theme.colors };
      const pairs = [
        ['text', 'background'],
        ['primary', 'surface'],
      ] as const;
      for (const [fg, bg] of pairs) {
        const ratio = contrastRatio(colors[fg], colors[bg]);
        if (ratio < WCAG_AA) {
          console.warn(
            `[BHMeni] Upozorenje (${r.name}): kontrast ${fg}/${bg} je ${ratio.toFixed(2)}:1, WCAG AA traži ${WCAG_AA}:1`,
          );
        }
      }
    });

// ---------------------------------------------------------------------------
// menu.json
// ---------------------------------------------------------------------------

const price = z
  .number({ error: (issue) => `Cijena mora biti broj (npr. 9.5), a ne ${JSON.stringify(issue.input)}` })
  .nonnegative('Cijena ne smije biti negativna')
  .max(100000, 'Cijena je nerealno visoka');

const variantSchema = z.strictObject({
  label: localizedText,
  price,
});

const menuItemSchema = ({ image }: SchemaContext) =>
  z
    .strictObject({
      id: slugId('ID jela'),
      name: localizedText,
      description: localizedText,
      image: image().optional(),
      price: price.optional(),
      variants: z.array(variantSchema).min(1, 'variants ne smije biti prazan niz').optional(),
      tags: uniqueArray(tagId, 'Tagovi').default([]),
      allergens: uniqueArray(allergenId, 'Alergeni').default([]),
      badge: z.enum(['new', 'popular', 'chef', 'sale']).optional(),
      available: z.boolean().default(true),
    })
    .superRefine((item, ctx) => {
      const hasPrice = item.price !== undefined;
      const hasVariants = item.variants !== undefined;
      if (hasPrice === hasVariants) {
        ctx.addIssue({
          code: 'custom',
          path: hasPrice ? ['variants'] : ['price'],
          message: hasPrice
            ? `Jelo "${item.id}" ima i "price" i "variants". Koristi samo jedno.`
            : `Jelo "${item.id}" nema cijenu. Dodaj "price" ili "variants".`,
        });
      }
    });

const menuSchema = (ctx: SchemaContext) =>
  z
    .strictObject({
      categories: z
        .array(
          z.strictObject({
            id: slugId('ID kategorije menija'),
            name: localizedText,
            description: localizedText.optional(),
            items: z.array(menuItemSchema(ctx)),
          }),
        )
        .min(1, 'Meni mora imati barem jednu kategoriju'),
    })
    .superRefine((menu, refineCtx) => {
      const categoryIds = new Map<string, number>();
      const itemIds = new Map<string, string>();
      menu.categories.forEach((category, ci) => {
        const previousCategory = categoryIds.get(category.id);
        if (previousCategory !== undefined) {
          refineCtx.addIssue({
            code: 'custom',
            path: ['categories', ci, 'id'],
            message: `Duplikat ID-a kategorije "${category.id}" (već korišten u categories[${previousCategory}])`,
          });
        } else {
          categoryIds.set(category.id, ci);
        }
        category.items.forEach((item, ii) => {
          const previous = itemIds.get(item.id);
          if (previous !== undefined) {
            refineCtx.addIssue({
              code: 'custom',
              path: ['categories', ci, 'items', ii, 'id'],
              message: `Duplikat ID-a jela "${item.id}" (već korišten u ${previous}). ID jela mora biti unikatan u cijelom meniju.`,
            });
          } else {
            itemIds.set(item.id, `kategoriji "${category.id}"`);
          }
        });
      });
    });

// ---------------------------------------------------------------------------
// Provjere strukture foldera (prije Zod validacije)
// ---------------------------------------------------------------------------

/** ID restorana = ime foldera. Odbija neispravne i rezervirane slugove. */
function restaurantSlugFromEntry({ entry }: { entry: string }): string {
  const slug = entry.split('/')[0] ?? '';
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `[BHMeni] Folder restorana "${slug}" nije ispravan slug. Dozvoljena su samo mala slova bez dijakritika, brojevi i crtice.`,
    );
  }
  if ((RESERVED_SLUGS as readonly string[]).includes(slug)) {
    throw new Error(`[BHMeni] Slug "${slug}" je rezerviran (${RESERVED_SLUGS.join(', ')}). Preimenuj folder restorana.`);
  }
  return slug;
}

const IMAGE_PATH = /^\.\.?\/.+\.(?:png|jpe?g|webp|avif|gif|svg)$/i;

/** Sve relativne putanje do slika u JSON-u (logo, cover, image jela...). */
function collectImagePaths(value: unknown, path: string, out: Array<[string, string]>): void {
  if (typeof value === 'string') {
    if (IMAGE_PATH.test(value)) out.push([path, value]);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => collectImagePaths(v, `${path}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) collectImagePaths(v, path ? `${path}.${k}` : k, out);
  }
}

/**
 * Svaki folder restorana mora imati i restaurant.json i menu.json, a sve slike moraju postojati.
 * (Astro bi nepostojeću sliku prijavio tek kad je stranica renderuje, a ovo hvata i neiskorištene.)
 */
function assertRestaurantFolders(): void {
  if (!existsSync(RESTAURANTS_DIR)) return;
  const problems: string[] = [];
  for (const dirent of readdirSync(RESTAURANTS_DIR, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const dir = `${RESTAURANTS_DIR}/${dirent.name}`;
    for (const required of ['restaurant.json', 'menu.json']) {
      const filePath = `${dir}/${required}`;
      if (!existsSync(filePath)) {
        problems.push(`${dir}/ nema ${required}`);
        continue;
      }
      let json: unknown;
      try {
        json = JSON.parse(readFileSync(filePath, 'utf8'));
      } catch (error) {
        problems.push(`${filePath}: neispravan JSON (${error instanceof Error ? error.message : String(error)})`);
        continue;
      }
      const images: Array<[string, string]> = [];
      collectImagePaths(json, '', images);
      for (const [field, relative] of images) {
        if (!existsSync(`${dir}/${relative}`)) {
          problems.push(`${filePath} → ${field}: slika "${relative}" ne postoji`);
        }
      }
    }
  }
  if (problems.length > 0) {
    throw new Error(`[BHMeni] Problemi u folderima restorana:\n  - ${problems.join('\n  - ')}`);
  }
}

assertRestaurantFolders();

// ---------------------------------------------------------------------------
// Kolekcije
// ---------------------------------------------------------------------------

const restaurants = defineCollection({
  loader: glob({ pattern: '*/restaurant.json', base: RESTAURANTS_DIR, generateId: restaurantSlugFromEntry }),
  schema: restaurantSchema,
});

const menus = defineCollection({
  loader: glob({ pattern: '*/menu.json', base: RESTAURANTS_DIR, generateId: restaurantSlugFromEntry }),
  schema: menuSchema,
});

const cities = defineCollection({ loader: file('src/data/cities.json'), schema: citySchema });
const categories = defineCollection({ loader: file('src/data/categories.json'), schema: categorySchema });
const allergens = defineCollection({ loader: file('src/data/allergens.json'), schema: iconTaxonomySchema });
const tags = defineCollection({ loader: file('src/data/tags.json'), schema: iconTaxonomySchema });

export const collections = { restaurants, menus, cities, categories, allergens, tags };
