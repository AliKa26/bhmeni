# CSS po restoranu (opcionalno)

Fajl `<slug>.css` u ovom folderu se automatski ubacuje (inline, minificiran) **samo** na stranice menija
tog restorana (`/<slug>` i `/<slug>/<lang>`). Ostale stranice ga ne učitavaju.

Sadržaj se pri buildu omota u `#restaurant-<slug> { … }` (CSS nesting). Zato:

- piši obične selektore (`.category-head h2 { … }`): ID daje dovoljnu specifičnost da pobijede
  scoped stilove komponenti, a pravila nikad ne djeluju na druge restorane;
- za sam `<body>` (npr. CSS varijable) koristi `&`:
  ```css
  & { --radius-card: 14px; }
  ```
- `@media` unutar fajla radi; `@keyframes`, `@font-face` i `@import` **ne rade** (ne smiju biti unutar pravila).

Preporuke:

- Prvo pokušaj s temom u `restaurant.json` (`preset`, `colors`, `fonts`, `layout`, `radius`, `header`).
  Ovaj fajl je za sitnice koje tema ne pokriva.
- Koristi logical properties (`margin-inline-start`, `padding-inline`…) zbog RTL jezika.
- Bez eksternih resursa (fontovi, slike s drugih domena).
