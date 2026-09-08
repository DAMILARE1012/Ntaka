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


## What is in the product

| Feature | Route | Notes |
| --- | --- | --- |
| Homepage | `/` | Hero, language rail, placement band, the three ways to learn, teacher/class/course rails, learner stories |
| **Free placement test** | `/placement-test` (landing) · `/dashboard/placement` (test) | Speaking, writing and vocabulary across six stages → CEFR level + what to do next |
| 1-on-1 lessons | `/teachers`, `/teachers/:id` | Rating, rate, specialities and a live 7-day availability grid on every card |
| Group classes | `/classes`, `/classes/:id` | Level, topic, teacher rating, schedule and a seat meter |
| Interactive learning | `/interactive-learning`, `/interactive-learning/:id` | Self-paced on-demand courses with a module/lesson curriculum |
| Language catalogue | `/languages`, `/languages/:id` | 25 languages across 14 countries, grouped by region |
| Partners | `/partners` | Cultural bodies and associations, grouped by kind |

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

**Four skills, and the code is explicit about which it can honestly grade.**

| Skill | Scored? |
| --- | --- |
| Vocabulary & comprehension | **Yes** — multiple choice, one right answer, weighted by level |
| Writing | **Partially** — length, sentences, diacritics, expected-vocabulary overlap. Capped at B1 |
| Speaking | **No** — audio is captured for a teacher to hear, never machine-graded |
| CEFR self-check | Self-reported, used only to adjust upward |

Judging pronunciation or grammar needs a language model or a human. Rather than pretend
otherwise, [`lib/placementScoring.js`](src/lib/placementScoring.js) states the limit of each
signal, writing is hard-capped at B1 no matter how long the answer, and the result reports a
**confidence** plus a list of what a person still has to confirm. That is also the seam where
LLM scoring drops in later.

### Interactive Learning

Courses are an LMS, not a video list. Five lesson kinds — **video, audio, reading, quiz,
game** — and **every module ends in something the learner produces**, never in something they
only watch. That rule is asserted in the tests across all 102 courses.

Quizzes come in three modalities and reuse the placement components outright: multiple choice
is `QuestionCard`, written answers are `WritingTask`, spoken answers are `SpeakingTask` — so a
quiz inside a course and a task inside the placement test cannot drift apart, and the written
and spoken ones get LLM validation for free.

**Assessment is continuous.** A module can end in a *checkpoint* that re-levels the learner
mid-course and writes into their placement history, so the teachers and classes recommended to
them move as they improve. Checkpoints only move a level on an unambiguous result — all correct
or none — because two out of three is noise.

Progress is stored per lesson ([`features/learning/progressSlice.js`](src/features/learning/progressSlice.js)),
not as a single percentage, because someone returning after two weeks needs to know *which*
lesson they were on. A retry never lowers a good score.

Vocabulary for games and glossaries is authored for the eight languages with question banks;
everything else falls back to its greeting alone rather than shipping invented words.

### Placement history

Every attempt is kept ([`dashboard/placement/TestHistory.jsx`](src/dashboard/placement/TestHistory.jsx)),
newest first, with the level climb, the per-skill summary and what is still awaiting a teacher.
A single mark on a ladder is a snapshot; the history is the story, and it is the most motivating
thing the product can show a learner.

### Groq-backed assessment

Writing is assessed by **`openai/gpt-oss-20b`** on Groq; transcription, where possible, by
**`whisper-large-v3`**. [`server/assess-placement.js`](server/assess-placement.js) holds
`GROQ_API_KEY` — server environment only, same rule as Daily.

**Whisper covers 8 of the 25 languages. Igbo is not one of them**, and neither is any Nguni,
Ghanaian or Senegambian language in the catalogue. Igbo audio is therefore never sent: it goes
to a teacher instead. Auto-detecting would be worse than nothing, because Whisper would
transcribe it as a language it does know and invent fluent, plausible text. Even where
supported, low-resource African languages run 25–35% word error or worse, so the transcript is
used only for coarse signals — how much of the answer was in the target language, and whether a
read-aloud resembles its target. **Pronunciation is never machine-scored.**

Three properties the tests pin down:

- **The model advises, it never decides.** A verdict can move the writing level by at most one
  step from the heuristic, and only when it is confident and actually read the target language.
  `insufficient`, low confidence, or an answer written in English all leave the heuristic alone.
- **It fails open.** No key, a 500, a timeout, malformed JSON — every path returns `null` and
  scoring falls back to the heuristic. A learner is never blocked because Groq had a bad minute.
- **Learner text is untrusted input.** It is fenced in the prompt and labelled as data, and the
  system message forbids following instructions found inside it.

**Before shipping:** sending a recording to Groq makes them a sub-processor of personal data
under NDPR and GDPR, and their terms allow files to persist up to 30 days. `consented` is a hard
gate in the handler, but you still need consent copy at the point of recording and a privacy
policy naming Groq.

Speaking uses `MediaRecorder`, which needs a mic grant and a secure context. Every failure path —
denied, no microphone, unsupported browser — offers *skip* rather than trapping the learner.

**The test lives behind auth**, at `/dashboard/placement`: it records audio, writes a result
against the account and drives every recommendation afterwards. `/placement-test` stays public as
a landing page, because "what level is my Yoruba" is the highest-intent search term this platform
has and that URL must remain indexable.

### Nobody learns before they are placed

This is a hard rule, not a nudge. A learner cannot book a 1-on-1, reserve a group-class seat or
open an interactive course until they have taken the free placement test **in that language**.

One implementation decides it — [`usePlacementGate`](src/features/placement/usePlacementGate.js) —
so the rule cannot drift between surfaces. It is applied at four action points:

| Surface | Behaviour when unplaced |
| --- | --- |
| Teacher profile | Gate shown, booking button reads "Find your level first" |
| Group class detail | Gate shown, reserve button disabled |
| Course detail | Gate shown, no link into the player |
| Course player | **Page replaced entirely**, and no enrolment row is created |

**There is no escape hatch.** An earlier version let a learner declare their own level; that was
removed deliberately. A self-declared level is a guess, and a guess puts them in the wrong lesson,
wastes a teacher's preparation, and produces the refund that costs more than the friction saved.

Three things the gate is careful about:

- **Browsing stays open.** Listings, profiles, prices and availability are all visible without a
  placement — someone has to be able to look before they decide, and those pages are the SEO.
- **It is per language.** Placed at B2 in Yorùbá still means A1 in Igbo, and the gate says so.
- **It is not a dead end.** The gate carries `?language=` and `?returnTo=`, so the test opens
  pre-selected and the result screen offers *"Carry on where you left off"*.

Teachers and admins are not gated; signed-out visitors see "Sign in to book" first, then the test.

Two routes through the questions, one result shape:

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


## Architecture

```
src/
├── app/                     store, typed-ish hooks, useDebounced
├── lib/                     cefr · timezone · booking · meetings · format · prng  (pure)
├── server/                  join-lesson.js - deployable, holds DAILY_API_KEY
├── services/
│   ├── api.js               ← the single RTK Query API surface
│   └── mock/partners.js     partner list - add an entry + a source logo, nothing else changes
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
├── pages/                   thin route components — compose feature components, hold no logic
└── dashboard/               THE AUTHENTICATED APP — separate tree, shares only components/ + services/
    ├── auth/                authSlice, LoginPage, SignupPage, RequireAuth, AuthLayout, AuthField
    ├── layout/              DashboardLayout, Sidebar, navigation.js (nav as data, per role)
    ├── components/          Panel, PageTitle, StatTile, ComingSoon
    ├── learner/             LearnerOverview, MyLessons
    ├── placement/           PlacementPage, TestHistory
    ├── learning/            CoursePlayer, MyCourses
    ├── teacher/             TeacherOverview, SchedulePage, AvailabilityEditor
    ├── admin/               AdminOverview
    ├── lesson/              LessonRoom (pre-join, countdown, call frame)
    └── DashboardRoutes.jsx
```

**The public/private split.** `src/pages` + `src/features` are the marketing site: prerendered,
indexable, no auth. `src/dashboard` is the product: client-only, `noindex`, route-guarded, never
prerendered. They share the design system and the data layer and nothing else. `App.jsx` keeps them
in separate route trees so neither can accidentally pull in the other's chrome.

### Availability and booking

Availability is stored as **weekly rules plus dated exceptions**, never as generated slot rows.
"Tuesdays 18:00-21:00, except 3 June" stays two small records forever; materialising slots would
mean an unbounded table and a migration every time a teacher changes their week.

Slots are derived on read by one pure function in [`lib/booking.js`](src/lib/booking.js). The grid
on a teacher card, the grid on their profile and the times in the booking picker all call it, so
they cannot disagree - that class of bug ("the grid says free, booking says no") is designed out
rather than tested for.

**Timezones are the real work.** A teacher publishes wall-clock time in their own zone; a learner
reads it in theirs. [`lib/timezone.js`](src/lib/timezone.js) does the conversion through the IANA
database via `Intl`, with a two-pass algorithm so the hour either side of a DST change is right.
Everything is stored as a UTC instant. A Lagos teacher (no DST) and a London learner (DST) drift by
an hour twice a year under naive date maths; `schedule-check.js` asserts they do not here.

Conflict detection runs again inside `createBooking`, not only in the picker: between rendering a
slot and clicking it, someone else may have taken it. In Postgres that check belongs in a
transaction with a unique constraint on `(teacher_id, starts_at)`.

### Lesson rooms

Video runs on Daily.co. The rule the whole design turns on: **rooms and join tokens are
minted server-side, never in the browser.**

[`server/join-lesson.js`](server/join-lesson.js) is the only place a room or token is created.
It verifies the caller is the learner or teacher on that booking, that the booking is not
cancelled, and that now is inside the join window, then creates a private room with a random
UUID name and mints a token whose `is_owner` comes from the database. Three rules it exists to
enforce:

1. **Room names are random UUIDs**, never derived from the booking id - a derived name is
   guessable, and a guessable room is an open door.
2. **The role comes from the database**, never the request body - otherwise a learner claims
   `is_owner` and can mute or eject their own teacher.
3. **`DAILY_API_KEY` is server-only.** Vite inlines every `VITE_` variable into public
   JavaScript, so a key named `VITE_DAILY_API_KEY` is a published credential.

Until that function is deployed, [`services/mock/meetings.js`](src/services/mock/meetings.js)
stands in - and it imports the *same* `evaluateJoinWindow` from
[`lib/meetings.js`](src/lib/meetings.js) that the server uses. The authorisation behaviour you
see locally is the behaviour you get in production; only the transport differs. What it cannot
fake is a real room, so it returns `provider: 'mock'` and the UI renders a stand-in frame rather
than pretending a connection exists.

`@daily-co/daily-js` is imported dynamically inside an effect: it is a 265KB chunk only this
screen needs, and it touches `window` at module scope, which would break the prerender build.

### Auth

Demo accounts, any password of 6+ characters:

| Email | Role |
| --- | --- |
| `learner@ntaka.com` | Learner |
| `teacher@ntaka.com` | Teacher (bound to a real catalogue teacher) |
| `admin@ntaka.com` | Administrator |

Sessions are held in `dashboard/auth/authSlice.js` and mirrored to `localStorage` so a refresh does
not sign you out. **That mirror is a convenience, never a security boundary** — `RequireAuth` only
stops a signed-out visitor landing on a broken screen. Every real endpoint must re-check the caller
server-side.

[`services/authApi.js`](src/services/authApi.js) is the only place a session is created or read.
Moving to Supabase Auth means replacing four function bodies there and deleting
`services/mock/accounts.js`; nothing else changes.

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

**Two marquees share one implementation** — the hero language rail and the homepage partner
slider. The track holds two identical groups and animates to `translateX(-50%)`, exactly one group
wide, so the loop is seamless. The partner slider runs the reverse keyframe, because two bands
sliding the same way on one page reads as a glitch.

The geometry that has to hold: a group is exactly `n x (cardWidth + gap)`, with the gap carried as
a trailing margin rather than a `gap` on the track. Put the gap on the track and the loop drifts by
half of it every pass. The partner slider also repeats its list until a group clears the widest
container, so a two-partner list does not leave a hole on a wide screen.

**The hero language rail** additionally measures tile width against the container with a
`translateX(-50%)`, exactly one group wide, so the loop is seamless. Tile width is measured from the
container with a `ResizeObserver` (four across on desktop, three then two as it narrows) and the
duration is derived from it, so the speed stays constant at 52px/s whatever the catalogue size. It
pauses on hover and `:focus-within`, and is disabled entirely under `prefers-reduced-motion`.


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

```bash
npx vite build --ssr scripts/auth-check.jsx --outDir .smoke && node .smoke/auth-check.js
```

`scripts/auth-check.jsx` covers credential handling, signup validation, the route guard, and role
isolation - that a learner cannot render admin or teacher panels. 24 assertions.

```bash
npx vite build --ssr scripts/schedule-check.js --outDir .smoke && node .smoke/schedule-check.js
npx vite build --ssr scripts/booking-check.jsx --outDir .smoke && node .smoke/booking-check.js
```

```bash
npx vite build --ssr scripts/placement-check.js --outDir .smoke && node .smoke/placement-check.js
```

```bash
npx vite build --ssr scripts/groq-check.js --outDir .smoke && node .smoke/groq-check.js
```

```bash
npx vite build --ssr scripts/learning-check.jsx --outDir .smoke && node .smoke/learning-check.js
```

```bash
npx vite build --ssr scripts/gate-check.jsx --outDir .smoke && node .smoke/gate-check.js
```

`scripts/gate-check.jsx` proves the rule holds: an unplaced learner is blocked at all four action
points, the player refuses a direct URL and creates no progress row, browsing still works, the
"I know my level" escape is gone, being placed in Yorùbá still blocks Igbo, and teachers are not
gated. 29 assertions.

`scripts/learning-check.js` walks the LMS: all 102 courses build a playable curriculum, every
module ends actively, all three quiz modalities appear, a retry never lowers a good score, and a
checkpoint writes a level change into the placement history. 34 assertions.

`scripts/groq-check.js` covers the assessment layer: Igbo is never sent to Whisper, no consent
means no third party, a confident model verdict can still only move the level one step, an answer
written in English lands at A1 rather than C1, and every Groq failure mode returns null instead of
throwing. 44 assertions.

`scripts/placement-check.js` guards the honesty of the scoring: writing never claims above its
B1 cap even for a 180-word answer, speaking never returns a level at all, a weak self-check can
never drag a learner down, and confidence degrades when parts are skipped. 33 assertions.

`scripts/schedule-check.js` is the one to keep green. 30 assertions on timezone arithmetic and
slot generation, including both sides of a real DST transition (BST begins 29 March 2026) and a
UTC+14 zone. It caught a genuine off-by-one in `calendarDays` that only appears past UTC+12.

```bash
npx vite build --ssr scripts/meeting-check.jsx --outDir .smoke && node .smoke/meeting-check.js
```

`scripts/meeting-check.jsx` exercises the join rules and then runs **the real server handler**
against a stubbed Daily API: a stranger is refused 403 with no token minted, a learner's token is
never `is_owner`, the room name is random rather than derived, the API key travels only in the
Authorization header, and a missing key fails closed rather than open. 27 assertions.

`scripts/booking-check.jsx` runs the booking spine end to end: slots derive from rules, the lead
time holds, a booking removes exactly the overlapping candidate starts, double-booking and
past-dating are refused, only one trial per teacher, a stranger cannot cancel your lesson,
cancelling returns the slot, editing rules re-derives everything, and each screen renders behind
the right guard. 34 assertions.

`npm run build:static` is itself a check: the prerender fails the build if any page comes
out without a title, without a canonical, or suspiciously small - which is how a missed
data preload shows up.

Two asset pipelines, both re-runnable and both requiring ImageMagick 7:

```bash
./scripts/build-partner-logos.sh # art/partners/* -> normalised square WebP tiles
./scripts/build-logo-assets.sh   # art/Ntaka_Logo.jpg -> emblem, favicons, apple-touch icon
./scripts/build-hero-poster.sh   # source art -> transparent, theme-green WebP
./scripts/build-og-image.sh      # -> public/og-default.jpg, the 1200x630 social card
```

`build-partner-logos.sh` exists because supplied logos arrive in four different states: one
was a transparent PNG saved as JPEG with the editor's **checkerboard baked into the pixels**,
one was a black-ground avatar crop, one was genuinely transparent, one was landscape with a
caption. It flood-fills the outer ground to white from the corners — never a global colour key,
which would punch holes through the artwork — then trims and pads to a square tile. Output is
~15KB WebP each, down from 22-110KB.

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
#
