# Ntaka — SEO strategy

## The one thing that mattered most

Ntaka was a client-rendered SPA. A crawler requesting any URL got this:

```html
<div id="root"></div>
```

Google can execute JavaScript, but it defers rendering to a second pass and does not
guarantee it at scale. **Bing, DuckDuckGo, and every social crawler that builds a link
preview — Facebook, X, LinkedIn, WhatsApp, Slack — do not execute JavaScript at all.**
For a platform whose growth depends on people finding "learn Yoruba online" in a search
result or clicking a shared link, that is not a tuning problem. It is the whole problem.

**Fixed by pre-rendering every route to static HTML at build time.**

```bash
npm run build:static     # vite build, then prerender 391 pages + sitemap
```

Each route now ships ~40KB of real, parsed HTML with its own `<title>`, description,
canonical, Open Graph tags and JSON-LD. The React bundle then hydrates that markup rather
than replacing it, so there is no double render and no flash.

This works here because the catalogue is deterministic and known at build time. If Ntaka
gains a real backend, the same script becomes an ISR/SSR step — the render path is already
proven, only the data source changes.

---

## Keyword architecture

Search intent for this product splits three ways, and each maps to a page type.

| Intent | Query shape | Page that must win it | Volume · competition |
| --- | --- | --- | --- |
| **Learn a language** | "learn Yoruba online", "Igbo lessons", "Hausa for beginners" | `/languages/:id` | High · Medium |
| **Find a teacher** | "Yoruba tutor", "Swahili teacher online", "native Igbo speaker" | `/teachers`, `/teachers/:id` | Medium · Low |
| **Assess myself** | "what level is my Yoruba", "African language level test", "CEFR Swahili" | `/placement-test` | Low volume · **very low competition, very high intent** |

### The 25 language pages are the asset

`/languages/yoruba` is the page that should meet someone typing *learn Yoruba online*.
It already carries what that visitor needs — why the language matters, speaker numbers,
the script, teachers, classes, courses, and the CEFR ladder — so the title and description
target the query directly:

```
Learn Yorùbá Online — 6 Native Teachers | Ntaka
Learn Yorùbá with 6 native teachers from Nigeria. 1-on-1 lessons, live group
classes and video courses, A1 to C2. Free placement test.
```

Twenty-five of these, one per language, is twenty-five distinct head terms rather than one
homepage competing for all of them.

### The placement test is the underrated one

Nobody else ranks for "how do I know my Igbo level". The volume is small, but the visitor
has declared an intent to learn and the page ends by recommending teachers at their level.
That is the highest-converting traffic on the site, and it is nearly uncontested.

---

## What is implemented

### 1. Pre-rendering — [`scripts/prerender.jsx`](scripts/prerender.jsx)

391 static pages: home, 4 listings, the placement test, 25 languages, 102 teachers,
102 courses, 156 classes. Data is preloaded into a fresh Redux store per route before
render, because RTK Query subscribes in an effect and effects never run in
`renderToString`. The script fails the build if any page comes out without a title, without
a canonical, or suspiciously small (which is how a missed preload shows up).

### 2. Metadata — [`src/lib/seo.js`](src/lib/seo.js), [`src/components/common/Seo.jsx`](src/components/common/Seo.jsx)

One builder per page type. No page hand-writes a meta tag. Titles are clamped to 65
characters and descriptions to 158, cutting on a word boundary so a snippet never ends
mid-word. `<Seo>` writes into a capture registry during SSR and patches `document.head`
on the client, with no third-party head library.

Audit across all 391 pages:

```
titles over 65 chars:      0
descriptions over 158:     0
missing canonical:         0
missing JSON-LD:           0
missing h1:                0
pages with multiple h1:    0
```

### 3. Structured data — [`src/lib/structuredData.js`](src/lib/structuredData.js)

```
Course              258   video courses + group classes
BreadcrumbList      390   every page except home
Person              102   teacher profiles
CollectionPage       29   language pages + listings
EducationalOrganization / WebSite / WebApplication
```

**`Course` is the highest-value markup on this platform** — Google renders Course rich
results (provider, rating, price) directly in the SERP, and this is a course marketplace.
Group classes use `Course` with a dated, priced `CourseInstance`, which is the correct
shape for a scheduled live cohort.

Every node describes something genuinely visible on the page it ships with. That is a
Google requirement, not a preference — marking up content a visitor cannot see is how
rich results get revoked.

### 4. Crawl control

- [`public/robots.txt`](public/robots.txt) — allows everything, blocks filtered listing
  URLs (`?language=`, `?level=`, `?sort=`, `?page=`, `?q=`). Those are the same inventory
  re-ordered; they carry a canonical to the clean URL, but keeping them out of the crawl
  budget entirely is cheaper than having Google discover and discard them.
- `dist/sitemap.xml` — all 391 URLs with `lastmod`, `changefreq` and priority weighted by
  page value (home 1.0, languages 0.8, teachers 0.6, classes 0.5).

### 5. Social cards — [`scripts/build-og-image.sh`](scripts/build-og-image.sh)

A branded 1200×630 card at `public/og-default.jpg`, generated from the hero artwork.
**JPEG deliberately, not WebP:** Facebook and X handle WebP, but LinkedIn, Slack and
several WhatsApp builds still do not, and a broken preview costs more than 90KB saves.

### 6. Technical hygiene

- Exactly one `<h1>` per page, verified across all 391.
- Self-referencing canonicals everywhere; filtered views canonical to the clean URL.
- `robots` meta with `max-image-preview:large` (bigger thumbnail in results) and
  `max-snippet:-1` (no snippet truncation).
- The 404 page is `noindex, follow`.
- Fonts preconnected and `display=swap`; hero image preloaded with `fetchpriority="high"`.
- `SearchAction` in the site graph points at `/languages?q=` — and that search is now
  URL-driven, so the declaration is honest rather than decorative.

---

## What still needs doing — and cannot be done in code

SEO is roughly a third technical, two thirds content and authority. The technical third
is now done. The rest is work only you can do.

### Set the domain before deploying

Everything canonical, every OG URL and the sitemap derive from one value:

```bash
VITE_SITE_URL=https://your-real-domain.com npm run build:static
```

It currently defaults to `https://ntaka.com`. **Shipping with the wrong canonical host is
the single most damaging mistake available here** — it tells Google your pages are
duplicates of a site you do not own.

### Fix the soft 404

The SPA fallback returns HTTP 200 for unknown URLs. Google treats a 200 that looks like an
error page as a soft 404 and may distrust neighbouring URLs. Configure the host to return a
real 404 status for paths outside the sitemap (Netlify `_redirects`, Vercel `routes`, or an
Nginx `try_files` rule with an explicit error page).

### Content, in priority order

1. **A written guide per language** — "How to learn Yoruba: a complete beginner's guide".
   1,500+ words on the tone system, the alphabet, common mistakes, resources. This is what
   earns links; a listing page rarely does.
2. **Per-language placement pages** — `/placement-test/yoruba` targeting "Yoruba level
   test". Trivial to add: the wizard already accepts a language, so this is routing plus a
   `languagePlacementSeo()` builder.
3. **A visible FAQ** on the placement page ("How accurate is it?", "Is it really free?"),
   then `FAQPage` markup. Google requires FAQ markup to match visible content, which is why
   I did not add the schema alone.
4. **Real reviews.** The teacher ratings are generated demo data. `aggregateRating` markup
   must reflect genuinely collected reviews — shipping it over invented numbers risks a
   manual penalty. **Strip `aggregateRating` from the JSON-LD until reviews are real.**

### Authority

Rankings for "learn Yoruba online" will be decided by links, not markup. Realistic sources
for this niche: African studies departments, diaspora associations, language-learning
subreddits and Discords, Nigerian and Kenyan tech press, and teachers linking to their own
profiles — that last one is free distribution built into the product.

### Measure

Register Google Search Console and Bing Webmaster Tools, submit the sitemap, and watch
*Coverage* first — it will tell you within days whether pre-rendering is actually being
seen. Then track impressions per language page; the ones that get impressions but no
clicks need better titles, and that is a one-line change in `seo.js`.

---

## Known limitations

- **Class pages bake in a date.** Group classes are generated relative to build time, so a
  stale deploy advertises stale dates. Rebuild on a schedule, or drop class pages from the
  prerender list and let them stay client-rendered.
- **`aggregateRating` is on demo data.** See above — remove it before launch.
- **No `hreflang`.** Correct for now, English-only. It becomes essential the moment there
  is a Yoruba-language or French-language version of the site.
- **One shared OG image.** Per-page cards (teacher name, language) would lift click-through
  on shares meaningfully. `build-og-image.sh` is already parameterised enough to loop.
