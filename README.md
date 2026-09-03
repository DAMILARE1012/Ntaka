# Ntaka

A digital language-learning platform for African languages — 1-on-1 lessons, group classes and
self-paced video courses, taught by native speakers and graded against the six CEFR levels.

React + Vite · Redux Toolkit (with RTK Query) · Tailwind CSS.

```bash
npm install
npm run dev             # http://localhost:5173
npm run build           # SPA bundle only
npm run build:static    # bundle + prerender 391 pages + sitemap  <- ship this
npm run preview
```

Set the canonical host before any real build, or every canonical and sitemap URL points
at the wrong domain:

```bash
VITE_SITE_URL=https://your-domain.com npm run build:static
```

---

## What is in the product

| Feature | Route | Notes |
| --- | --- | --- |
| Homepage | `/` | Hero, language rail, placement band, the three ways to learn, teacher/class/course rails, learner stories |
| **Free placement test** | `/placement-test` | Language → background → graded quiz (or CEFR self-check) → level + what to do next |
| 1-on-1 lessons | `/teachers`, `/teachers/:id` | Rating, rate, specialities and a live 7-day availability grid on every card |
| Group classes | `/classes`, `/classes/:id` | Level, topic, teacher rating, schedule and a seat meter |
| Video learning | `/video-learning`, `/video-learning/:id` | Self-paced on-demand courses with a module/lesson curriculum |
| Language catalogue | `/languages`, `/languages/:id` | 25 languages across 14 countries, grouped by region |

### "Video Learning" — the term

The industry term for pre-recorded, non-live course content is a **self-paced** (or **on-demand**)
**video course**. Ntaka uses *Video Learning* as the navigation label and *self-paced video course*
in body copy — clear to learners, and it does not collide with "lesson" (1-on-1) or "class" (group).

### The six levels

Ntaka teaches to the full CEFR scale, defined once in [`src/lib/cefr.js`](src/lib/cefr.js) and used
everywhere:

| | | |
| --- | --- | --- |
| **A1** Beginner | **A2** Elementary | **B1** Intermediate |
| **B2** Upper intermediate | **C1** Advanced | **C2** Mastery |

> Note: your brief listed six levels but named five (A1, A2, B1, B2, C1). CEFR's sixth is **C2
> (Mastery)**, so it is included to make the set of six complete. Drop it by deleting the last entry
> in `CEFR_LEVELS` — nothing else needs to change.

### The free placement test

Two routes, one result shape:

- **Graded quiz** — 8 authored items per language, ordered A1 → C1, each worth points equal to the
  level it tests. Available for Yorùbá, Igbo, Hausa, Swahili, isiZulu, Twi, Wolof and Amharic.
- **CEFR self-check** — every other language. The learner ticks can-do statements; the highest
  *consecutive* statement sets the level.

Quiz-route learners also complete the self-check. If their self-assessment sits more than one level
above their quiz score, the result is nudged up one level — the common case for heritage speakers
who understand far more than they read. The result page shows the level, the CEFR ladder, an answer
review, and teachers, classes and courses at (or nearest to) that level. The outcome is persisted to
`localStorage`, so the homepage greets returning learners with their level.

To move a language onto the quiz route: add a bank to `QUESTION_BANKS` in
[`src/services/mock/placement.js`](src/services/mock/placement.js) and set `hasPlacementBank: true`
in the catalogue. Nothing else changes.

---

## Architecture

```
src/
├── app/                     store, typed-ish hooks, useDebounced
├── lib/                     cefr · schedule · format · prng   (pure, no React)
├── services/
│   ├── api.js               ← the single RTK Query API surface
│   └── mock/                catalogue, teachers, classes, videos, placement, db
├── components/
│   ├── ui/                  Button, Badge, Avatar, Rating, Field, Icon, Pagination, Skeleton, States
│   ├── common/              LevelBadge, LevelLadder, AvailabilityGrid, ProficiencyBars, VideoThumb
│   └── layout/              Navbar, Footer, Logo, ThemeToggle, PageLayout
├── features/                one folder per feature: slice + components/
│   ├── teachers/            teachersSlice · TeacherCard, TeacherFilters, TeacherList, TeacherMiniCard
│   ├── classes/             classesSlice  · ClassCard, ClassFilters, ClassList
│   ├── videos/              videosSlice   · CourseCard, CourseFilters, CourseList
│   ├── placement/           placementSlice· PlacementWizard, LanguagePicker, QuestionCard,
│   │                                        SelfAssessment, PlacementResult
│   ├── learner/             learnerSlice (persisted: level, saved teachers/courses)
│   ├── theme/               themeSlice (day/night, persisted, no flash on reload)
│   ├── languages/           LanguageCard
│   └── home/                Hero, LanguageRail, PlacementBanner, Offerings, FeaturedTeachers,
│                            LanguagesByRegion, HomeRails, Testimonials, TeachCta
└── pages/                   thin route components — compose feature components, hold no logic
```

**The rules the code follows**

- Pages compose, features decide, `lib/` computes. A page never contains business logic.
- Each feature owns one slice holding *filter and wizard state only*. Server data lives in RTK Query.
- Filter slices are uniform: `setQuery`, `setFilter({key, value})`, `setSort`, `setPage`,
  `clearFilters` — and every non-paging change resets to page 1.
- One place per concept: a CEFR code only becomes a chip in `LevelBadge`, a rating only becomes stars
  in `Rating`, availability only becomes a grid in `AvailabilityGrid`.

### Swapping in a real backend

Every endpoint lives in [`src/services/api.js`](src/services/api.js) and resolves against the
in-memory catalogue through `queryFn`. To go live:

```js
// services/api.js
baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
// then per endpoint:
getTeachers: builder.query({ query: (params) => ({ url: '/teachers', params }) }),
```

No component, hook or slice changes — they consume `useGetTeachersQuery` either way. The query
shapes in [`src/services/mock/db.js`](src/services/mock/db.js) double as the API contract.

### Demo data

The catalogue is generated deterministically (seeded PRNG in `lib/prng.js`), so the same teacher
always has the same name, rating, rate and availability across reloads. Availability is generated
relative to *today*, so the 7-day grid is always current. Teacher names are drawn from
language-appropriate pools in `services/mock/names.js`.

Avatars and video covers are rendered as deterministic gradient panels rather than stock photos —
no external image dependency, and no fake people.

**Flags** are real SVGs, not emoji. Windows ships no regional-indicator glyphs, so an emoji flag
degrades to bare ISO letters ("NG"). The fourteen flags this catalogue needs are vendored into
`public/flags/` from [lipis/flag-icons](https://github.com/lipis/flag-icons) (MIT, licence copied
alongside them) — ~55KB total, no runtime dependency. Render them through
[`components/common/Flag.jsx`](src/components/common/Flag.jsx); adding a country means adding its
`iso` in `catalog.js` and dropping the matching SVG in.

**The hero language rail** is a marquee: the track holds two identical groups and animates to
`translateX(-50%)`, exactly one group wide, so the loop is seamless. Tile width is measured from the
container with a `ResizeObserver` (four across on desktop, three then two as it narrows) and the
duration is derived from it, so the speed stays constant at 52px/s whatever the catalogue size. It
pauses on hover and `:focus-within`, and is disabled entirely under `prefers-reduced-motion`.

---

## Theme

**Green and white, day and night.** One palette expressed as CSS custom properties, so a
component never writes a `dark:` variant to get its background, border or text right — it uses
`bg-surface`, `border-line`, `text-fg`, `text-muted`, `bg-brand` and the theme resolves them.

| Token | Light | Dark |
| --- | --- | --- |
| `bg` page ground | `#F9FBFA` | `#08100C` |
| `surface` cards | `#FFFFFF` | `#0E1813` |
| `subtle` inset panels | `#F1F6F3` | `#15231B` |
| `line` / `line-strong` | `#E2EAE5` / `#CDDAD2` | `#203228` / `#2F4739` |
| `fg` / `muted` / `faint` | `#0D2218` / `#586A60` / `#809288` | `#E8F2EC` / `#99ADA1` / `#788C81` |
| `brand` | `#16794C` | `#43AE7C` |
| `accent` (ratings only) | `#B96D0E` | `#F2C752` |

Two fixed scales sit alongside for gradients and always-dark panels: `leaf` (50–950) and `ink`
(50–950). Level chips deepen through the greens as the CEFR level rises, so two badges can be
ranked without reading them.

**The toggle** lives in the navbar (and in the mobile menu under *Appearance*). State is held in
`features/theme/themeSlice.js`, mirrored onto `<html class="dark">` by middleware and saved to
`localStorage`, along with the `theme-color` meta so mobile browser chrome follows the page.

**Day mode is the default.** OS preference is deliberately not consulted - dark is applied only
when this visitor has explicitly chosen it. A tiny inline script in `index.html` applies that saved
choice *before first paint*, so there is no flash on reload. `initialMode()` in the slice must stay
in step with that script, or React would correct the theme after paint and cause the exact flash the
script exists to prevent.

### Type

**Fraunces** for display (headings, prices, the wordmark) and **Inter** for everything else — only
the weights actually loaded are used, so nothing is faux-bolded. The Tailwind `fontSize` scale is
overridden wholesale in `tailwind.config.js`: every step is smaller and more tightly leaded than
Tailwind's default, with negative tracking that grows with size.

| | | | |
| --- | --- | --- | --- |
| `2xs` 11px | `xs` 12px | `sm` 13px | `base` 14px |
| `md` 15px | `lg` 17px | `xl` 19px | `2xl` 23px |
| `3xl` 28px | `4xl` 34px | `5xl` 42px | |

Body copy sits at 15px. Headings use a single weight (600) rather than drifting between bold and
extrabold, and numerals are tabular everywhere the display face appears, so prices and ratings line
up in columns.

## SEO

The full strategy, the reasoning and the open items are in **[SEO.md](SEO.md)**. The short
version: this was a client-rendered SPA serving crawlers an empty `<div id="root">`, which
no amount of meta-tag work would have fixed. Every route is now pre-rendered to static HTML
at build time — 391 pages, ~40KB of real markup each — and the bundle hydrates it.

On top of that: per-page titles/descriptions/canonicals from one builder
([`lib/seo.js`](src/lib/seo.js)), schema.org `Course` / `Person` / `BreadcrumbList` markup
([`lib/structuredData.js`](src/lib/structuredData.js)), a generated `sitemap.xml`,
`robots.txt` that keeps filtered URLs out of the crawl budget, and a branded 1200x630
social card.

Rating markup is **off by default** — the ratings in this catalogue are demo data, and
`aggregateRating` over invented reviews is a manual-action risk. Turn it on with
`VITE_REVIEWS_ARE_REAL=true` once reviews are real.

## Checks

```bash
npm run build                                                   # production build
npx vite build --ssr scripts/smoke.js --outDir .smoke && node .smoke/smoke.js
npx vite build --ssr scripts/render-smoke.jsx --outDir .smoke && node .smoke/render-smoke.js
```

```bash
npx vite build --ssr scripts/copy-check.jsx --outDir .smoke && node .smoke/copy-check.js
```

`scripts/smoke.js` exercises the query layer and asserts placement scoring bounds (a perfect paper
lands at C2, a blank one at A1) for all eight authored banks. `scripts/render-smoke.jsx` server-renders
every route plus the placement result screen. `scripts/copy-check.jsx` strips the homepage to plain
text and flags any block over 22 words - run it after editing marketing copy to keep the page tight
(it currently totals ~505 words).

`npm run build:static` is itself a check: the prerender fails the build if any page comes
out without a title, without a canonical, or suspiciously small - which is how a missed
data preload shows up.

Two asset pipelines, both re-runnable and both requiring ImageMagick 7:

```bash
./scripts/build-logo-assets.sh   # art/Ntaka_Logo.jpg -> emblem, favicons, apple-touch icon
./scripts/build-hero-poster.sh   # source art -> transparent, theme-green WebP
./scripts/build-og-image.sh      # -> public/og-default.jpg, the 1200x630 social card
```

`build-logo-assets.sh` takes only the emblem from the supplied lockup - the NTAKA wordmark
and tagline in the artwork are unreadable below ~200px, and the UI sets the name in Fraunces
beside the badge instead.

## Known gaps

- Placement question banks exist for 8 of 25 languages; the rest use the self-check route.
- Booking, payment and auth are UI-only — buttons are wired to nothing.
- Group classes and video courses are authored up to C1; a C2 placement falls back to the nearest
  level with content.
- The project directory is `Ntaka` and the product is named **Ntaka** throughout. Your brief opened
  with "Nkata" once — if that is the intended name, it appears in `index.html`, `Logo.jsx`,
  `Footer.jsx`, `package.json` and this file.
#   N t a k a 
 
 #   N t a k a 
 
 