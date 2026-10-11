# BHMeni: plan implementacije

Centralni imenik ugostiteljskih objekata u BiH + digitalni meni za svaki restoran (QR kod vodi direktno na meni).
Bez backenda, bez baze, bez panela za restorane. Sve podatke održava jedna osoba (vlasnik projekta) preko JSON fajlova u Git repozitoriju.

> **Kako koristiti ovaj plan s Claude Codeom:** radi jednu fazu po sesiji. Prompt: *"Pročitaj PLAN.md. Implementiraj Fazu N. Na kraju pokreni `npm run build` i `npm run validate`, pa ispiši šta radi, a šta ne. Ne prelazi na sljedeću fazu."* Svaka faza ima "Gotovo kada" kriterije. Ne prihvatati fazu dok nisu ispunjeni.

---

## 1. Ciljevi i principi

1. **Statički sajt** (Astro `output: 'static'`). Bez servera i baze, jedini trošak je domena.
2. **Jedan JSON fajl po restoranu za podatke, jedan za meni.** Zod šema validira sve pri buildu. Greška znači da build pada i loša verzija ne ide live.
3. **Mobile-first.** Većina korisnika dolazi skeniranjem QR koda s telefona. Sve se dizajnira prvo za ~375px.
4. **Brzina je funkcionalnost.** Mora ostati brz sa 100+ restorana (vidi poglavlje 6).
5. **Lako dodavanje restorana:** CLI skripta napravi gotov folder, a ti samo popuniš podatke.
6. **Ažuriranje s laptopa i telefona** (poglavlje 8).
7. **Brend BHMeni je skoro nevidljiv na menijima.** Samo sitan "Powered by" link u footeru (može se isključiti po restoranu).

## 2. Tehnologije

| Šta | Izbor | Razlog |
|---|---|---|
| Framework | **Astro (najnovija stabilna verzija, `npm create astro@latest`)**, TypeScript, `output: 'static'`. Zahtijeva Node.js ≥ 22.12.0 (neparne verzije nisu podržane) | Brz HTML, minimalan JS. Provjeriti dokumentaciju za API koje koristimo (Content Layer `glob` loader, `astro:assets`), jer se API mijenja između major verzija |
| Podaci | **Content Collections** (`glob` loader) + **Zod** | Validacija, tipovi, `image()` helper za slike |
| Interaktivnost (imenik) | **Preact** island (`@astrojs/preact`) | ~4 KB, dovoljno za filtere/pretragu/paginaciju |
| Interaktivnost (meni) | **Vanilla JS** `<script>` | Filter menija bez frameworka, nula dodatnog JS-a |
| Stilovi | Čisti CSS + CSS custom properties (bez Tailwinda) | Tema po restoranu = samo promjena varijabli |
| Slike | `astro:assets` (sharp) → WebP/AVIF, srcset | Automatska optimizacija pri buildu |
| Fontovi | `@fontsource-variable/*`, self-hosted, **`latin-ext` subset obavezan** (č ć š đ ž) | Bez Google Fonts zahtjeva, `font-display: swap` |
| QR | `qrcode` (npm) | SVG + PNG za štampu |
| SEO | `@astrojs/sitemap`, JSON-LD | |
| Hosting | **GitHub → Cloudflare Workers (static assets)**, auto-deploy na push u `main` (Workers Builds), privremena adresa `<ime>.<subdomena>.workers.dev` | Zahtjevi za statičke fajlove su besplatni i neograničeni. Komercijalna upotreba je dozvoljena prema trećim izvorima, a prije naplate restoranima provjeriti Cloudflare uslove |

> **Statički sajt = bez adaptera.** Ne instalirati `@astrojs/cloudflare` adapter niti koristiti `npm create cloudflare` sa SSR-om. Adapter treba samo za server rendering. Cloudflare dokumentacija za Astro opisuje SSR varijantu, ali nama ne treba.

> **Limiti Cloudflare free plana (provjereno u dokumentaciji):** **najviše 20.000 fajlova po verziji** (paid: 100.000) i najviše 25 MiB po fajlu. Svaka optimizirana slika je poseban fajl, pa pazi na broj varijanti (vidi 6.2). Limit broja buildova mjesečno za Workers Builds nije potvrđen, provjeriti u dokumentaciji pri Fazi 8 (za Pages je bio 500).

> **Workers, ne Pages:** Cloudflare je projekat napravio kao Worker sa static assets. Koristi se `wrangler.jsonc` s `assets.directory: ./dist`, bez polja `main` (nema Worker koda) i bez Astro adaptera.

## 3. Struktura repozitorija

```
bhmeni/
├─ PLAN.md
├─ astro.config.mjs
├─ package.json
├─ .pages.yml                      # konfiguracija CMS-a za uređivanje s mobitela (Faza 6)
├─ scripts/
│  ├─ new-restaurant.mjs           # interaktivno kreiranje restorana
│  ├─ validate.mjs                 # dodatne provjere preko Zod šeme
│  ├─ generate-qr.mjs              # QR kodovi (SVG + PNG)
│  ├─ import-menu-csv.mjs          # CSV → menu.json (opcionalno, Faza 5)
│  └─ seed-fake.mjs                # N lažnih restorana za test performansi
├─ qr/                             # generisani QR kodovi (u .gitignore)
├─ public/
│  └─ favicon.svg, robots.txt
└─ src/
   ├─ content.config.ts            # Zod šeme + kolekcije
   ├─ config/
   │  ├─ site.ts                   # naziv, URL, jezici (sa dir: ltr/rtl), page size
   │  └─ themes.ts                 # presets tema, allowlist fontova
   ├─ data/                        # taksonomije (ne mijenjaju se često)
   │  ├─ cities.json               # { id, name, region }
   │  ├─ categories.json           # vrste objekata/kuhinja (i18n nazivi)
   │  ├─ allergens.json            # 14 EU alergena (i18n + ikona)
   │  └─ tags.json                 # vegetarijansko, vegansko, halal, ljuto, bez glutena...
   ├─ content/restaurants/
   │  └─ <slug>/
   │     ├─ restaurant.json        # podaci o restoranu + tema
   │     ├─ menu.json              # kategorije i proizvodi
   │     └─ images/                # logo, cover, slike proizvoda
   ├─ i18n/
   │  ├─ ui.ts                     # UI tekstovi po jeziku (dugmad, labele)
   │  └─ utils.ts                  # t(), localize(), fallback
   ├─ layouts/                     # BaseLayout, DirectoryLayout, MenuLayout
   ├─ components/
   │  ├─ directory/                # RestaurantCard, FilterBar (Preact), Pagination, Hero
   │  └─ menu/                     # MenuHeader, CategoryNav, MenuItem (varijante), LanguageSwitcher, InfoSheet
   ├─ pages/
   │  ├─ index.astro               # imenik
   │  ├─ grad/[city].astro         # landing po gradu (SEO)
   │  ├─ [slug]/index.astro        # meni, default jezik (URL iz QR koda)
   │  ├─ [slug]/[lang].astro       # meni, ostali jezici
   │  ├─ search-index.json.ts      # lagani indeks svih restorana
   │  ├─ search-dishes.json.ts     # indeks jela (lazy)
   │  └─ 404.astro
   └─ styles/                      # tokens.css, base.css, directory.css, menu.css
```

**Rezervirani slugovi** (ne smiju se koristiti za restorane, validacija ih odbija): `grad`, `kategorija`, `search-index`, `search-dishes`, `404`, `_astro`, `api`, `o-nama`, `admin`.

## 4. Model podataka

### 4.1 Lokalizirani tekst

Svako tekstualno polje koje gost vidi je objekat po jeziku. **`bs` je obavezan**, ostali jezici su opcionalni, a fallback je `bs`.

```json
{ "bs": "Ćevapi u somunu", "en": "Ćevapi in somun bread", "de": "Ćevapi im Fladenbrot" }
```

Podržani jezici (u `site.ts`, lako se proširuju): `bs`, `en`, `de`, `tr`, `ar` (**RTL**), `it`. Svaki ima `dir`. Koristiti **CSS logical properties** (`margin-inline-start`, `padding-inline` itd.) od početka da RTL radi bez prepravke.

### 4.2 `restaurant.json`

```json
{
  "name": "Ćevabdžinica Željo",
  "active": true,
  "listed": true,
  "featured": false,
  "city": "sarajevo",
  "categories": ["cevabdzinica", "domaca-kuhinja"],
  "description": { "bs": "Tradicionalni ćevapi od 1972.", "en": "Traditional ćevapi since 1972." },
  "logo": "./images/logo.png",
  "cover": "./images/cover.jpg",
  "address": "Kundurdžiluk 12, Sarajevo",
  "googleMapsUrl": "https://maps.google.com/?q=...",
  "coordinates": { "lat": 43.8598, "lng": 18.4313 },
  "phone": "+387 33 000 000",
  "email": "info@example.ba",
  "website": "https://example.ba",
  "socials": { "instagram": "https://...", "facebook": "https://...", "tiktok": "", "tripadvisor": "" },
  "workingHours": [
    { "days": "Pon–Pet", "hours": "08:00–23:00" },
    { "days": "Sub–Ned", "hours": "09:00–00:00" }
  ],
  "languages": ["bs", "en", "de"],
  "defaultLanguage": "bs",
  "currency": "KM",
  "priceLevel": 2,
  "theme": {
    "preset": "warm",
    "colors": { "primary": "#B3261E", "accent": "#F2A33A", "background": "#FFF8F0", "surface": "#FFFFFF", "text": "#2B1B12" },
    "fonts": { "heading": "playfair-display", "body": "inter" },
    "layout": "cards",
    "radius": "lg",
    "header": "cover"
  },
  "showPoweredBy": true,
  "updatedAt": "2026-10-11"
}
```

Pravila:
- `active: false` → restoran se uopće ne builda (privremeno isključivanje).
- `listed: false` → meni radi preko QR/URL-a, ali se **ne prikazuje u imeniku** i nije u indeksu pretrage.
- `featured: true` → prikazuje se u istaknutoj sekciji na početnoj.
- `city` i `categories` moraju postojati u `src/data/*.json` (provjera pri buildu).
- `theme.layout`: `cards` (slika gore), `list` (mala slika lijevo), `compact` (bez slika, gust tekst), `photo-grid` (2 kolone velike slike).
- `theme.fonts` samo iz allowlist-e u `themes.ts` (učitava se samo font koji restoran koristi).
- Pri buildu **upozorenje** ako kontrast `text`/`background` ili `primary`/`surface` ne zadovoljava WCAG AA.
- Opcionalno: ako postoji `src/styles/restaurants/<slug>.css`, uključuje se samo na stranicama tog restorana (potpuni custom izgled). Za potpuno drugačiji layout moguć je poseban Astro layout po restoranu (`layout: "custom"`).

### 4.3 `menu.json`

```json
{
  "categories": [
    {
      "id": "glavna-jela",
      "name": { "bs": "Glavna jela", "en": "Main dishes" },
      "items": [
        {
          "id": "cevapi-10",
          "name": { "bs": "Ćevapi", "en": "Ćevapi" },
          "description": { "bs": "Domaći ćevapi u somunu sa lukom i kajmakom.", "en": "Homemade ćevapi with onion and kajmak." },
          "image": "./images/cevapi.jpg",
          "price": 9.5,
          "variants": [
            { "label": { "bs": "5 komada", "en": "5 pieces" }, "price": 6.5 },
            { "label": { "bs": "10 komada", "en": "10 pieces" }, "price": 9.5 }
          ],
          "tags": ["halal"],
          "allergens": ["gluten", "milk"],
          "badge": "popular",
          "available": true
        }
      ]
    }
  ]
}
```

Pravila:
- Obavezno po proizvodu: `id` (unikatan u meniju), `name`, `description`, **`price` ili `variants`** (ne oba). `image` je opcionalan, bez nje se prikazuje elegantan placeholder (bez razlike u visini kartice).
- `available: false` → stavka je sakrivena (ili prikazana kao "Trenutno nedostupno"; globalna postavka).
- `badge`: `new`, `popular`, `chef`, `sale`.
- `tags` i `allergens` su ID-ovi iz taksonomija. Nepoznat ID znači build pada.
- Cijena je broj. Formatiranje (`9,50 KM`) radi aplikacija po locale-u jezika.

## 5. Rute i stranice

| Ruta | Opis |
|---|---|
| `/` | Imenik: hero + pretraga, filter grad/kategorija, istaknuti, mreža restorana s paginacijom |
| `/grad/[city]` | Statička landing stranica po gradu (SEO, dijeljenje linkova) |
| `/<slug>` | Meni na default jeziku (**ovo je URL u QR kodu**) |
| `/<slug>/<lang>` | Meni na drugom jeziku (statički generisan za svaki jezik iz `languages`) |
| `/search-index.json` | Lagani indeks svih `listed` restorana |
| `/search-dishes.json` | Indeks naziva jela po restoranu (učitava se tek pri prvom fokusu na pretragu) |

### Meni stranica (srž proizvoda)

- **Header:** cover/logo, naziv, kratki opis, status "Otvoreno/Zatvoreno" ako su radni sati dostupni (računa se na klijentu, ne pri buildu).
- **Info sheet** (dugme "Info"): adresa, **Google Maps** dugme, telefon (`tel:`), email, web, društvene mreže (ikone), radno vrijeme.
- **Sticky navigacija po kategorijama** (horizontalni scroll na mobitelu, scroll-spy označava aktivnu).
- **Pretraga unutar menija** + **filter-chipovi** (vegetarijansko, vegansko, halal, ljuto, bez glutena...) + filter po alergenima ("sakrij jela sa: ..."). Vanilla JS filtrira preko `data-*` atributa. Sve je u HTML-u, filtriranje samo skriva elemente.
- **Proizvod:** slika, naziv, opis, cijena/varijante, tag ikone, alergeni, badge. Tap na sliku otvara uvećan prikaz (`<dialog>`).
- **Language switcher:** obični linkovi na `/<slug>/<lang>`, bez JS-a.
- **Prijedlog jezika:** ako je jezik preglednika podržan a nije aktivan, prikaže se dismissible baner "View in English?". Izbor se pamti u `localStorage`. **Bez automatskog redirecta** (nema flash-a i ne šteti SEO-u).
- **Footer:** sitni "Powered by BHMeni" (ako `showPoweredBy`) + link na imenik.
- `<link rel="alternate" hreflang>` za sve jezike, `lang` i `dir` atributi na `<html>`.

### Imenik (početna)

- Hero s velikom pretragom, ispod čipovi za gradove i kategorije.
- Istaknuti restorani (`featured`), pa mreža kartica: cover, logo, naziv, grad, 1-2 kategorije, zastavice/oznake jezika, raspon cijena.
- 1 kolona na mobitelu, 2 na tabletu, 3-4 na desktopu.
- Footer s kratkim kontaktom i informacijom o projektu (tekst definisati kasnije).

## 6. Performanse, pretraga i paginacija (ključni dio)

**Cilj:** mobilni Lighthouse Performance ≥ 95, LCP < 2,5 s na sporoj 4G mreži, i za 100+ restorana.

### 6.1 Pretraga preko SVIH restorana, prikaz paginiran

Problem: ako se prikazuje samo jedna stranica, pretraga ne smije biti ograničena na nju.

Rješenje, tri sloja:
1. **Statički HTML prve stranice** (12 kartica) generisan pri buildu. Brz prvi prikaz i SEO.
2. **`/search-index.json`**: sadrži *sve* `listed` restorane, ali samo lagana polja (`slug, name, city, categories, thumb, shortDesc, languages, priceLevel`). Procjena: ~300-500 bajta po restoranu, pa za 100 restorana ~30-50 KB, oko 10 KB gzip. Procijeniti stvarnom mjerom u Fazi 7.
3. **Preact island** (`client:load`) učita indeks, i **pretraga + filtriranje rade nad cijelim indeksom u memoriji**, a paginacija je samo "prozor" nad rezultatima:
   - Veličina stranice: 12 (konfigurabilno u `site.ts`).
   - Numerisana paginacija ("1 2 3 … 9"), stanje u URL-u (`?q=&grad=&kat=&str=2`), pa su linkovi dijeljivi, a dugme "nazad" radi.
   - Promjena filtera/pretrage resetuje na stranicu 1; promjena stranice skroluje do vrha mreže.
   - Prikaz broja rezultata ("37 restorana"), prazno stanje s prijedlogom ("Ukloni filter").
4. **Pretraga jela** ("ćevapi" pronađe restorane koji ih imaju): `/search-dishes.json` (samo nazivi jela po restoranu, bez opisa) učitava se **lazy**, tek kad korisnik fokusira polje pretrage. Procjena ~25 KB gzip za 100 restorana × 50 jela.

**Normalizacija pretrage (obavezno):** mala slova, uklanjanje dijakritika (`č ć š ž đ` → `c c s z dj`), pa "cevapi" nalazi "Ćevapi", tokenizacija po razmaku, svi tokeni moraju pogoditi. Pretraga je debounced (~150 ms). Bez eksterne biblioteke (osim ako se pokaže potreba za fuzzy matchingom).

**Prag za odluku:** do ~300 restorana ovaj pristup ostaje bez problema. Ako ikad pređe, indeks se može razbiti po gradovima ili prebaciti na Pagefind.

### 6.2 Ostale mjere

- **Slike:** `astro:assets`, WebP/AVIF, `srcset`; kartice imenika cover 640w, stavke menija 160/320w; **fiksni `aspect-ratio`** (bez CLS); `loading="lazy"` + `decoding="async"` osim prve vidljive slike (`fetchpriority="high"`).
- **Fontovi:** samo fontovi koji se koriste, `latin-ext`, `font-display: swap`, preload jednog glavnog fonta.
- **JS:** meni stranica ≈ 0 KB frameworka (samo vanilla skripta za filtere, ~2-3 KB). Imenik: Preact island (~4 KB + kod).
- **CSS:** inline kritični (Astro to radi sa scoped stilovima), tema kao CSS varijable inline na `<body>`.
- **Build vrijeme:** optimizacija slika (sharp) je najsporiji dio. U Fazi 7 se mjeri build s 100 lažnih restorana. Ako je prespor, opcije: (a) kompresovati slike prije commita (validate skripta upozorava na fajlove > 1,5 MB), (b) smanjiti broj generisanih varijanti slika, (c) obrisati ili isključiti (`active: false`) neaktivne restorane.
- **Broj fajlova u `dist/` (limit Cloudflare free: 20.000):** u Fazi 7 prebrojati fajlove (`find dist -type f | wc -l`). Primjer procjene: 100 restorana × 60 jela × 2 veličine slike je oko 12.000 fajlova samo za slike. Mjere: jedna veličina slike jela (npr. 320w) umjesto dvije, samo jedan format (WebP), bez zasebnih varijanti za `ar`/`de` (slike su iste). Ako se limit približi, validate skripta upozorava na 15.000+.
- **Keširanje:** hash-irani `/_astro/*` fajlovi se kešuju dugoročno; HTML kratko (Cloudflare default).
- Bez trackera i bez eksternih skripti.

## 7. Alati za rad (skripte)

### `npm run new-restaurant`
Interaktivno pita: naziv, grad (lista iz `cities.json`), kategorije (multi-select), jezici, boja teme. Zatim:
- generiše `slug` (bez dijakritika, mala slova, provjera unikatnosti i rezerviranih slugova),
- kreira `src/content/restaurants/<slug>/` sa `restaurant.json`, `menu.json` (jedna prazna kategorija s primjerom jela) i `images/`,
- ispiše šta ostaje da se popuni i URL za QR.

### `npm run validate`
Pokreće `astro check` + dodatne provjere: duplikati ID-eva jela, nedostajući prijevodi (upozorenje po jeziku iz `languages`), nepoznati tagovi/alergeni/gradovi, nedostajuće ili preteške slike, neispravni URL-ovi (Maps, društvene mreže), kontrast boja, rezervirani slugovi. Greške obaraju proces, upozorenja se samo ispišu. Pokreće se i u CI-u prije deploya.

### `npm run qr -- <slug | --all>`
Generiše `qr/<slug>.svg` i `qr/<slug>.png` (visoka rezolucija, error correction **M**, dovoljan quiet zone). URL = `${SITE_URL}/<slug>?src=qr`. Opcionalno: logo u sredini (tada ECC **H**) i printabilna A6 "table tent" HTML stranica.
> **VAŽNO: ne štampati QR kodove dok domena nije konačna.** QR kodovi sadrže URL, a odštampani se ne mogu promijeniti. Za testiranje koristi workers.dev adresu, a za štampu tek finalnu domenu. Slug restorana se nikad ne mijenja nakon štampe.

### `npm run import-menu -- <slug> menu.csv` (opcionalno)
Brzi prvi unos menija iz Excel/CSV tabele (kolone: `kategorija_bs, naziv_bs, opis_bs, cijena, tagovi, alergeni, naziv_en, opis_en...`) u `menu.json`. Ubrzava dodavanje novog restorana s 80 jela.

### `npm run seed:fake -- 100`
Generiše N lažnih restorana (u `src/content/restaurants/_fake-*`, u `.gitignore`) za test performansi i dizajna. Mješavina gradova, kategorija, 30-80 jela po meniju, nasumične slike iz malog seta.

## 8. Ažuriranje sadržaja (laptop + mobitel)

- **Laptop:** VS Code, izmjena JSON-a, pa `git push`. Zod šema u editoru daje autocomplete i greške (generisati JSON Schema iz Zod-a: `zod-to-json-schema` i povezati kroz `$schema` ili VS Code `json.schemas`).
- **Mobitel:** **Pages CMS** (pagescms.org, besplatan, piše direktno u GitHub repo, bez servera). `.pages.yml` mapira `restaurant.json` i `menu.json` u forme (polja, dropdown za grad/kategorije/tagove, upload slika). Prijava je samo tvoj GitHub nalog. *Provjeriti trenutnu dokumentaciju za sintaksu `.pages.yml` prije implementacije.* Alternativa: GitHub mobilna aplikacija / `github.dev` (bez forme, veći rizik greške).
- **Tok izmjene cijene:** vlasnik pošalje poruku → otvoriš Pages CMS → promijeniš cijenu → Save (commit) → Cloudflare build → live za otprilike 1-2 min (procjena, izmjeriti).
- **Zaštita:** build pada na nevalidnom JSON-u pa stara verzija ostaje live. Vraćanje na prethodnu verziju je `git revert` ili rollback na prethodni deployment u Cloudflare dashboardu.
- **Limit buildova:** Svaki Save u CMS-u je jedan commit i jedan build, pa grupiši izmjene (npr. više cijena odjednom). Mjesečni limit buildova provjeriti u Cloudflare dokumentaciji za Workers Builds.
- Za veće izmjene koristiti granu + preview URL (Cloudflare pravi preview deploy za grane i pull requestove), pa merge.

## 9. Dizajn

- **Smjer:** moderno, toplo, "foodie". Mnogo bijelog prostora, velike slike, zaobljeni uglovi, suptilne sjene. Imenik: svijetla pozadina, jedan jak accent (npr. topla narandžasto-crvena). Tipografija: izražajan display font za naslove + čitljiv sans za tekst (oba s `latin-ext`).
- **Design tokeni** u `tokens.css` (boje, razmaci, radijusi, sjene, tipografska skala). Teme restorana samo prepisuju tokene.
- **Mobile-first breakpointi:** 375 (baza), 640, 1024, 1280. Tap mete ≥ 44 px, `100dvh` umjesto `100vh`, sticky elementi ne smiju prekrivati sadržaj, `env(safe-area-inset-*)` za iPhone.
- **Pristupačnost:** semantički HTML, alt tekstovi (naziv jela), vidljiv fokus, kontrast AA, poštovati `prefers-reduced-motion`. Tamni režim je opcioni (kasnija faza).
- Prije implementacije UI-a koristiti `frontend-design` skill za distinktivan izgled umjesto generičkog šablona.

## 10. Faze implementacije

### Faza 0: Setup
- `npm create astro@latest` (TypeScript strict, empty), dodati `@astrojs/preact`, `@astrojs/sitemap`, `sharp`, `qrcode`, fontsource pakete.
- `site.ts` (jezici, page size, `SITE_URL` iz env-a, fallback na `workers.dev` URL), `tokens.css`, `base.css`, BaseLayout, 404.
- `.gitignore` (`qr/`, `_fake-*`), ESLint/Prettier opcionalno, GitHub repo.
- **Gotovo kada:** `npm run dev` i `npm run build` prolaze, prazna početna se prikazuje.

### Faza 1: Model podataka
- `content.config.ts`: Zod šeme (`restaurants`, `menus`, taksonomije), `image()` za slike, lokalizirani tekst helper, `refine` za cijena-ili-varijante.
- Taksonomije: gradovi (Sarajevo, Mostar, Banja Luka, Tuzla, Zenica, Bihać, Trebinje, Brčko...), kategorije, 14 alergena, tagovi.
- 3 ručno napravljena primjer restorana s realističnim menijem i slikama.
- **Gotovo kada:** build prolazi; namjerno pogrešan JSON (nepoznat grad, duplikat ID-a, cijena kao tekst) obara build s razumljivom porukom.

### Faza 2: Stranica menija
- `[slug]/index.astro` + `[slug]/[lang].astro` (`getStaticPaths` za svaki jezik), `localize()` s fallbackom.
- Komponente: MenuHeader, CategoryNav (sticky + scroll-spy), MenuItem (4 layouta), InfoSheet, LanguageSwitcher, footer.
- Sistem tema: `theme` → CSS varijable, presets, učitavanje samo korištenih fontova, per-restaurant CSS override.
- Vanilla JS: pretraga u meniju, tag/alergen filteri, `<dialog>` za sliku.
- **Gotovo kada:** 3 primjera restorana izgledaju različito (različite teme/layouti), rade na 375px, filteri rade, nema horizontalnog skrola.

### Faza 3: Višejezičnost
- `i18n/ui.ts` (UI tekstovi za sve jezike; **prijevode treba pregledati osoba koja zna jezik**), formatiranje cijena po locale-u, RTL za `ar`, hreflang, baner prijedloga jezika.
- **Gotovo kada:** isti meni radi na bs/en/de/ar, arapski se ispravno prikazuje zdesna nalijevo, nedostajući prijevod pada na bs bez greške.

### Faza 4: Imenik (početna)
- Hero, FilterBar (Preact), RestaurantCard, Pagination, istaknuti restorani, `grad/[city]`.
- `search-index.json` i `search-dishes.json`, normalizacija dijakritika, URL stanje, prazna stanja.
- **Gotovo kada:** pretraga "cevapi" nalazi "Ćevapi"; pretraga pronalazi restoran koji **nije** na trenutnoj stranici; filter grad+kategorija radi kombinovano; refresh sa `?grad=mostar&str=2` vraća isto stanje.

### Faza 5: Alati
- `new-restaurant`, `validate`, `generate-qr`, (opcionalno) `import-menu-csv`, `seed:fake`.
- **Gotovo kada:** novi restoran se napravi jednom komandom za < 1 minut i odmah se builda; QR kod skeniran telefonom otvara tačan meni.

### Faza 6: Uređivanje s mobitela
- JSON Schema za editor + `.pages.yml` za Pages CMS; testirati izmjenu cijene i upload slike s telefona od početka do live-a.
- Kratko uputstvo `docs/azuriranje.md` (kako promijeniti cijenu, dodati jelo, sakriti jelo, dodati sliku).
- **Gotovo kada:** cijena promijenjena na telefonu je live bez laptopa.

### Faza 7: Performanse, SEO, test s 100 restorana
- `seed:fake 100`: izmjeriti **vrijeme builda**, **veličinu `search-index.json` (raw/gzip)**, Lighthouse mobile za imenik i jedan veliki meni, WebPageTest ili Lighthouse throttling na 4G.
- SEO: `<title>`/description po stranici, OpenGraph (cover), JSON-LD `Restaurant`, sitemap (svi `listed` restorani i gradovi), `robots.txt`.
- Ako ciljevi nisu ispunjeni, primijeniti opcije iz 6.2.
- **Gotovo kada:** Lighthouse mobile ≥ 95 (Performance, A11y, SEO) na imeniku i meniju sa 100 restorana; zabilježeni brojevi u `docs/performance.md`.

### Faza 8: Deploy (GitHub + Cloudflare Workers)
- Projekat je već povezan s GitHub repoom u Cloudflare dashboardu (Workers & Pages).
- U korijen repoa dodati `wrangler.jsonc`:
  ```jsonc
  {
    "name": "bhmeni",
    "compatibility_date": "2026-10-11",
    "assets": { "directory": "./dist", "not_found_handling": "404-page" }
  }
  ```
  (`name` mora odgovarati imenu Workera u Cloudflareu. Nema `main` polja i nema `@astrojs/cloudflare` adaptera.)
- U Cloudflare Settings → Build: build command `npm run validate && npm run build` (do Faze 5 samo `npm run build`), deploy command `npx wrangler@latest deploy`.
- Env varijable: `SITE_URL` (privremeno `https://bhmeni.<subdomena>.workers.dev`) i, ako build javi grešku o verziji Node-a, `NODE_VERSION=22` (Astro traži ≥ 22.12.0; dodati i `engines` u `package.json` i `.nvmrc`).
- Preview okruženja za grane i pull requestove (Worker Previews).
- **Gotovo kada:** sajt live na `workers.dev` adresi, push u `main` automatski objavljuje, nevalidan JSON blokira deploy, broj fajlova u `dist/` je zabilježen (limit 20.000).

### Faza 9: Domena i završna obrada
- Kupiti domenu, dodati je u Cloudflare Worker projektu (Settings → Domains & Routes), postaviti `SITE_URL`, rebuild, **tek tada generisati i štampati QR kodove**. Staviti redirect sa `workers.dev` adrese na domenu.
- Opcionalno: tamni režim, jednostavna analitika (Cloudflare Web Analytics ili Plausible), A6 table-tent za štampu, `404` i `o-nama`/kontakt stranica.

## 11. Rizici i napomene

| Rizik | Mjera |
|---|---|
| Sporiji build zbog slika | Mjeriti u Fazi 7; kompresija prije commita; alternative u 6.2 |
| Limit od 20.000 fajlova (Cloudflare free) | Manje varijanti slika, brojati fajlove u Fazi 7; plaćeni plan ima viši limit |
| Limit buildova mjesečno (nepotvrđen za Workers Builds) | Grupisati izmjene u CMS-u; provjeriti limit u dokumentaciji |
| Cloudflare mijenja proizvode (Pages → Workers) | Koristimo Workers static assets; statički `dist/` se lako prebacuje |
| Odštampani QR s pogrešnim URL-om | Štampati tek na konačnoj domeni; slug se ne mijenja |
| Alergeni/cijene netačni | Odgovornost je na onome ko održava podatke. Dogovoriti s vlasnicima pisane izmjene |
| Prijevodi UI-a loši | Mašinski prijevod kao nacrt, pregled izvornog govornika (naročito `ar`, `tr`, `de`) |
| Ručno održavanje postaje usko grlo | Normalno do nekoliko desetina restorana; strukturirani podaci omogućavaju kasnije dodavanje panela bez prepravke menija |
| Pages CMS sintaksa/ograničenja | Provjeriti dokumentaciju pri Fazi 6; fallback je `github.dev` |

## 12. Konvencije (za Claude Code)

- TypeScript strict, bez `any`. Čisti CSS s tokenima, bez CSS frameworka.
- Sav tekst koji vidi gost ide kroz `localize()` / `t()`. Bez hardkodiranih stringova u komponentama.
- CSS logical properties (RTL spremnost), mobile-first media queryji.
- Nikad ne uvoditi JS framework u meni stranicu. Interaktivnost ide kroz malu vanilla skriptu.
- Nikad ne dodavati eksterne zahtjeve (CDN fontovi, trackeri) bez odobrenja.
- Svaka faza se završava prolaznim `npm run build` i `npm run validate`.

## 13. Pozicioniranje i originalnost

BHMeni nije kopija nijednog postojećeg sajta. Gradi se isključivo iz zahtjeva u ovom planu.

**Pravila:**
- Ne kopirati tekstove, dizajn, logo, slike ni kod s drugih platformi (uključujući gastrohub.ba). Sav sadržaj i vizuelni identitet su originalni.
- BHMeni dobija vlastiti identitet: wordmark/logo, paletu i tipografiju (definisati u Fazi 0 i 4).

**Šta BHMeni radi drugačije (vodeća načela):**
1. **Brzina:** statički HTML s CDN-a. Cilj je meni otvoren za manje od 1 s na 4G, bez prijave i bez instalacije aplikacije.
2. **Konkretnost:** gost dolazi po jednu stvar (restoran ili meni). Bez suvišnih sekcija, banera i obaveznih koraka.
3. **Pretraga po jelu preko svih restorana** ("ćevapi" → restorani koji ih imaju), trenutno, bez čekanja servera.
4. **Dizajn po restoranu:** svaki meni izgleda kao brend restorana, ne kao šablon platforme.
5. **Bez backenda:** izmjena cijene je live za nekoliko minuta, bez panela i bez troška servera.

**Moguća dodatna poboljšanja (Faza 10, opcionalno, svaka posebno):**
- **"Otvoreno sada"** filter u imeniku (računa se na klijentu iz `workingHours`).
- **"U blizini"**: udaljenost od korisnika iz `coordinates` (geolokacija u pregledniku, ništa se ne šalje serveru, traži dozvolu korisnika).
- **Offline/PWA meni**: service worker kešira meni da radi i bez signala. Pažnja: zastarjele cijene, pa network-first uz kratak rok keša.
- **Filter po rasponu cijena** (`priceLevel`) i sortiranje.
- **Dijeljenje menija** (Web Share API) i dugme "Dodaj na početni ekran".
- **Tamni režim.**
